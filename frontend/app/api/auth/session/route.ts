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
import {
  getRequestCorrelationId,
  logServerEvent,
} from "@/lib/server/observability";

interface BackendMeResponse {
  user: AuthenticatedUser;
}

export async function GET(request: Request) {
  const requestId = getRequestCorrelationId(request);
  const startedAt = Date.now();
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_ACCESS_TOKEN_COOKIE)?.value;
  const authContext = readAuthContextCookie(
    cookieStore.get(AUTH_CONTEXT_COOKIE)?.value,
  );

  if (!accessToken || !authContext) {
    clearAuthCookies(cookieStore);

    logServerEvent("info", "frontend.auth.session.empty", {
      requestId,
      hasAccessToken: Boolean(accessToken),
      hasAuthContext: Boolean(authContext),
      durationMs: Date.now() - startedAt,
    });

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

    logServerEvent("info", "frontend.auth.session.success", {
      requestId,
      userId: sessionResponse.user.id,
      role: sessionResponse.user.role,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json({
      user: sessionResponse.user,
    });
  } catch (error) {
    if (error instanceof BackendApiError && error.status < 500) {
      clearAuthCookies(cookieStore);

      logServerEvent("warn", "frontend.auth.session.invalidated", {
        requestId,
        status: error.status,
        durationMs: Date.now() - startedAt,
      });

      return NextResponse.json({
        user: null,
      });
    }

    logServerEvent("error", "frontend.auth.session.unhandled_error", {
      requestId,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      {
        message: "Sesi belum bisa diverifikasi sekarang.",
      },
      { status: 500 },
    );
  }
}
