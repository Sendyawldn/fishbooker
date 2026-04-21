import { cookies } from "next/headers";
import {
  AUTH_SESSION_COOKIE,
  type AuthSession,
  parseAuthSession,
} from "@/lib/auth-session-shared";

export async function readServerAuthSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const rawAuthSession = cookieStore.get(AUTH_SESSION_COOKIE)?.value ?? null;

  if (!rawAuthSession) {
    return null;
  }

  return parseAuthSession(decodeURIComponent(rawAuthSession));
}
