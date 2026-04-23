import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import {
  AUTH_ACCESS_TOKEN_COOKIE,
  AUTH_CONTEXT_COOKIE,
  buildSignedAuthContext,
  createAuthContext,
  getAuthCookieMaxAgeSeconds,
  parseSignedAuthContext,
  type AuthRole,
  type AuthContext,
  type AuthenticatedUser,
} from "@/lib/auth-context";

export {
  AUTH_ACCESS_TOKEN_COOKIE,
  AUTH_CONTEXT_COOKIE,
  createAuthContext,
  type AuthRole,
  type AuthContext,
  type AuthenticatedUser,
};

interface CookieStore {
  set(name: string, value: string, cookie?: Record<string, unknown>): void;
  delete(name: string): void;
}

function buildCookieOptions(expiresAt: Date): Record<string, unknown> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    maxAge: getAuthCookieMaxAgeSeconds(),
  };
}

export function readAuthContextCookie(
  rawValue: string | undefined,
): AuthContext | null {
  return parseSignedAuthContext(rawValue, createHmac, timingSafeEqual);
}

export function setAuthCookies(
  cookieStore: CookieStore,
  accessToken: string,
  user: AuthenticatedUser,
): void {
  const context = createAuthContext(user);
  const expiresAt = new Date(context.expiresAt);
  const cookieOptions = buildCookieOptions(expiresAt);

  cookieStore.set(AUTH_ACCESS_TOKEN_COOKIE, accessToken, cookieOptions);
  cookieStore.set(
    AUTH_CONTEXT_COOKIE,
    buildSignedAuthContext(context, createHmac),
    cookieOptions,
  );
}

export function clearAuthCookies(
  cookieStore: CookieStore,
): void {
  cookieStore.delete(AUTH_ACCESS_TOKEN_COOKIE);
  cookieStore.delete(AUTH_CONTEXT_COOKIE);
}
