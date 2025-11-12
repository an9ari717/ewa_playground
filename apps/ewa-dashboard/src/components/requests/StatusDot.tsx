// src/components/requests/StatusDot.tsx
import React from "react";

export default function StatusDot({ status }: { status?: string }) {
  const s = (status ?? "").toUpperCase();

  // color map
  const color =
    s === "APPROVED" || s === "COMPLETED"
      ? "#16a34a" // ✅ green
      : s === "REJECTED"
      ? "#dc2626" // red
      : s === "CANCELLED"
      ? "#64748b" // gray
      : "#f59e0b"; // pending / default yellow

  // label: rename COMPLETED → APPROVED
  const label = s === "COMPLETED" ? "APPROVED" : s || "PENDING";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontWeight: 600,
        textTransform: "uppercase",
        fontSize: 13,
        color: color,
      }}
    >
      <span
        aria-hidden
        style={{
          display: "inline-block",
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
        }}
      />
      {label}
    </span>
  );
}
