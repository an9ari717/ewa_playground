// src/lib/api.ts
import axios from "axios";
import { auth } from "../auth/session";

/**
 * Backend base URL:
 * - Set VITE_API_URL in .env if you have a custom host
 * - Falls back to http://localhost:4000
 */
export const API_BASE_URL =
  (import.meta as any)?.env?.VITE_API_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Attach auth header (if/when we move to real tokens).
 * For now we pass the email so backend can simulate a user.
 */
api.interceptors.request.use((config) => {
  const email = auth.getEmail();
  if (email) {
    // Temporary: send email as a header until real JWT is implemented
    config.headers = config.headers ?? {};
    (config.headers as any)["x-user-email"] = email;
  }

  // If later you add JWT:
  // const token = auth.getToken?.();
  // if (token) (config.headers as any).Authorization = `Bearer ${token}`;

  return config;
});
