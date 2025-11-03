// src/store/auth.ts
import { create } from "zustand";
import { fetchMe } from "../services/auth";

export type Me = {
  id: string;
  email: string;
  role: "EMPLOYEE" | "MANAGER" | "DIRECTOR" | "ADMIN";
};

export const DEMO_IDENTITIES: Record<string, { id: string; role: Me["role"] }> = {
  "manager_ali@demo.local": { id: "cmh8y9clx0000vq98d1b3y6rc", role: "MANAGER" },
  "manager@demo.local": { id: "cmh8y9clx0000vq98d1b3y6rc", role: "MANAGER" },
  "director_sara@demo.local": { id: "cmh8y9d860001v9q8a03alni5", role: "DIRECTOR" },
  "director@demo.local": { id: "cmh8y9d860001v9q8a03alni5", role: "DIRECTOR" },
  "admin@demo.local": { id: "cmh8y9d8g0002v9q8tiklxpvn", role: "ADMIN" },
  "employee@demo.local": { id: "cmh8y9d8g0003v9q8xu03k55p", role: "EMPLOYEE" },
};

export const ALLOWED_EMAILS = Object.keys(DEMO_IDENTITIES);

function mapEmail(emailLower: string): { id: string; role: Me["role"] } {
  return DEMO_IDENTITIES[emailLower] ?? DEMO_IDENTITIES["employee@demo.local"];
}

export function deriveIdentityFromEmail(email: string): Me {
  const lower = email.toLowerCase().trim();
  const base = mapEmail(lower);
  return { id: base.id, email: lower, role: base.role };
}

function normalizeMe(raw: any): Me {
  const lower =
    typeof raw?.email === "string" ? raw.email.toLowerCase().trim() : "employee@demo.local";
  const base = mapEmail(lower);
  return {
    id: typeof raw?.id === "string" ? raw.id : base.id,
    email: lower,
    role: base.role, // always derive role from email
  };
}

// 🔴 NEW: read localStorage **synchronously** for first render
function initialMe(): Me | null {
  try {
    const raw = localStorage.getItem("ewa.user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const me = normalizeMe(parsed);
    // rewrite to keep it clean/consistent
    localStorage.setItem("ewa.user", JSON.stringify(me));
    return me;
  } catch {
    return null;
  }
}

type State = {
  me: Me | null;
  loading: boolean; // kept for API parity but not used for refresh path now
  error?: string;
  hydrate: () => void;     // still available (no-op if already initialized)
  bootstrap: () => Promise<void>; // optional remote /me
  set: (me: Me | null) => void;
};

export const useAuth = create<State>((set, _get) => ({
  // ✅ me is ready on the first render — no race
  me: initialMe(),
  loading: false,
  error: undefined,

  hydrate() {
    // idempotent — ensures me stays normalized if something changed
    const raw = localStorage.getItem("ewa.user");
    if (raw) {
      try {
        const me = normalizeMe(JSON.parse(raw));
        localStorage.setItem("ewa.user", JSON.stringify(me));
        set({ me });
      } catch {
        /* ignore */
      }
    }
  },

  // Optional: only used if you want to call /me somewhere
  async bootstrap() {
    set({ loading: true, error: undefined });
    try {
      const raw = localStorage.getItem("ewa.user");
      if (raw) {
        const me = normalizeMe(JSON.parse(raw));
        localStorage.setItem("ewa.user", JSON.stringify(me));
        set({ me, loading: false });
        return;
      }
      const remote = await fetchMe().catch(() => null);
      if (remote) {
        const me = normalizeMe(remote);
        localStorage.setItem("ewa.user", JSON.stringify(me));
        set({ me, loading: false });
      } else {
        set({ me: null, loading: false });
      }
    } catch (e: any) {
      set({
        me: null,
        loading: false,
        error: e?.response?.status ? `HTTP ${e.response.status}` : "unknown error",
      });
    }
  },

  set(me) {
    if (me) {
      const normalized = normalizeMe(me);
      localStorage.setItem("ewa.user", JSON.stringify(normalized));
      set({ me: normalized });
    } else {
      localStorage.removeItem("ewa.user");
      set({ me: null });
    }
  },
}));
