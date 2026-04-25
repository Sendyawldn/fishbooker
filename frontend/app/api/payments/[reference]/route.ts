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

export async function GET(
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
    logServerEvent("warn", "frontend.payments.detail.unauthorized", {
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

  try {
    const response = await requestBackendJson(`/api/v1/payments/${reference}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    logServerEvent("info", "frontend.payments.detail.success", {
      requestId,
      reference,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BackendApiError) {
      logServerEvent("warn", "frontend.payments.detail.backend_error", {
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

    logServerEvent("error", "frontend.payments.detail.unhandled_error", {
      requestId,
      reference,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      {
        message: "Detail pembayaran belum bisa diambil sekarang.",
      },
      { status: 500 },
    );
  }
}
