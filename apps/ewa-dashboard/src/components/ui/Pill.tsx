// src/components/ui/Pill.tsx
import React from "react";

export type PillColor = "green" | "blue" | "purple" | "red" | "gray";

interface PillProps {
  children: React.ReactNode;
  color: PillColor;
}

export function Pill({ children, color }: PillProps) {
  const map: Record<PillColor, { bg: string; text: string; border: string }> = {
    green: {
      bg: "#ecfdf3",
      text: "#166534",
      border: "#bbf7d0",
    },
    blue: {
      bg: "#eff6ff",
      text: "#1d4ed8",
      border: "#bfdbfe",
    },
    purple: {
      bg: "#f5f3ff",
      text: "#6b21a8",
      border: "#e9d5ff",
    },
    red: {
      bg: "#fef2f2",
      text: "#b91c1c",
      border: "#fecaca",
    },
    gray: {
      bg: "#f3f4f6",
      text: "#374151",
      border: "#e5e7eb",
    },
  };

  const { bg, text, border } = map[color];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        backgroundColor: bg,
        color: text,
        border: `1px solid ${border}`,
      }}
    >
      {children}
    </span>
  );
}
