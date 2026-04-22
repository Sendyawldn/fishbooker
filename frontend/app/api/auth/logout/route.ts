import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  BackendApiError,
  getServerAccessToken,
  requestBackendJson,
} from "@/lib/server/backend-api";
import { clearAuthCookies } from "@/lib/server/auth-cookies";

export async function POST() {
  const accessToken = await getServerAccessToken();

  if (accessToken) {
    try {
      await requestBackendJson("/api/v1/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      if (!(error instanceof BackendApiError) || error.status >= 500) {
        return NextResponse.json(
          {
            message: "Logout belum bisa diproses.",
          },
          { status: 500 },
        );
      }
    }
  }

  const cookieStore = await cookies();
  clearAuthCookies(cookieStore);

  return NextResponse.json({
    success: true,
  });
}
