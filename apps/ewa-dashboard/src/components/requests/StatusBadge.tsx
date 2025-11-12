//import React from "react";

type Status =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "IN_REVIEW"
  | "ESCALATED"
  | "DRAFT"
  | "ARCHIVED"
  | (string & {});

interface Props {
  status: Status;
  size?: "sm" | "md";
}

const COLORS: Record<string, { text: string; bg: string }> = {
  APPROVED: { text: "#16a34a", bg: "#dcfce7" }, // ✅ Green text + light green bg
  REJECTED: { text: "#dc2626", bg: "#fee2e2" },
  PENDING: { text: "#ca8a04", bg: "#fef9c3" },
  IN_REVIEW: { text: "#2563eb", bg: "#dbeafe" },
  CANCELLED: { text: "#4b5563", bg: "#e5e7eb" },
  ARCHIVED: { text: "#334155", bg: "#e2e8f0" },
  DRAFT: { text: "#334155", bg: "#f1f5f9" },
  ESCALATED: { text: "#7c3aed", bg: "#f3e8ff" },
  DEFAULT: { text: "#111827", bg: "#f3f4f6" },
};

export default function StatusBadge({ status, size = "md" }: Props) {
  const key = String(status || "").toUpperCase();
  const color = COLORS[key] || COLORS.DEFAULT;
  const label = key === "COMPLETED" ? "APPROVED" : key;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: size === "sm" ? "2px 8px" : "4px 10px",
        borderRadius: 999,
        fontWeight: 600,
        letterSpacing: ".03em",
        fontSize: size === "sm" ? 12 : 13,
        textTransform: "uppercase",
        color: color.text,
        background: color.bg,
      }}
    >
      <span
        aria-hidden
        style={{
          width: size === "sm" ? 6 : 8,
          height: size === "sm" ? 6 : 8,
          borderRadius: "50%",
          background: color.text,
          opacity: 0.9,
        }}
      />
      <span>{label}</span>
    </span>
  );
}
