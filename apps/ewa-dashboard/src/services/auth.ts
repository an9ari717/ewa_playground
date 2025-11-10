// src/services/auth.ts
import api from "../lib/api";

export type Role = "EMPLOYEE" | "MANAGER" | "DIRECTOR" | "ADMIN";

export type Me = {
  id: string;
  email: string;
  role: Role;
  isActive?: boolean;
  name?: string | null;
};

export type LoginRes = {
  token: string;
  user: Me;
};

/**
 * POST /auth/login
 * Returns { token, user }
 */
export async function login(email: string, password: string): Promise<LoginRes> {
  const { data } = await api.post<LoginRes>("/auth/login", {
    email: email.trim().toLowerCase(),
    password,
  });
  return data;
}

/**
 * GET /auth/me
 * Returns current user based on Bearer token
 * If token invalid/expired → throws 401
 */
export async function fetchMe(): Promise<Me> {
  const { data } = await api.get<Me>("/auth/me");
  return data;
}

/**
 * Local logout helper
 * (If you add a server-side blacklist endpoint later, call it here too.)
 */
export function logoutLocal(): void {
  try {
    localStorage.removeItem("ewa.user");
    localStorage.removeItem("ewa.token");
  } catch {
    /* ignore */
  }
}
