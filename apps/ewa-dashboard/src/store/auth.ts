// src/store/auth.ts
import { create } from "zustand";
import { fetchMe } from "../services/auth";

export type Role = "EMPLOYEE" | "MANAGER" | "DIRECTOR" | "ADMIN";
export type Me = {
  id: string;
  email: string;
  role: Role;
  isActive?: boolean;
  name?: string | null;
};

type State = {
  me: Me | null;
  token: string | null;
  loading: boolean;
  error?: string;

  // core actions
  set: (me: Me | null, token?: string | null) => void;
  hydrate: () => void;
  logout: () => void;

  // soft verify token with backend /auth/me (never clears UI 'me' on failure)
  bootstrap: () => Promise<void>;

  // helpers
  isAuthed: () => boolean;
  isManager: () => boolean;
  isDirector: () => boolean;
  isAdmin: () => boolean;
};

function readLS(): { me: Me | null; token: string | null } {
  try {
    const rawUser = localStorage.getItem("ewa.user");
    const rawTok = localStorage.getItem("ewa.token");
    return {
      me: rawUser ? (JSON.parse(rawUser) as Me) : null,
      token: rawTok ?? null,
    };
  } catch {
    return { me: null, token: null };
  }
}

function writeLS(me: Me | null, token: string | null) {
  try {
    if (me) {
      localStorage.setItem("ewa.user", JSON.stringify(me));
    } else {
      localStorage.removeItem("ewa.user");
    }
    if (token) {
      localStorage.setItem("ewa.token", token);
    } else {
      localStorage.removeItem("ewa.token");
    }
  } catch {
    /* ignore */
  }
}

export const useAuth = create<State>((set, get) => ({
  me: readLS().me,
  token: readLS().token,
  loading: false,
  error: undefined,

  set: (me, token) => {
    const nextToken =
      typeof token === "undefined" ? get().token : token ?? null;
    writeLS(me, nextToken);
    set({ me, token: nextToken });
  },

  hydrate: () => {
    const { me, token } = readLS();
    set({ me, token });
  },

  logout: () => {
    writeLS(null, null);
    set({ me: null, token: null });
  },

  /**
   * Soft bootstrap:
   * - If there's no token: keep current `me` (UI stays stable), just stop loading.
   * - If token exists: try /auth/me
   *    - success: update `me` and persist
   *    - failure (401/timeout/etc): remove token ONLY, keep current `me`
   *      so the sidebar does NOT disappear.
   */
  bootstrap: async () => {
    set({ loading: true, error: undefined });
    try {
      const { token } = readLS();
      if (!token) {
        set({ loading: false, error: undefined });
        return;
      }

      try {
        const remote = await fetchMe();
        if (remote && remote.email && remote.role) {
          writeLS(remote, token);
          set({ me: remote, token, loading: false, error: undefined });
        } else {
          // unexpected shape; keep UI stable but drop token
          writeLS(get().me, null);
          set({ token: null, loading: false, error: undefined });
        }
      } catch (e: any) {
        // token invalid/expired or network issue — drop token, keep `me`
        writeLS(get().me, null);
        set({
          token: null,
          loading: false,
          error: e?.response?.status ? `HTTP ${e.response.status}` : undefined,
        });
      }
    } catch (e: any) {
      set({
        loading: false,
        error: e?.response?.status ? `HTTP ${e.response.status}` : "unknown error",
      });
    }
  },

  isAuthed: () => !!get().me,
  isManager: () => get().me?.role === "MANAGER",
  isDirector: () => get().me?.role === "DIRECTOR",
  isAdmin: () => get().me?.role === "ADMIN",
}));
