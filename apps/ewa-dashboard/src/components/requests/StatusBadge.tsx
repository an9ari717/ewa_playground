// src/components/requests/StatusBadge.tsx

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
  APPROVED: { text: "#15803d", bg: "#dcfce7" }, // green-700 on green-100
  REJECTED: { text: "#b91c1c", bg: "#fee2e2" }, // red-700 on red-100
  PENDING: { text: "#b45309", bg: "#fef3c7" },  // amber-700 on amber-100
  IN_REVIEW: { text: "#1d4ed8", bg: "#dbeafe" }, // blue-700 on blue-100
  CANCELLED: { text: "#4b5563", bg: "#e5e7eb" }, // gray
  ARCHIVED: { text: "#475569", bg: "#e2e8f0" },  // slate
  DRAFT: { text: "#475569", bg: "#f1f5f9" },     // softer slate
  ESCALATED: { text: "#7c3aed", bg: "#f3e8ff" }, // purple
  DEFAULT: { text: "#111827", bg: "#f3f4f6" },
};

export default function StatusBadge({ status, size = "md" }: Props) {
  const rawKey = String(status || "").toUpperCase();

  // COMPLETED should visually behave like APPROVED
  const key = rawKey === "COMPLETED" ? "APPROVED" : rawKey;

  const color = COLORS[key] || COLORS.DEFAULT;
  const label = key; // already mapped above

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
        fontSize: size === "sm" ? 11 : 12,
        textTransform: "uppercase",
        color: color.text,
        background: color.bg,
        border: "1px solid rgba(148,163,184,0.35)", // subtle border
      }}
    >
      <span
        aria-hidden
        style={{
          width: size === "sm" ? 6 : 8,
          height: size === "sm" ? 6 : 8,
          borderRadius: "50%",
          background: color.text,
          boxShadow: `0 0 0 2px ${color.bg}`, // soft halo
        }}
      />
      <span>{label}</span>
    </span>
  );
}
