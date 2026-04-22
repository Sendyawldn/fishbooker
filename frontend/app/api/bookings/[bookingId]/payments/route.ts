import { NextResponse } from "next/server";
import {
  BackendApiError,
  getRequiredServerAccessToken,
  requestBackendJson,
} from "@/lib/server/backend-api";

export async function POST(
  request: Request,
  context: { params: Promise<{ bookingId: string }> },
) {
  const { bookingId } = await context.params;
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

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BackendApiError) {
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

    return NextResponse.json(
      {
        message: "Pembayaran belum bisa disiapkan sekarang.",
      },
      { status: 500 },
    );
  }
}
