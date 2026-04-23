import { createHmac, randomUUID } from "node:crypto";
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
  };
}

function buildManualWebhookSignature(rawPayload: string): string {
  const secret =
    process.env.MANUAL_PAYMENT_WEBHOOK_SECRET ??
    "local-manual-payment-secret";

  return createHmac("sha256", secret).update(rawPayload).digest("hex");
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
    await requestBackendJson<PaymentDetailResponse>(`/api/v1/payments/${reference}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

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
