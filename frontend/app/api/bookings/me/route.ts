import { NextResponse } from "next/server";
import {
  BackendApiError,
  getRequiredServerAccessToken,
  requestBackendJson,
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
    const response = await requestBackendJson("/api/v1/bookings/me", {
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
        message: "Riwayat booking belum bisa diambil sekarang.",
      },
      { status: 500 },
    );
  }
}
