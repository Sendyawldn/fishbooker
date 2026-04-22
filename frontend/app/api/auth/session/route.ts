import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { BackendApiError, requestBackendJson } from "@/lib/server/backend-api";
import {
  AUTH_ACCESS_TOKEN_COOKIE,
  AUTH_CONTEXT_COOKIE,
  clearAuthCookies,
  readAuthContextCookie,
  setAuthCookies,
  type AuthenticatedUser,
} from "@/lib/server/auth-cookies";

interface BackendMeResponse {
  user: AuthenticatedUser;
}

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_ACCESS_TOKEN_COOKIE)?.value;
  const authContext = readAuthContextCookie(
    cookieStore.get(AUTH_CONTEXT_COOKIE)?.value,
  );

  if (!accessToken || !authContext) {
    clearAuthCookies(cookieStore);

    return NextResponse.json({
      user: null,
    });
  }

  try {
    const sessionResponse = await requestBackendJson<BackendMeResponse>(
      "/api/v1/auth/me",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    setAuthCookies(cookieStore, accessToken, sessionResponse.user);

    return NextResponse.json({
      user: sessionResponse.user,
    });
  } catch (error) {
    if (error instanceof BackendApiError && error.status < 500) {
      clearAuthCookies(cookieStore);

      return NextResponse.json({
        user: null,
      });
    }

    return NextResponse.json(
      {
        message: "Sesi belum bisa diverifikasi sekarang.",
      },
      { status: 500 },
    );
  }
}
