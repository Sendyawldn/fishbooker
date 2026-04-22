import "server-only";

import { cookies } from "next/headers";
import {
  AUTH_ACCESS_TOKEN_COOKIE,
  clearAuthCookies,
} from "@/lib/server/auth-cookies";

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export class BackendApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "BackendApiError";
    this.status = status;
    this.payload = payload;
  }
}

function buildBackendUrl(endpoint: string): string {
  return `${BACKEND_BASE_URL}${endpoint}`;
}

async function parseErrorPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }

  return response.text().catch(() => null);
}

export async function requestBackendJson<T>(
  endpoint: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(buildBackendUrl(endpoint), {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const fallbackMessage = "Backend FishBooker tidak bisa memproses permintaan.";
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message?: unknown }).message === "string"
        ? (data as { message: string }).message
        : fallbackMessage;

    throw new BackendApiError(message, response.status, data);
  }

  return data as T;
}

export async function requestBackendResponse(
  endpoint: string,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(buildBackendUrl(endpoint), {
    ...init,
    cache: "no-store",
    headers: {
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const payload = await parseErrorPayload(response);
    const fallbackMessage = "Backend FishBooker tidak bisa memproses permintaan.";
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof (payload as { message?: unknown }).message === "string"
        ? (payload as { message: string }).message
        : fallbackMessage;

    throw new BackendApiError(message, response.status, payload);
  }

  return response;
}

export async function getServerAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();

  return cookieStore.get(AUTH_ACCESS_TOKEN_COOKIE)?.value ?? null;
}

export async function getRequiredServerAccessToken(): Promise<string> {
  const accessToken = await getServerAccessToken();

  if (!accessToken) {
    throw new BackendApiError("Sesi login tidak ditemukan.", 401, null);
  }

  return accessToken;
}

export async function clearServerAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  clearAuthCookies(cookieStore);
}
