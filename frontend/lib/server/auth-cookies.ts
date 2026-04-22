import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

interface CookieStore {
  set(name: string, value: string, cookie?: Record<string, unknown>): void;
  delete(name: string): void;
}

export type AuthRole = "ADMIN" | "PELANGGAN";

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: AuthRole;
}

export interface AuthContext {
  userId: number;
  role: AuthRole;
  expiresAt: string;
}

export const AUTH_ACCESS_TOKEN_COOKIE = "fishbooker_access_token";
export const AUTH_CONTEXT_COOKIE = "fishbooker_auth_context";

const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function getCookieSecret(): string {
  return (
    process.env.AUTH_SESSION_COOKIE_SECRET ??
    "local-dev-auth-session-secret-change-me"
  );
}

function getCookieMaxAgeSeconds(): number {
  const parsedValue = Number(process.env.AUTH_SESSION_MAX_AGE_SECONDS ?? "");

  if (Number.isInteger(parsedValue) && parsedValue > 0) {
    return parsedValue;
  }

  return DEFAULT_SESSION_MAX_AGE_SECONDS;
}

function createSignature(payload: string): string {
  return createHmac("sha256", getCookieSecret())
    .update(payload)
    .digest("base64url");
}

function encodeContextPayload(context: AuthContext): string {
  return Buffer.from(JSON.stringify(context), "utf8").toString("base64url");
}

function decodeContextPayload(
  payload: string,
): AuthContext | null {
  try {
    const parsedValue = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Partial<AuthContext>;

    if (
      typeof parsedValue.userId !== "number" ||
      (parsedValue.role !== "ADMIN" && parsedValue.role !== "PELANGGAN") ||
      typeof parsedValue.expiresAt !== "string"
    ) {
      return null;
    }

    return {
      userId: parsedValue.userId,
      role: parsedValue.role,
      expiresAt: parsedValue.expiresAt,
    };
  } catch {
    return null;
  }
}

function buildSignedContext(context: AuthContext): string {
  const payload = encodeContextPayload(context);
  const signature = createSignature(payload);

  return `${payload}.${signature}`;
}

function verifySignedContext(rawValue: string | undefined): AuthContext | null {
  if (!rawValue) {
    return null;
  }

  const [payload, signature] = rawValue.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = createSignature(payload);

  if (
    signature.length !== expectedSignature.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return null;
  }

  const parsedContext = decodeContextPayload(payload);

  if (!parsedContext) {
    return null;
  }

  if (Date.parse(parsedContext.expiresAt) <= Date.now()) {
    return null;
  }

  return parsedContext;
}

function buildCookieOptions(expiresAt: Date): Record<string, unknown> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    maxAge: getCookieMaxAgeSeconds(),
  };
}

export function createAuthContext(user: AuthenticatedUser): AuthContext {
  const expiresAt = new Date(Date.now() + getCookieMaxAgeSeconds() * 1000);

  return {
    userId: user.id,
    role: user.role,
    expiresAt: expiresAt.toISOString(),
  };
}

export function readAuthContextCookie(
  rawValue: string | undefined,
): AuthContext | null {
  return verifySignedContext(rawValue);
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
    buildSignedContext(context),
    cookieOptions,
  );
}

export function clearAuthCookies(
  cookieStore: CookieStore,
): void {
  cookieStore.delete(AUTH_ACCESS_TOKEN_COOKIE);
  cookieStore.delete(AUTH_CONTEXT_COOKIE);
}
