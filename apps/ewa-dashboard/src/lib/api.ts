// src/lib/api.ts
import axios from "axios";

/** User shape stored in LS */
type StoredUser = {
  id?: string;
  email?: string;
  role?: string;
  name?: string | null;
};

function readUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem("ewa.user");
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}
function readToken(): string | null {
  try {
    return localStorage.getItem("ewa.token");
  } catch {
    return null;
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? "http://localhost:4000",
  timeout: 10000,
  headers: {
    // be explicit to discourage intermediate caching layers
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  },
});

api.interceptors.request.use(
  (config) => {
    config.headers = config.headers ?? {};

    // Attach Authorization if we have a JWT
    const token = readToken();
    if (token) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }

    // Identity fallbacks for older endpoints (RLS helpers)
    const user = readUser();
    if (user?.email) (config.headers as any)["x-user-email"] = user.email;
    if (user?.role) (config.headers as any)["x-user-role"] = user.role;
    if (user?.id) (config.headers as any)["x-user-id"] = user.id;

    // For GETs: add a cache-busting param and reinforce no-cache headers
    const method = (config.method ?? "get").toLowerCase();
    if (method === "get") {
      const params = new URLSearchParams(config.params as any);
      params.set("_ts", String(Date.now()));
      config.params = params;

      (config.headers as any)["Cache-Control"] = "no-cache";
      (config.headers as any).Pragma = "no-cache";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response) {
      console.error(
        `[API ${err.response.status}] ${err.config?.url}`,
        err.response.data
      );
    } else {
      console.error("[API] Network error:", err?.message ?? err);
    }
    return Promise.reject(err);
  }
);

export default api;
