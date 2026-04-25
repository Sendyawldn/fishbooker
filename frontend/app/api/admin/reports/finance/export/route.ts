import { NextResponse } from "next/server";
import {
  BackendApiError,
  getRequiredServerAccessToken,
  requestBackendResponse,
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
    logServerEvent("warn", "frontend.admin.finance_export.unauthorized", {
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

  try {
    const backendResponse = await requestBackendResponse(
      "/api/v1/admin/reports/finance/export",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const csvContent = await backendResponse.text();

    logServerEvent("info", "frontend.admin.finance_export.success", {
      requestId,
      durationMs: Date.now() - startedAt,
    });

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type":
          backendResponse.headers.get("content-type") ??
          "text/csv; charset=UTF-8",
        "Content-Disposition":
          backendResponse.headers.get("content-disposition") ??
          'attachment; filename="fishbooker-finance-report.csv"',
      },
    });
  } catch (error) {
    if (error instanceof BackendApiError) {
      logServerEvent("warn", "frontend.admin.finance_export.backend_error", {
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

    logServerEvent("error", "frontend.admin.finance_export.unhandled_error", {
      requestId,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      {
        message: "Export laporan belum bisa dibuat sekarang.",
      },
      { status: 500 },
    );
  }
}
