"use client";

import type { LoginResponse } from "@/lib/api";

const AUTH_SESSION_KEY = "fishbooker:auth-session";
const AUTH_CHANGE_EVENT = "fishbooker-auth-changed";

export interface AuthSession {
  accessToken: string;
  tokenType: string;
  user: LoginResponse["user"];
}

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawSession = window.sessionStorage.getItem(AUTH_SESSION_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawSession) as Partial<AuthSession>;

    if (
      typeof parsed.accessToken !== "string" ||
      typeof parsed.tokenType !== "string" ||
      typeof parsed.user !== "object" ||
      parsed.user === null
    ) {
      return null;
    }

    return parsed as AuthSession;
  } catch {
    return null;
  }
}

export function persistAuthSession(loginResponse: LoginResponse): AuthSession {
  const nextSession: AuthSession = {
    accessToken: loginResponse.access_token,
    tokenType: loginResponse.token_type,
    user: loginResponse.user,
  };

  window.sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(nextSession));
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));

  return nextSession;
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(AUTH_SESSION_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function subscribeAuthSession(
  callback: (session: AuthSession | null) => void,
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const listener = () => {
    callback(readAuthSession());
  };

  window.addEventListener(AUTH_CHANGE_EVENT, listener);

  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, listener);
  };
}
