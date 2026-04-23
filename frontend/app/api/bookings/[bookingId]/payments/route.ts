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
  context: { params: Promise<{ bookingId: string }> },
) {
  const requestId = getRequestCorrelationId(request);
  const startedAt = Date.now();
  const { bookingId } = await context.params;
  const accessToken = await getRequiredServerAccessToken().catch((error) => {
    if (error instanceof BackendApiError) {
      return error;
    }

    throw error;
  });

  if (accessToken instanceof BackendApiError) {
    logServerEvent("warn", "frontend.payments.create.unauthorized", {
      requestId,
      bookingId,
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
      `/api/v1/bookings/${bookingId}/payments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body,
      },
    );

    logServerEvent("info", "frontend.payments.create.success", {
      requestId,
      bookingId,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BackendApiError) {
      logServerEvent("warn", "frontend.payments.create.backend_error", {
        requestId,
        bookingId,
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

    logServerEvent("error", "frontend.payments.create.unhandled_error", {
      requestId,
      bookingId,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      {
        message: "Pembayaran belum bisa disiapkan sekarang.",
      },
      { status: 500 },
    );
  }
}
