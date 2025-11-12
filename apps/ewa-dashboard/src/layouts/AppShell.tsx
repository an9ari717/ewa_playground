// src/layouts/AppShell.tsx
import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import { logoutLocal } from "../services/auth";
import SidebarV2 from "../components/SidebarV2";

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

  // header elevation on scroll
  const headerRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const onScroll = () => {
      const el = headerRef.current;
      if (!el) return;
      if (window.scrollY > 2) el.classList.add("app-header--elevated");
      else el.classList.remove("app-header--elevated");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const initials =
    (me?.name?.trim()?.split(/\s+/)?.map((s: string) => s[0])?.slice(0, 2).join("") ??
      me?.email?.[0]?.toUpperCase() ??
      "U");

  const role = String(me?.role || "").toUpperCase();

  return (
    <div className="app-root">
      {/* Header */}
      <header ref={headerRef} className="app-header">
        <div className="app-header__left">
          <div className="app-brand">EWA Dashboard</div>
        </div>
        <div className="app-header__right">
          {me ? (
            <>
              <div className="app-user">
                <div className="app-avatar" aria-hidden>{initials}</div>
                <div className="app-user__meta">
                  <div className="app-user__email" title={me.email}>{me.email}</div>
                  <div className={`app-role app-role--${role.toLowerCase()}`}>{role}</div>
                </div>
              </div>
              <button onClick={handleLogout} className="app-btn app-btn--ghost">
                Logout
              </button>
            </>
          ) : null}
        </div>
      </header>

      {/* Body */}
      <div className="app-body">
        {/* Fixed sidebar column */}
        <aside className="app-aside">
          <SidebarV2 />
        </aside>

        {/* Main content */}
        <main className="app-main">
          <Outlet />
        </main>
      </div>

      {/* Styles */}
      <style>{`
        :root {
          --sidebar-width: 272px;
          --header-h: 56px;
          --page-pad: 24px;
          --border: #e5e7eb;
          --text: #0f172a;
          --muted: #6b7280;
          --bg: #f8fafc;
          --white: #ffffff;
        }
        .app-root {
          min-height: 100vh;
          background: var(--bg);
          display: flex;
          flex-direction: column;
        }

        /* Header */
        .app-header {
          position: sticky;
          top: 0;
          z-index: 30;
          height: var(--header-h);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          background: rgba(255,255,255,0.85);
          backdrop-filter: saturate(150%) blur(6px);
          border-bottom: 1px solid var(--border);
          transition: box-shadow .18s ease, border-color .18s ease, background .18s ease;
        }
        .app-header--elevated {
          box-shadow: 0 6px 18px rgba(15,23,42,.06);
          border-bottom-color: #e2e8f0;
          background: rgba(255,255,255,0.9);
        }
        .app-header__left, .app-header__right {
          display: flex; align-items: center; gap: 12px;
        }
        .app-brand {
          font-weight: 800;
          letter-spacing: .2px;
          color: var(--text);
        }

        /* User block */
        .app-user { display: flex; align-items: center; gap: 10px; }
        .app-avatar {
          width: 30px; height: 30px; border-radius: 10px;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700;
          color: #fff; background: #111827; letter-spacing: .2px;
          user-select: none;
        }
        .app-user__meta { line-height: 1.1; text-align: left; }
        .app-user__email { font-size: 14px; font-weight: 600; color: var(--text); max-width: 260px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .app-role {
          margin-top: 2px;
          font-size: 11px; font-weight: 700; letter-spacing: .06em;
          color: #0f172a; background: #f1f5f9; border: 1px solid #e2e8f0;
          padding: 2px 6px; border-radius: 999px; display: inline-block;
        }
        /* optional role accent hues */
        .app-role--employee { background:#eef2ff; border-color:#e0e7ff; color:#3730a3; }
        .app-role--manager  { background:#ecfeff; border-color:#cffafe; color:#0e7490; }
        .app-role--director { background:#fff7ed; border-color:#ffedd5; color:#c2410c; }
        .app-role--admin    { background:#f0fdf4; border-color:#dcfce7; color:#166534; }

        /* Buttons */
        .app-btn {
          border: 1px solid var(--border);
          background: #f3f4f6;
          color: #374151;
          border-radius: 8px;
          padding: 8px 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background .15s ease, border-color .15s ease, box-shadow .15s ease, transform .12s ease;
        }
        .app-btn:hover { background: #e5e7eb; }
        .app-btn:active { transform: translateY(0.5px); }
        .app-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,.35); }
        .app-btn--ghost { background: #fff; }

        /* Body layout */
        .app-body {
          display: flex;
          flex: 1;
          min-height: 0;
        }
        .app-aside {
          width: var(--sidebar-width, 272px);
          flex-shrink: 0;
          border-right: 1px solid var(--border);
          background: var(--white);
          transition: width .18s ease;
        }
        .app-main {
          flex: 1;
          min-width: 0;
          padding: var(--page-pad);
        }

        /* Narrow view tuning */
        @media (max-width: 900px) {
          :root { --page-pad: 16px; }
          .app-user__email { max-width: 160px; }
        }
      `}</style>
    </div>
  );
}
