// src/layouts/AppShell.tsx
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import { logoutLocal } from "../services/auth";
import Sidebar from "../components/Sidebar";

export default function AppShell() {
  const nav = useNavigate();
  const storeMe = useAuth((s) => s.me);

  let me = storeMe as any;
  if (!me) {
    try {
      const raw = localStorage.getItem("ewa.user");
      if (raw) me = JSON.parse(raw);
    } catch {}
  }

  const handleLogout = () => {
    logoutLocal();
    nav("/login", { replace: true });
  };

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      {/* Header */}
      <header
        className="bg-white border-b px-4"
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #e5e7eb",
          background: "#fff",
        }}
      >
        <div style={{ fontWeight: 600 }}>EWA Dashboard</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {me ? (
            <>
              <div style={{ lineHeight: 1.1, textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{me.email}</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>
                  {String(me.role || "").toUpperCase()}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200"
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: "#f3f4f6",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </>
          ) : null}
        </div>
      </header>

      {/* Body */}
      <div
        style={{
          display: "flex",
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Fixed sidebar column */}
        <aside
          className="border-r bg-white"
          style={{
            width: 272, // 17rem ~ w-68, a bit roomier than 64
            flexShrink: 0,
            borderRight: "1px solid #e5e7eb",
            background: "#fff",
          }}
        >
          <Sidebar />
        </aside>

        {/* Main content */}
        <main
          className="p-6"
          style={{
            flex: 1,
            minWidth: 0,
            padding: 24,
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
