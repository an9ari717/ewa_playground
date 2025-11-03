// src/components/requests/StatusBadge.tsx
import React from "react";

export type Size = "sm" | "md";

// If you had a Status union type in here originally, keep it.
// For safety we'll just accept string for now.
export default function StatusBadge({
  status,
  size = "md",
}: {
  status: string | undefined | null;
  size?: Size;
}) {
  // normalize value like "PENDING", "IN_REVIEW", "COMPLETED", "REJECTED"
  const value = (status || "").toUpperCase();

  // define a palette for known statuses
  const palette: Record<
    string,
    { bg: string; text: string; label?: string }
  > = {
    PENDING: {
      bg: "#fef3c7", // amber-100
      text: "#92400e", // amber-800
      label: "Pending",
    },
    IN_REVIEW: {
      bg: "#e0f2fe", // light blue
      text: "#075985", // blue-900
      label: "In review",
    },
    COMPLETED: {
      bg: "#d1fae5", // green-100
      text: "#065f46", // green-800
      label: "Completed",
    },
    APPROVED: {
      bg: "#d1fae5",
      text: "#065f46",
      label: "Approved",
    },
    REJECTED: {
      bg: "#fee2e2", // red-100
      text: "#991b1b", // red-800
      label: "Rejected",
    },
  };

  // fallback style if we don't recognize the status
  const fallback = {
    bg: "#e5e7eb", // gray-200
    text: "#374151", // gray-700
    label: value || "Unknown",
  };

  const { bg, text, label } = palette[value] ?? fallback;

  const padding = size === "sm" ? "2px 6px" : "4px 8px";
  const fontSize = size === "sm" ? "11px" : "12px";

  return (
    <span
      style={{
        display: "inline-block",
        backgroundColor: bg,
        color: text,
        borderRadius: 9999,
        fontSize,
        fontWeight: 500,
        lineHeight: 1.2,
        padding,
        minWidth: 60,
        textAlign: "center",
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  );
}
