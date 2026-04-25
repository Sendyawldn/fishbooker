import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  BackendApiError,
  getServerAccessToken,
  requestBackendJson,
} from "@/lib/server/backend-api";
import { clearAuthCookies } from "@/lib/server/auth-cookies";
import {
  getRequestCorrelationId,
  logServerEvent,
} from "@/lib/server/observability";

export async function POST(request: Request) {
  const requestId = getRequestCorrelationId(request);
  const startedAt = Date.now();
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
        logServerEvent("error", "frontend.auth.logout.unhandled_error", {
          requestId,
          durationMs: Date.now() - startedAt,
        });

        return NextResponse.json(
          {
            message: "Logout belum bisa diproses.",
          },
          { status: 500 },
        );
      }

      logServerEvent("warn", "frontend.auth.logout.backend_error", {
        requestId,
        status: error.status,
        durationMs: Date.now() - startedAt,
      });
    }
  }

  const cookieStore = await cookies();
  clearAuthCookies(cookieStore);

  logServerEvent("info", "frontend.auth.logout.success", {
    requestId,
    hadAccessToken: Boolean(accessToken),
    durationMs: Date.now() - startedAt,
  });

  return NextResponse.json({
    success: true,
  });
}
