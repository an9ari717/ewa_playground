// src/layouts/AppShell.tsx
import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import { logoutLocal } from "../services/auth";
import SidebarV2 from "../components/SidebarV2";
import TopBrand from "../components/TopBrand"; // ✅ reusable EWA logo component

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
    (me?.name
      ?.trim()
      ?.split(/\s+/)
      ?.map((s: string) => s[0])
      ?.slice(0, 2)
      .join("") ??
      me?.email?.[0]?.toUpperCase() ??
      "U");

  const role = String(me?.role || "").toUpperCase();

  return (
    <div className="app-root">
      {/* Header */}
      <header ref={headerRef} className="app-header">
        {/* Left brand text */}
        <div className="app-header__left">
          <div className="app-brand">EWA Dashboard</div>
        </div>

        {/* Centered EWA logo via reusable component */}
        <TopBrand />

        {/* Right user info */}
        <div className="app-header__right">
          {me ? (
            <>
              <div className="app-user">
                <div className="app-avatar" aria-hidden>
                  {initials}
                </div>
                <div className="app-user__meta">
                  <div className="app-user__email" title={me.email}>
                    {me.email}
                  </div>
                  <div className={`app-role app-role--${role.toLowerCase()}`}>
                    {role}
                  </div>
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
          --header-h: 60px;
          --page-pad: 24px;
        }

        .app-root {
          min-height: 100vh;
          background: var(--bg);  /* ✅ just use theme background */
          color: var(--text);
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
          padding: 0 18px;
          background: color-mix(in srgb, var(--card) 94%, transparent);
          backdrop-filter: saturate(150%) blur(10px);
          border-bottom: 1px solid rgba(148,163,184,0.35);
          transition:
            box-shadow .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .app-header--elevated {
          box-shadow: 0 10px 30px rgba(15,23,42,.18);
          border-bottom-color: rgba(148,163,184,0.55);
          background: color-mix(in srgb, var(--card) 98%, transparent);
        }

        .app-header__left,
        .app-header__right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .app-brand {
          font-weight: 800;
          letter-spacing: .06em;
          font-size: 13px;
          text-transform: uppercase;
          color: var(--muted);
        }

        /* Centered EWA logo (TopBrand) */
        .app-header__middle {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          height: var(--header-h);
          pointer-events: none; /* keeps left/right clickable */
        }

        .app-header__logo {
          height: 30px;
          opacity: 0.96;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.12));
        }

        @media (max-width: 640px) {
          .app-header__logo {
            height: 26px;
          }
        }

        /* User block */
        .app-user {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .app-avatar {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: #fff;
          background: linear-gradient(135deg, #0f172a, #1d4ed8);
          letter-spacing: .12em;
          text-transform: uppercase;
          user-select: none;
          box-shadow: 0 4px 10px rgba(15,23,42,.35);
        }

        .app-user__meta {
          line-height: 1.1;
          text-align: left;
        }

        .app-user__email {
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
          max-width: 240px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .app-role {
          margin-top: 3px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .14em;
          padding: 2px 7px;
          border-radius: 999px;
          display: inline-block;
          background: var(--bg-soft);
          border: 1px solid var(--border);
          color: var(--text);
          text-transform: uppercase;
        }

        .app-role--employee { background:#eef2ff; border-color:#e0e7ff; color:#3730a3; }
        .app-role--manager  { background:#ecfeff; border-color:#cffafe; color:#0e7490; }
        .app-role--director { background:#fff7ed; border-color:#ffedd5; color:#c2410c; }
        .app-role--admin    { background:#f0fdf4; border-color:#dcfce7; color:#166534; }

        .app-btn {
          border: 1px solid rgba(148,163,184,0.6);
          background: color-mix(in srgb, var(--card) 96%, transparent);
          color: var(--text);
          border-radius: 999px;
          padding: 7px 14px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition:
            background .15s ease,
            border-color .15s ease,
            box-shadow .15s ease,
            transform .12s ease;
        }

        .app-btn:hover {
          background: var(--bg-soft);
          border-color: rgba(148,163,184,0.9);
          box-shadow: 0 4px 12px rgba(15,23,42,.18);
        }

        .app-btn:active {
          transform: translateY(0.5px);
          box-shadow: 0 3px 8px rgba(15,23,42,.16);
        }

        .app-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59,130,246,.45);
        }

        .app-btn--ghost {
          background: transparent;
        }

        .app-body {
          display: flex;
          flex: 1;
          min-height: 0;
        }

        .app-aside {
          width: var(--sidebar-width, 272px);
          flex-shrink: 0;
          border-right: 1px solid var(--border);
          background: var(--sidebar-bg);
          transition: width .18s ease;
        }

        .app-main {
          flex: 1;
          min-width: 0;
          padding: var(--page-pad);
        }

        @media (max-width: 900px) {
          :root { --page-pad: 16px; }
          .app-user__email { max-width: 150px; }
        }

        @media (max-width: 640px) {
          .app-header {
            padding-inline: 10px;
          }
          .app-brand {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

