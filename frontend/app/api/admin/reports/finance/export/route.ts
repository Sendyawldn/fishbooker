import { NextResponse } from "next/server";
import {
  BackendApiError,
  getRequiredServerAccessToken,
  requestBackendResponse,
} from "@/lib/server/backend-api";

export async function GET() {
  const accessToken = await getRequiredServerAccessToken().catch((error) => {
    if (error instanceof BackendApiError) {
      return error;
    }

    throw error;
  });

  if (accessToken instanceof BackendApiError) {
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
      return NextResponse.json(
        {
          message: error.message,
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        message: "Export laporan belum bisa dibuat sekarang.",
      },
      { status: 500 },
    );
  }
}
