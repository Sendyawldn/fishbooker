import { createHash, createHmac, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  BackendApiError,
  getRequiredServerAccessToken,
  requestBackendJson,
} from "@/lib/server/backend-api";
import {
  getRequestCorrelationId,
  logServerEvent,
} from "@/lib/server/observability";

type PaymentStatus = "PAID" | "FAILED" | "CANCELLED";

interface PaymentDetailResponse {
  success: boolean;
  data: {
    reference: string;
    provider: string;
    amount: number;
  };
}

function buildManualWebhookSignature(rawPayload: string): string {
  const secret =
    process.env.MANUAL_PAYMENT_WEBHOOK_SECRET ??
    "local-manual-payment-secret";

  return createHmac("sha256", secret).update(rawPayload).digest("hex");
}

function getMidtransWebhookSimulationServerKey(): string {
  const serverKey = process.env.MIDTRANS_WEBHOOK_SIMULATION_SERVER_KEY;

  if (!serverKey) {
    throw new Error(
      "MIDTRANS_WEBHOOK_SIMULATION_SERVER_KEY belum diatur untuk simulasi lokal.",
    );
  }

  return serverKey;
}

function formatMidtransGrossAmount(amount: number): string {
  return amount.toFixed(2);
}

function buildMidtransSimulationPayload(
  reference: string,
  amount: number,
  status: PaymentStatus,
) {
  const statusCode = status === "PAID" ? "200" : "202";
  const grossAmount = formatMidtransGrossAmount(amount);
  const transactionStatus =
    status === "PAID" ? "settlement" : status === "CANCELLED" ? "cancel" : "deny";
  const transactionTime = new Date().toISOString().slice(0, 19).replace("T", " ");
  const serverKey = getMidtransWebhookSimulationServerKey();

  return {
    order_id: reference,
    status_code: statusCode,
    gross_amount: grossAmount,
    transaction_status: transactionStatus,
    transaction_id: `midtrans-sim-${randomUUID()}`,
    payment_type: "bank_transfer",
    signature_key: createHash("sha512")
      .update(reference + statusCode + grossAmount + serverKey)
      .digest("hex"),
    transaction_time: transactionTime,
    settlement_time: status === "PAID" ? transactionTime : undefined,
  };
}

export async function POST(
  request: Request,
  context: { params: Promise<{ reference: string }> },
) {
  const requestId = getRequestCorrelationId(request);
  const startedAt = Date.now();
  const { reference } = await context.params;
  const accessToken = await getRequiredServerAccessToken().catch((error) => {
    if (error instanceof BackendApiError) {
      return error;
    }

    throw error;
  });

  if (accessToken instanceof BackendApiError) {
    logServerEvent("warn", "frontend.payments.simulate.unauthorized", {
      requestId,
      reference,
      status: accessToken.status,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      {
        message: accessToken.message,
      },
      { status: accessToken.status },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { status?: PaymentStatus }
    | null;

  const status = body?.status ?? "PAID";

  if (!["PAID", "FAILED", "CANCELLED"].includes(status)) {
    logServerEvent("warn", "frontend.payments.simulate.invalid_status", {
      requestId,
      reference,
      statusAttempted: status,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      {
        message: "Status simulasi pembayaran tidak valid.",
      },
      { status: 422 },
    );
  }

  try {
    const paymentDetail = await requestBackendJson<PaymentDetailResponse>(
      `/api/v1/payments/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (paymentDetail.data.provider === "MANUAL") {
      const payload = {
        payment_reference: reference,
        status,
        event_type: "payment.simulated",
        event_time: new Date().toISOString(),
      };
      const rawPayload = JSON.stringify(payload);

      await requestBackendJson("/api/v1/payments/webhooks/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Fishbooker-Event-Id": `sim-${randomUUID()}`,
          "X-Fishbooker-Signature": buildManualWebhookSignature(rawPayload),
        },
        body: rawPayload,
      });
    } else if (paymentDetail.data.provider === "MIDTRANS") {
      const payload = buildMidtransSimulationPayload(
        reference,
        paymentDetail.data.amount,
        status,
      );

      await requestBackendJson("/api/v1/payments/webhooks/midtrans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } else {
      throw new BackendApiError(
        "Provider pembayaran ini belum mendukung simulasi lokal.",
        409,
        paymentDetail,
      );
    }

    const updatedPayment = await requestBackendJson(`/api/v1/payments/${reference}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    logServerEvent("info", "frontend.payments.simulate.success", {
      requestId,
      reference,
      paymentStatus: status,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(updatedPayment);
  } catch (error) {
    if (error instanceof BackendApiError) {
      logServerEvent("warn", "frontend.payments.simulate.backend_error", {
        requestId,
        reference,
        status: error.status,
        durationMs: Date.now() - startedAt,
      });

      return NextResponse.json(
        {
          message: error.message,
        },
        { status: error.status },
      );
    }

    logServerEvent("error", "frontend.payments.simulate.unhandled_error", {
      requestId,
      reference,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      {
        message: "Simulasi pembayaran gagal diproses.",
      },
      { status: 500 },
    );
  }
}
