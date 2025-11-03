// src/auth/RequireAuth.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../store/auth";

export default function RequireAuth() {
  const { me } = useAuth();
  const location = useLocation();

  // 🔹 If user not found in localStorage (no session), redirect to login
  if (!me) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 🔹 Otherwise, allow access to protected routes
  return <Outlet />;
}
