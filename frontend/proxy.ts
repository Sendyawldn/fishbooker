import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  AUTH_CONTEXT_COOKIE,
  readAuthContextCookie,
} from "@/lib/server/auth-cookies";

function redirectToHome(request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL("/", request.url));
}

export function proxy(request: NextRequest): NextResponse {
  const authContext = readAuthContextCookie(
    request.cookies.get(AUTH_CONTEXT_COOKIE)?.value,
  );
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (!authContext || authContext.role !== "ADMIN") {
      return redirectToHome(request);
    }
  }

  if (pathname.startsWith("/bookings")) {
    if (!authContext) {
      return redirectToHome(request);
    }
  }

  if (pathname.startsWith("/payments")) {
    if (!authContext) {
      return redirectToHome(request);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/bookings/:path*", "/payments/:path*"],
};
