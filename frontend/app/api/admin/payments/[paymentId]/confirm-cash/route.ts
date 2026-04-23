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

export async function POST(
  request: Request,
  context: { params: Promise<{ paymentId: string }> },
) {
  const requestId = getRequestCorrelationId(request);
  const startedAt = Date.now();
  const { paymentId } = await context.params;
  const accessToken = await getRequiredServerAccessToken().catch((error) => {
    if (error instanceof BackendApiError) {
      return error;
    }

    throw error;
  });

  if (accessToken instanceof BackendApiError) {
    logServerEvent("warn", "frontend.admin.cash_confirm.unauthorized", {
      requestId,
      paymentId,
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

  const body = await request.text();

  try {
    const response = await requestBackendJson(
      `/api/v1/admin/payments/${paymentId}/confirm-cash`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body,
      },
    );

    logServerEvent("info", "frontend.admin.cash_confirm.success", {
      requestId,
      paymentId,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BackendApiError) {
      logServerEvent("warn", "frontend.admin.cash_confirm.backend_error", {
        requestId,
        paymentId,
        status: error.status,
        durationMs: Date.now() - startedAt,
      });

      return NextResponse.json(
        {
          message: error.message,
          ...(typeof error.payload === "object" && error.payload !== null
            ? (error.payload as Record<string, unknown>)
            : {}),
        },
        { status: error.status },
      );
    }

    logServerEvent("error", "frontend.admin.cash_confirm.unhandled_error", {
      requestId,
      paymentId,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      {
        message: "Konfirmasi pembayaran tunai belum bisa diproses sekarang.",
      },
      { status: 500 },
    );
  }
}
