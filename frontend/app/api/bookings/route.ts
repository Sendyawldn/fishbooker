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

export async function POST(request: Request) {
  const requestId = getRequestCorrelationId(request);
  const startedAt = Date.now();
  const accessToken = await getRequiredServerAccessToken().catch((error) => {
    if (error instanceof BackendApiError) {
      return error;
    }

    throw error;
  });

  if (accessToken instanceof BackendApiError) {
    logServerEvent("warn", "frontend.bookings.create.unauthorized", {
      requestId,
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
    const response = await requestBackendJson("/api/v1/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body,
    });

    logServerEvent("info", "frontend.bookings.create.success", {
      requestId,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BackendApiError) {
      logServerEvent("warn", "frontend.bookings.create.backend_error", {
        requestId,
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

    logServerEvent("error", "frontend.bookings.create.unhandled_error", {
      requestId,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      {
        message: "Booking belum bisa diproses sekarang.",
      },
      { status: 500 },
    );
  }
}
