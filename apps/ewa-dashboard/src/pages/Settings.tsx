// src/pages/Settings.tsx
//import React from "react";
import { useTheme } from "../store/theme";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const isLight = theme === "light";
  const isDark = theme === "dark";

  const handleSelect = (next: "light" | "dark") => {
    setTheme(next);
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Page header */}
      <h1 style={{ fontSize: 24, marginBottom: 8, color: "var(--text)" }}>
        Settings
      </h1>
      <p style={{ marginBottom: 24, color: "var(--muted)" }}>
        Personal preferences for your dashboard.
      </p>

      {/* Appearance card */}
      <div
        style={{
          maxWidth: 520,
          background: "var(--card)",
          borderRadius: 12,
          border: "1px solid var(--border)",
          padding: 20,
        }}
      >
        <h2
          style={{
            fontSize: 16,
            marginBottom: 12,
            color: "var(--text)",
          }}
        >
          Appearance
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "var(--muted)",
            marginBottom: 16,
          }}
        >
          Choose how the EWA dashboard looks on this device.
        </p>

        {/* Theme selector row */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 8,
          }}
        >
          {/* Light button */}
          <button
            type="button"
            onClick={() => handleSelect("light")}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 999,
              border: isLight ? "1px solid #111827" : "1px solid var(--border)",
              background: isLight ? "#111827" : "var(--card)",
              color: isLight ? "#ffffff" : "var(--text)",
              fontWeight: 500,
            }}
          >
            Light
          </button>

          {/* Dark button */}
          <button
            type="button"
            onClick={() => handleSelect("dark")}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 999,
              border: isDark ? "1px solid #111827" : "1px solid var(--border)",
              background: isDark ? "#111827" : "var(--card)",
              color: isDark ? "#ffffff" : "var(--text)",
              fontWeight: 500,
            }}
          >
            Dark
          </button>
        </div>

        <p style={{ fontSize: 12, color: "var(--muted)" }}>
          Your choice is saved in this browser as <code>ewa.theme</code>.
        </p>
      </div>
    </div>
  );
}
