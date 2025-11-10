// src/components/Sidebar.tsx
import { NavLink } from "react-router-dom";
import React from "react";
import { useAuth } from "../store/auth";

type ItemProps = {
  to: string;
  label: string;
  exact?: boolean;
};

function Item({ to, label, exact }: ItemProps) {
  return (
    <NavLink
      to={to}
      end={!!exact}
      className={({ isActive }) =>
        [
          "block rounded-lg px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-gray-900 text-white"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
        ].join(" ")
      }
      style={{
        display: "block",
        padding: "10px 12px",
        borderRadius: 10,
        color: "#374151",
        textDecoration: "none",
        marginBottom: 4,
      }}
    >
      {({ isActive }) => (
        <span
          style={{
            display: "block",
            color: isActive ? "#fff" : "#374151",
            background: isActive ? "#111827" : "transparent",
            borderRadius: 10,
            padding: "6px 8px",
          }}
        >
          {label}
        </span>
      )}
    </NavLink>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500"
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: "#6b7280",
        marginTop: 18,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

export default function Sidebar() {
  const storeMe = useAuth((s) => s.me);
  let me: any = storeMe;
  if (!me) {
    try {
      const raw = localStorage.getItem("ewa.user");
      if (raw) me = JSON.parse(raw);
    } catch {}
  }

  const role: string | undefined = me?.role;
  const isEmployee = role === "EMPLOYEE";
  const isManager  = role === "MANAGER";
  const isDirector = role === "DIRECTOR";
  const isAdmin    = role === "ADMIN";

  return (
    <div className="px-4 py-5" style={{ padding: "20px 16px" }}>
      {/* Brand */}
      <div className="mb-6" style={{ marginBottom: 18 }}>
        <div
          className="text-2xl font-semibold tracking-tight"
          style={{ fontSize: 20, fontWeight: 600 }}
        >
                 EWA Dashboard
        </div>
        <div className="text-xs text-gray-500" style={{ fontSize: 12, color: "#6b7280" }}>
          Approvals System
        </div>
      </div>

      {/* Overview (shared) */}
      <SectionTitle>Overview</SectionTitle>
      <div className="space-y-1">
        <Item to="/app/dashboard" label="Dashboard" exact />
        <Item to="/app/archive" label="Archive" />
      </div>

      {/* Employee */}
      {isEmployee && (
        <>
          <SectionTitle>Employee</SectionTitle>
          <div className="space-y-1">
            <Item to="/app/employee/request" label="New Request" />
            <Item to="/app/employee/requests" label="My Requests" />
          </div>
        </>
      )}

      {/* Manager */}
      {isManager && (
        <>
          <SectionTitle>Manager</SectionTitle>
          <div className="space-y-1">
            <Item to="/app/manager/inbox" label="Inbox" />
          </div>
        </>
      )}

      {/* Director */}
      {isDirector && (
        <>
          <SectionTitle>Director</SectionTitle>
          <div className="space-y-1">
            <Item to="/app/director/inbox" label="Inbox" />
          </div>
        </>
      )}

      {/* Admin */}
      {isAdmin && (
        <>
          <SectionTitle>Admin</SectionTitle>
          <div className="space-y-1">
            <Item to="/app/admin" label="Admin Panel" />
          </div>
        </>
      )}
    </div>
  );
}
