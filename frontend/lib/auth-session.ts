"use client";

import { requestAppJson } from "@/lib/api";
import { AUTH_CHANGE_EVENT, type AuthSession } from "@/lib/auth-session-shared";

export type { AuthSession } from "@/lib/auth-session-shared";

interface AuthSessionResponse {
  user: AuthSession["user"] | null;
}

function dispatchAuthChange(): void {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export async function readAuthSession(): Promise<AuthSession | null> {
  const response = await requestAppJson<AuthSessionResponse>("/api/auth/session", {
    cache: "no-store",
  });

  return response.user ? { user: response.user } : null;
}

export async function loginWithAuthSession(
  email: string,
  password: string,
): Promise<AuthSession> {
  const response = await requestAppJson<AuthSessionResponse>("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.user) {
    throw new Error("Sesi login tidak tersedia setelah autentikasi.");
  }

  dispatchAuthChange();

  return {
    user: response.user,
  };
}

export async function clearAuthSession(): Promise<void> {
  await requestAppJson<{ success: boolean }>("/api/auth/logout", {
    method: "POST",
  }).catch(() => null);

  dispatchAuthChange();
}

export function subscribeAuthSession(
  callback: (session: AuthSession | null) => void,
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const listener = () => {
    void readAuthSession().then((session) => {
      callback(session);
    });
  };

  window.addEventListener(AUTH_CHANGE_EVENT, listener);

  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, listener);
  };
}
