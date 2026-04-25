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

export async function GET(request: Request) {
  const requestId = getRequestCorrelationId(request);
  const startedAt = Date.now();
  const accessToken = await getRequiredServerAccessToken().catch((error) => {
    if (error instanceof BackendApiError) {
      return error;
    }

    throw error;
  });

  if (accessToken instanceof BackendApiError) {
    logServerEvent("warn", "frontend.admin.customers.unauthorized", {
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

  const targetUrl = new URL(request.url);

  try {
    const response = await requestBackendJson(
      `/api/v1/admin/customers${targetUrl.search}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    logServerEvent("info", "frontend.admin.customers.success", {
      requestId,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BackendApiError) {
      logServerEvent("warn", "frontend.admin.customers.backend_error", {
        requestId,
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

    logServerEvent("error", "frontend.admin.customers.unhandled_error", {
      requestId,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      {
        message: "Daftar pelanggan admin belum bisa dimuat sekarang.",
      },
      { status: 500 },
    );
  }
}
