import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { BackendApiError, requestBackendJson } from "@/lib/server/backend-api";
import {
  getRequestCorrelationId,
  logServerEvent,
} from "@/lib/server/observability";
import {
  setAuthCookies,
  type AuthenticatedUser,
} from "@/lib/server/auth-cookies";

interface BackendLoginResponse {
  access_token: string;
  user: AuthenticatedUser;
}

export async function POST(request: Request) {
  const requestId = getRequestCorrelationId(request);
  const startedAt = Date.now();
  const body = (await request.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;

  if (
    !body ||
    typeof body.email !== "string" ||
    typeof body.password !== "string"
  ) {
    logServerEvent("warn", "frontend.auth.login.invalid_payload", {
      requestId,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      {
        message: "Email dan password wajib dikirim.",
      },
      { status: 422 },
    );
  }

  try {
    const loginResponse = await requestBackendJson<BackendLoginResponse>(
      "/api/v1/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    const cookieStore = await cookies();
    setAuthCookies(cookieStore, loginResponse.access_token, loginResponse.user);

    logServerEvent("info", "frontend.auth.login.success", {
      requestId,
      userId: loginResponse.user.id,
      role: loginResponse.user.role,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json({
      user: loginResponse.user,
    });
  } catch (error) {
    if (error instanceof BackendApiError) {
      logServerEvent("warn", "frontend.auth.login.backend_error", {
        requestId,
        status: error.status,
        durationMs: Date.now() - startedAt,
      });

      return NextResponse.json(
        {
          message: error.message,
          errors: error.payload,
        },
        { status: error.status },
      );
    }

    logServerEvent("error", "frontend.auth.login.unhandled_error", {
      requestId,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      {
        message: "Tidak bisa login sekarang. Coba lagi beberapa saat.",
      },
      { status: 500 },
    );
  }
}
