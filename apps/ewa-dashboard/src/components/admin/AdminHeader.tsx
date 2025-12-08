// src/components/admin/AdminHeader.tsx
import React from "react";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  /** Right-side content (e.g. “New User” button) */
  actions?: React.ReactNode;
}

export default function AdminHeader({
  title,
  subtitle,
  actions,
}: AdminHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 16,
        marginBottom: 20,
      }}
    >
      <div>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 600,
            marginBottom: 6,
            color: "var(--text)",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              margin: 0,
              color: "var(--muted)",
              fontSize: 14,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {actions}
        </div>
      )}
    </div>
  );
}
