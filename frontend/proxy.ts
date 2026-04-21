import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  AUTH_SESSION_COOKIE,
  parseAuthSession,
} from "@/lib/auth-session-shared";

function redirectToHome(request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL("/", request.url));
}

export function proxy(request: NextRequest): NextResponse {
  const authCookie = request.cookies.get(AUTH_SESSION_COOKIE)?.value ?? null;
  const session = authCookie
    ? parseAuthSession(decodeURIComponent(authCookie))
    : null;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (!session || session.user.role !== "ADMIN") {
      return redirectToHome(request);
    }
  }

  if (pathname.startsWith("/bookings")) {
    if (!session) {
      return redirectToHome(request);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/bookings/:path*"],
};
