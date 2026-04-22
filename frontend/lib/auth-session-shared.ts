export type AuthRole = "ADMIN" | "PELANGGAN";

export interface AuthSessionUser {
  id: number;
  name: string;
  email: string;
  role: AuthRole;
}

export interface AuthSession {
  user: AuthSessionUser;
}

export const AUTH_CHANGE_EVENT = "fishbooker-auth-changed";
