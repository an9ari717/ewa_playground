// src/components/SidebarV2.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../store/auth";

type NavItem = { to: string; label: string; icon?: React.ReactNode; exact?: boolean };

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        width: 20,
        height: 20,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "inherit",
        flexShrink: 0,
      }}
      aria-hidden
    >
      {children}
    </span>
  );
}

// all icons use currentColor so they follow text color
const HomeI = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5a1 1 0 0 1-1-1v-4.5h-3V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

const InboxI = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M4 12h4l2 3h4l2-3h4v7H4v-7Z" stroke="currentColor" strokeWidth="1.6" />
    <path d="M4 12 7 5h10l3 7" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

const FilesI = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M6 4h7l5 5v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path d="M13 4v5h5" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const PlusI = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const UsersI = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M16 20v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const SettingsI = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="m19 12 .9-1.2-1.2-2.1-1.5.2a6.7 6.7 0 0 0-1.2-.7l-.2-1.5-2.1-1.2L12 5 10.8 3.9 8.7 5.1l.2 1.5c-.4.2-.8.4-1.2.7l-1.5-.2L5 9.7 5.9 11 5 12l.9 1.2-1.2 2.1 1.5.2c.4.3.8.5 1.2.7l.2 1.5 2.1 1.2L12 19l1.2 1.1 2.1-1.2-.2-1.5c.4-.2.8-.4 1.2-.7l1.5.2 1.2-2.1L19 12Z"
      stroke="currentColor"
      strokeWidth="1.2"
    />
  </svg>
);

const ArchiveI = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="4" width="16" height="4" rx="1" stroke="currentColor" strokeWidth="1.6" />
    <path d="M6 8v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" stroke="currentColor" strokeWidth="1.6" />
    <path d="M9 12h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

function Item(
  { to, label, icon, exact, collapsed: _collapsed }: NavItem & { collapsed: boolean }
) {
  return (
    <NavLink
      to={to}
      end={!!exact}
      className={({ isActive }) => `sbv2-item ${isActive ? "active" : ""}`}
      title={label}
    >
      <Icon>{icon}</Icon>
      <span className="sbv2-label">{label}</span>
    </NavLink>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="sbv2-title">{children}</div>;
}

export default function SidebarV2() {
  const storeMe = useAuth((s) => s.me);
  let me: any = storeMe;
  if (!me) {
    try {
      const raw = localStorage.getItem("ewa.user");
      if (raw) me = JSON.parse(raw);
    } catch {}
  }

  const role: string | undefined = me?.role;

  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem("ewa.sidebar.collapsed") === "1";
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    const w = collapsed ? "76px" : "272px";
    document.documentElement.style.setProperty("--sidebar-width", w);
    try {
      localStorage.setItem("ewa.sidebar.collapsed", collapsed ? "1" : "0");
    } catch {}
  }, [collapsed]);

  // 🔹 Role-aware dashboard destination
  const dashPath =
    role === "MANAGER"
      ? "/app/manager/dashboard"
      : role === "DIRECTOR"
      ? "/app/director/dashboard"
      : "/app/dashboard"; // EMPLOYEE/Admin fallback

  return (
    <div className="sbv2-wrap">
      {/* Top */}
      <div className={`sbv2-top ${collapsed ? "center" : ""}`}>
        {!collapsed ? (
          <div className="sbv2-brand" aria-label="EWA Dashboard">EWA Dashboard</div>
        ) : (
          <div className="sbv2-brand-dot" aria-hidden />
        )}
        <button
          title={collapsed ? "Expand" : "Collapse"}
          onClick={() => setCollapsed((v) => !v)}
          className="sbv2-collapse-btn"
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      {/* Overview */}
      <SectionTitle>Overview</SectionTitle>
      <nav className="sbv2-group">
        <Item to={dashPath} label="Dashboard" icon={HomeI} exact collapsed={collapsed} />
        <Item to="/app/archive" label="Archive" icon={ArchiveI} collapsed={collapsed} />
      </nav>

      {/* Employee */}
      {role === "EMPLOYEE" && (
        <>
          <SectionTitle>Employee</SectionTitle>
          <nav className="sbv2-group">
            <Item to="/app/employee/request" label="New Request" icon={PlusI} collapsed={collapsed} />
            <Item to="/app/employee/requests" label="My Requests" icon={FilesI} collapsed={collapsed} />
          </nav>
        </>
      )}

      {/* Manager */}
      {role === "MANAGER" && (
        <>
          <SectionTitle>Manager</SectionTitle>
          <nav className="sbv2-group">
            <Item to="/app/manager/inbox" label="Inbox" icon={InboxI} collapsed={collapsed} />
          </nav>
        </>
      )}

      {/* Director */}
      {role === "DIRECTOR" && (
        <>
          <SectionTitle>Director</SectionTitle>
          <nav className="sbv2-group">
            <Item to="/app/director/inbox" label="Inbox" icon={InboxI} collapsed={collapsed} />
          </nav>
        </>
      )}

      {/* Admin */}
      {role === "ADMIN" && (
        <>
          <SectionTitle>Admin</SectionTitle>
          <nav className="sbv2-group">
            <Item to="/app/admin" label="Admin Panel" icon={UsersI} collapsed={collapsed} />
            <Item to="/app/settings" label="Settings" icon={SettingsI} collapsed={collapsed} />
          </nav>
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* Footer */}
      <div className={`sbv2-footer ${collapsed ? "center" : ""}`}>
        <span className="sbv2-label">Light / Dark</span>
      </div>

      {/* Styles */}
      <style>{`
        :root { --sidebar-width: 272px; }
        .sbv2-wrap {
          height: 100%;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: #ffffff;
        }

        /* Top bar */
        .sbv2-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px;
        }
        .sbv2-top.center { justify-content: center; gap: 8px; }
        .sbv2-brand {
          font-weight: 800;
          letter-spacing: .2px;
          color: #0f172a;
        }
        .sbv2-brand-dot {
          width: 20px; height: 20px; border-radius: 6px; background: #111827;
        }
        .sbv2-collapse-btn {
          border: 1px solid #e5e7eb;
          background: #fff;
          border-radius: 8px;
          padding: 4px 8px;
          cursor: pointer;
          line-height: 1;
          font-weight: 600;
          color: #374151;
          transition: box-shadow .15s ease, border-color .15s ease, background .15s ease;
        }
        .sbv2-collapse-btn:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }
        .sbv2-collapse-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59,130,246,.35);
        }

        /* Section title */
        .sbv2-title {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #6b7280;
          margin: 12px 8px 6px;
          opacity: 0.9;
        }

        /* Group container */
        .sbv2-group {
          display: grid;
          gap: 4px;
          padding: 4px 4px 10px;
          border-bottom: 1px solid #f1f5f9;
          margin: 0 2px;
        }

        /* Item */
        .sbv2-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 10px;
          text-decoration: none;
          color: #374151;
          transition: background .15s ease, color .15s ease, transform .12s ease;
          outline: none;
        }
        .sbv2-item:hover {
          background: #f3f4f6;
          color: #111827;
        }
        .sbv2-item:active { transform: translateY(0.5px); }
        .sbv2-item.active { background: #111827; color: #ffffff; }
        .sbv2-item:focus-visible { box-shadow: 0 0 0 3px rgba(59,130,246,.35); }

        /* Footer */
        .sbv2-footer {
          border-top: 1px solid #e5e7eb;
          padding-top: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #6b7280;
          font-size: 12px;
          margin-top: 4px;
        }
        .sbv2-footer.center { justify-content: center; }

        .sbv2-label { display: inline-block; }
      `}</style>

      {/* Collapsed overrides */}
      {collapsed && (
        <style>{`
          .sbv2-title { display: none !important; }
          .sbv2-label { display: none !important; }
          .sbv2-group { padding-bottom: 6px; border-bottom-color: transparent; }
        `}</style>
      )}
    </div>
  );
}
