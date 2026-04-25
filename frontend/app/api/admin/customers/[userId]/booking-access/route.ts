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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const requestId = getRequestCorrelationId(request);
  const startedAt = Date.now();
  const accessToken = await getRequiredServerAccessToken().catch((error) => {
    if (error instanceof BackendApiError) {
      return error;
    }

    throw error;
  });

  const { userId } = await context.params;

  if (accessToken instanceof BackendApiError) {
    logServerEvent("warn", "frontend.admin.customers.booking_access.unauthorized", {
      requestId,
      userId,
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
      `/api/v1/admin/customers/${userId}/booking-access`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body,
      },
    );

    logServerEvent("info", "frontend.admin.customers.booking_access.updated", {
      requestId,
      userId,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BackendApiError) {
      logServerEvent("warn", "frontend.admin.customers.booking_access.backend_error", {
        requestId,
        userId,
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

    logServerEvent("error", "frontend.admin.customers.booking_access.unhandled_error", {
      requestId,
      userId,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      {
        message: "Booking access pelanggan belum bisa diperbarui sekarang.",
      },
      { status: 500 },
    );
  }
}
