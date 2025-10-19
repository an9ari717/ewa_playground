// src/layouts/AppShell.tsx
import { NavLink, Outlet, useNavigate, Navigate } from "react-router-dom";
import { auth } from "../auth/session"; // ✅ added

export default function AppShell() {
  const nav = useNavigate();
  const email = auth.getEmail(); // ✅ added
  if (!email) {
  return <Navigate to="/login" replace />;
}


  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          borderRight: "1px solid #e5e7eb",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>EWA</div>
        
        <NavLink
  to="/dashboard"
  style={({ isActive }) => ({
    padding: "8px 10px",
    borderRadius: 8,
    textDecoration: "none",
    background: isActive ? "#f3f4f6" : "transparent",
    color: "inherit",
  })}
>
  Dashboard
  
</NavLink>
<NavLink
  to="/new-request"
  style={({ isActive }) => ({
    padding: "8px 10px",
    borderRadius: 8,
    textDecoration: "none",
    background: isActive ? "#f3f4f6" : "transparent",
    color: "inherit",
  })}
>
  New Request
</NavLink>


        <NavLink
          to="/inbox"
          style={({ isActive }) => ({
            padding: "8px 10px",
            borderRadius: 8,
            textDecoration: "none",
            background: isActive ? "#f3f4f6" : "transparent",
            color: "inherit",
          })}
        >
          Inbox
        </NavLink>

        <NavLink
          to="/archive"
          style={({ isActive }) => ({
            padding: "8px 10px",
            borderRadius: 8,
            textDecoration: "none",
            background: isActive ? "#f3f4f6" : "transparent",
            color: "inherit",
          })}
        >
          Archive
        </NavLink>

        {/* ✅ updated logout */}
        <button
          onClick={() => {
            auth.clear();
            nav("/login");
          }}
          style={{ marginTop: "auto", padding: "8px 10px", borderRadius: 8, cursor: "pointer" }}
        >
          Logout
        </button>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: 16 }}>
        <div
          style={{
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: 8,
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <strong>Approvals</strong>
          <span style={{ opacity: 0.7 }}>{email}</span> {/* ✅ added */}
        </div>

        <Outlet />
      </main>
    </div>
  );
}
