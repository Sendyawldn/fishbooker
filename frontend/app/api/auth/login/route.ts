import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { BackendApiError, requestBackendJson } from "@/lib/server/backend-api";
import {
  setAuthCookies,
  type AuthenticatedUser,
} from "@/lib/server/auth-cookies";

interface BackendLoginResponse {
  access_token: string;
  user: AuthenticatedUser;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;

  if (
    !body ||
    typeof body.email !== "string" ||
    typeof body.password !== "string"
  ) {
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

    return NextResponse.json({
      user: loginResponse.user,
    });
  } catch (error) {
    if (error instanceof BackendApiError) {
      return NextResponse.json(
        {
          message: error.message,
          errors: error.payload,
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        message: "Tidak bisa login sekarang. Coba lagi beberapa saat.",
      },
      { status: 500 },
    );
  }
}
