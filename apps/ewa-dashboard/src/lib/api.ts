// src/lib/api.ts
import axios from "axios";

/**
 * Shape of the stored user object.
 * We’ll assume we store { email, role, id } in localStorage under "ewa.user".
 */
type StoredUser = {
  email?: string;
  role?: string;
  id?: string;
};

/**
 * Helper: read the current user record from localStorage.
 */
function getUserFromLocalStorage(): StoredUser | null {
  try {
    const raw = localStorage.getItem("ewa.user");
    if (!raw) return null;
    const parsed: StoredUser = JSON.parse(raw);
    return parsed || null;
  } catch {
    return null;
  }
}

/**
 * Create a shared Axios instance for all API requests.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? "http://localhost:4000",
  timeout: 10000, // 10s safeguard timeout
});

/**
 * Request interceptor:
 * Attaches identity headers to every outgoing request so the backend
 * (and its row-level security logic) knows who is calling.
 *
 * - x-user-email → used in withRLS() to set request.jwt.claims
 * - x-user-role  → helps approval endpoint verify you're MANAGER / DIRECTOR / ADMIN
 * - x-user-id    → lets inbox queries match ?userId=...
 */
api.interceptors.request.use(
  (config) => {
    const user = getUserFromLocalStorage();

    // Ensure headers object exists and is mutable
    if (!config.headers) {
      config.headers = {} as any;
    }

    if (user?.email) {
      (config.headers as any)["x-user-email"] = user.email;
    }

    if (user?.role) {
      (config.headers as any)["x-user-role"] = user.role;
    }

    if (user?.id) {
      (config.headers as any)["x-user-id"] = user.id;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


/**
 * Response interceptor:
 * Centralized debug logging for 4xx/5xx so we can see what's going on
 * without having to sprinkle try/catch everywhere.
 */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response) {
      console.error(
        `[API ${err.response.status}] ${err.config?.url}:`,
        err.response.data
      );
    } else {
      console.error("[API] Network error or no response", err.message);
    }
    return Promise.reject(err);
  }
);

export default api;
