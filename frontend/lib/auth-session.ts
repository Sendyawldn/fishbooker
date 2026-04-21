"use client";

import type { LoginResponse } from "@/lib/api";
import {
  AUTH_CHANGE_EVENT,
  AUTH_SESSION_COOKIE,
  AUTH_SESSION_KEY,
  AuthSession,
  parseAuthSession,
  serializeAuthSession,
} from "@/lib/auth-session-shared";

export type { AuthSession } from "@/lib/auth-session-shared";

function readAuthSessionCookie(): AuthSession | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookiePrefix = `${AUTH_SESSION_COOKIE}=`;
  const cookieValue = document.cookie
    .split("; ")
    .find((cookieEntry) => cookieEntry.startsWith(cookiePrefix))
    ?.slice(cookiePrefix.length);

  if (!cookieValue) {
    return null;
  }

  return parseAuthSession(decodeURIComponent(cookieValue));
}

function persistAuthSessionCookie(session: AuthSession): void {
  document.cookie = [
    `${AUTH_SESSION_COOKIE}=${encodeURIComponent(serializeAuthSession(session))}`,
    "Path=/",
    "SameSite=Lax",
  ].join("; ");
}

function clearAuthSessionCookie(): void {
  document.cookie = [
    `${AUTH_SESSION_COOKIE}=`,
    "Path=/",
    "Max-Age=0",
    "SameSite=Lax",
  ].join("; ");
}

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawSession = window.sessionStorage.getItem(AUTH_SESSION_KEY);
  if (!rawSession) {
    return null;
  }

  const parsedSession = parseAuthSession(rawSession);

  if (parsedSession) {
    return parsedSession;
  }

  const cookieSession = readAuthSessionCookie();

  if (cookieSession) {
    window.sessionStorage.setItem(
      AUTH_SESSION_KEY,
      serializeAuthSession(cookieSession),
    );
  }

  return cookieSession;
}

export function persistAuthSession(loginResponse: LoginResponse): AuthSession {
  const nextSession: AuthSession = {
    accessToken: loginResponse.access_token,
    tokenType: loginResponse.token_type,
    user: loginResponse.user,
  };

  window.sessionStorage.setItem(
    AUTH_SESSION_KEY,
    serializeAuthSession(nextSession),
  );
  persistAuthSessionCookie(nextSession);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));

  return nextSession;
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(AUTH_SESSION_KEY);
  clearAuthSessionCookie();
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
