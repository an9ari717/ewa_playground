// src/auth/RequireAuth.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import React from "react";
import { useAuth } from "../store/auth";
import { fetchMe } from "../services/auth";

export default function RequireAuth() {
  const location = useLocation();
  const meFromStore = useAuth((s) => s.me);
  const set = useAuth((s) => s.set);

  const lsUserRef = React.useRef<any>(null);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    // 1) Sync hydrate from localStorage (instant, no await)
    try {
      const raw = localStorage.getItem("ewa.user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.email && parsed?.role) {
          lsUserRef.current = parsed;
          set(parsed); // populate store
        }
      }
    } catch {}

    // Mark as hydrated immediately after LS read
    setHydrated(true);

    // 2) If we have a token, try to refresh user from server (non-blocking)
    let token: string | null = null;
    try {
      token = localStorage.getItem("ewa.token");
    } catch {}

    (async () => {
      if (!token) return;
      try {
        const remote = await fetchMe();
        if (remote?.email && remote?.role) {
          set(remote);
          localStorage.setItem("ewa.user", JSON.stringify(remote));
          lsUserRef.current = remote;
        }
      } catch {
        // token invalid; clean it up
        try {
          localStorage.removeItem("ewa.token");
        } catch {}
      }
    })();
  }, [set]);

  // Prefer store, fall back to LS snapshot
  const effectiveUser = meFromStore ?? lsUserRef.current;

  if (!hydrated) return null;
  if (!effectiveUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
