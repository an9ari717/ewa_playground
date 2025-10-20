// src/auth/RequireAuth.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { auth } from "./session";

export default function RequireAuth() {
  const email = auth.getEmail();
  const location = useLocation();

  if (!email) {
    // Not signed in → go to login and remember where they were going
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Signed in → render the nested route under /app
  return <Outlet />;
}
