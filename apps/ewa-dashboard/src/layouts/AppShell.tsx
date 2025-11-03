// src/layouts/AppShell.tsx
import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import { auth } from "../auth/session";

export default function AppShell() {
  const nav = useNavigate();
  const { me, set } = useAuth();

  const handleLogout = () => {
    // clear both our local auth store and the legacy session helper
    set(null);
    auth.clear();

    // go back to login
    nav("/login", { replace: true });
  };

  const linkBase: React.CSSProperties = {
    display: "block",
    padding: "8px 10px",
    borderRadius: 8,
    textDecoration: "none",
  };

  // role helpers
  const isEmployee = me?.role === "EMPLOYEE";
  const isManagerLike =
    me?.role === "MANAGER" || me?.role === "DIRECTOR" || me?.role === "ADMIN";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <header
        style={{
          height: 56,
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          background: "#fff",
        }}
      >
        <div style={{ fontWeight: 600 }}>EWA Dashboard</div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {me ? (
            <>
              <div style={{ textAlign: "right", lineHeight: 1.2 }}>
                <div
                  style={{
                    color: "#111827",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  {me.email}
                </div>
                <div
                  style={{
                    color: "#6b7280",
                    fontSize: 12,
                    fontWeight: 400,
                    textTransform: "uppercase",
                  }}
                >
                  {me.role}
                </div>
              </div>

              <button
                onClick={handleLogout}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: "#f9fafb",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </>
          ) : null}
        </div>
      </header>

      <div style={{ flex: 1, display: "flex" }}>
        {/* Sidebar */}
        <aside
          style={{
            width: 240,
            borderRight: "1px solid #e5e7eb",
            padding: 16,
          }}
        >
          <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {/* Always visible */}
            <NavLink
              to="/app/dashboard"
              style={({ isActive }) => ({
                ...linkBase,
                color: isActive ? "#111827" : "#1f2937",
                background: isActive ? "#f3f4f6" : "transparent",
                fontWeight: isActive ? 600 : 500,
              })}
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/app/inbox"
              style={({ isActive }) => ({
                ...linkBase,
                color: isActive ? "#111827" : "#1f2937",
                background: isActive ? "#f3f4f6" : "transparent",
                fontWeight: isActive ? 600 : 500,
              })}
            >
              Inbox
            </NavLink>

            <NavLink
              to="/app/archive"
              style={({ isActive }) => ({
                ...linkBase,
                color: isActive ? "#111827" : "#1f2937",
                background: isActive ? "#f3f4f6" : "transparent",
                fontWeight: isActive ? 600 : 500,
              })}
            >
              Archive
            </NavLink>

            <NavLink
              to="/app/new-request"
              style={({ isActive }) => ({
                ...linkBase,
                color: isActive ? "#111827" : "#1f2937",
                background: isActive ? "#f3f4f6" : "transparent",
                fontWeight: isActive ? 600 : 500,
              })}
            >
              New Request
            </NavLink>

            {/* EMPLOYEE SECTION */}
            {isEmployee && (
              <>
                <div style={{ height: 8 }} />
                <small style={{ color: "#6b7280", paddingLeft: 2 }}>
                  Employee
                </small>

                <NavLink
                  to="/app/employee/request"
                  style={({ isActive }) => ({
                    ...linkBase,
                    color: isActive ? "#111827" : "#1f2937",
                    background: isActive ? "#f3f4f6" : "transparent",
                    fontWeight: isActive ? 600 : 500,
                  })}
                >
                  New
                </NavLink>

                <NavLink
                  to="/app/employee/requests"
                  style={({ isActive }) => ({
                    ...linkBase,
                    color: isActive ? "#111827" : "#1f2937",
                    background: isActive ? "#f3f4f6" : "transparent",
                    fontWeight: isActive ? 600 : 500,
                  })}
                >
                  My Requests
                </NavLink>
              </>
            )}

            {/* MANAGER SECTION */}
            {isManagerLike && (
              <>
                <div style={{ height: 8 }} />
                <small style={{ color: "#6b7280", paddingLeft: 2 }}>
                  Manager
                </small>

                <NavLink
                  to="/app/manager/inbox"
                  style={({ isActive }) => ({
                    ...linkBase,
                    color: isActive ? "#111827" : "#1f2937",
                    background: isActive ? "#f3f4f6" : "transparent",
                    fontWeight: isActive ? 600 : 500,
                  })}
                >
                  Inbox
                </NavLink>
              </>
            )}
          </nav>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: 24 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
