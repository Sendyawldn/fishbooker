import type { LoginResponse } from "@/lib/api";

export const AUTH_SESSION_KEY = "fishbooker:auth-session";
export const AUTH_CHANGE_EVENT = "fishbooker-auth-changed";
export const AUTH_SESSION_COOKIE = "fishbooker_auth_session";

export interface AuthSession {
  accessToken: string;
  tokenType: string;
  user: LoginResponse["user"];
}

export function serializeAuthSession(session: AuthSession): string {
  return JSON.stringify(session);
}

export function parseAuthSession(rawSession: string | null): AuthSession | null {
  if (!rawSession) {
    return null;
  }

  try {
    const parsedSession = JSON.parse(rawSession) as Partial<AuthSession>;

    if (
      typeof parsedSession.accessToken !== "string" ||
      typeof parsedSession.tokenType !== "string" ||
      typeof parsedSession.user !== "object" ||
      parsedSession.user === null
    ) {
      return null;
    }

    return parsedSession as AuthSession;
  } catch {
    return null;
  }
}
