import { cookies } from "next/headers";
import {
  readAuthContextCookie,
  AUTH_CONTEXT_COOKIE,
  type AuthRole,
} from "@/lib/server/auth-cookies";

export interface ServerAuthSession {
  user: {
    id: number;
    role: AuthRole;
  };
  expiresAt: string;
}

export async function readServerAuthSession(): Promise<ServerAuthSession | null> {
  const cookieStore = await cookies();
  const rawAuthContext = cookieStore.get(AUTH_CONTEXT_COOKIE)?.value;
  const authContext = readAuthContextCookie(rawAuthContext);

  if (!authContext) {
    return null;
  }

  return {
    user: {
      id: authContext.userId,
      role: authContext.role,
    },
    expiresAt: authContext.expiresAt,
  };
}
