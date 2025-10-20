// src/components/PageHeader.tsx
import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode; // optional button or controls on the right
}

export default function PageHeader({ title, subtitle, right }: PageHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: subtitle ? "flex-end" : "center",
        marginBottom: 20,
      }}
    >
      <div>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            marginBottom: subtitle ? 6 : 0,
          }}
        >
          {title}
        </h2>
        {subtitle && <p style={{ color: "#6b7280" }}>{subtitle}</p>}
      </div>

      {right && <div>{right}</div>}
    </div>
  );
}
