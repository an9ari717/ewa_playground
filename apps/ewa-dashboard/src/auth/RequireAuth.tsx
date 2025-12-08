// src/auth/RequireAuth.tsx
//import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../store/auth";

/**
 * Simple auth gate:
 * - Trusts Zustand store (which is hydrated from localStorage on startup)
 * - If there's no `me`, redirect to /login
 * - No extra localStorage / fetchMe logic here (that lives in auth store + main.tsx)
 */
export default function RequireAuth() {
  const location = useLocation();
  const me = useAuth((s) => s.me);

  // While React StrictMode double-mounts, `me` will come from
  // the store's initial read of localStorage, so we don't need a
  // separate "hydrated" flag here.
  if (!me) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
