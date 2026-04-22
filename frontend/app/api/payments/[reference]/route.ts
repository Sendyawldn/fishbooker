import { NextResponse } from "next/server";
import {
  BackendApiError,
  getRequiredServerAccessToken,
  requestBackendJson,
} from "@/lib/server/backend-api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ reference: string }> },
) {
  const { reference } = await context.params;
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
    const response = await requestBackendJson(`/api/v1/payments/${reference}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return NextResponse.json(response);
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
        message: "Detail pembayaran belum bisa diambil sekarang.",
      },
      { status: 500 },
    );
  }
}
