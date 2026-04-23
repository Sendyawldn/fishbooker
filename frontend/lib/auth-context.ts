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
    "development-only-auth-session-secret"
  );
}

export function getAuthCookieMaxAgeSeconds(): number {
  const parsedValue = Number(process.env.AUTH_SESSION_MAX_AGE_SECONDS ?? "");

  if (Number.isInteger(parsedValue) && parsedValue > 0) {
    return parsedValue;
  }

  return DEFAULT_SESSION_MAX_AGE_SECONDS;
}

function createSignature(
  payload: string,
  createHmac: (algorithm: string, secret: string) => {
    update(value: string): { digest(encoding: BufferEncoding): string };
  },
): string {
  return createHmac("sha256", getCookieSecret())
    .update(payload)
    .digest("base64url");
}

function encodeContextPayload(context: AuthContext): string {
  return Buffer.from(JSON.stringify(context), "utf8").toString("base64url");
}

function decodeContextPayload(payload: string): AuthContext | null {
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

export function createAuthContext(
  user: AuthenticatedUser,
  now = Date.now(),
): AuthContext {
  const expiresAt = new Date(now + getAuthCookieMaxAgeSeconds() * 1000);

  return {
    userId: user.id,
    role: user.role,
    expiresAt: expiresAt.toISOString(),
  };
}

export function buildSignedAuthContext(
  context: AuthContext,
  createHmac: (algorithm: string, secret: string) => {
    update(value: string): { digest(encoding: BufferEncoding): string };
  },
): string {
  const payload = encodeContextPayload(context);
  const signature = createSignature(payload, createHmac);

  return `${payload}.${signature}`;
}

export function parseSignedAuthContext(
  rawValue: string | undefined,
  createHmac: (algorithm: string, secret: string) => {
    update(value: string): { digest(encoding: BufferEncoding): string };
  },
  timingSafeEqual: (left: Buffer, right: Buffer) => boolean,
  now = Date.now(),
): AuthContext | null {
  if (!rawValue) {
    return null;
  }

  const [payload, signature] = rawValue.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = createSignature(payload, createHmac);

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

  if (Date.parse(parsedContext.expiresAt) <= now) {
    return null;
  }

  return parsedContext;
}
