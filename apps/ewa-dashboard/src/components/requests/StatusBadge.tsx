// src/components/requests/StatusBadge.tsx

type Status = "PENDING" | "APPROVED" | "REJECTED";
type Size = "sm" | "md";

export default function StatusBadge({
  status,
  size = "md",
}: {
  status: Status;
  size?: Size;
}) {
  const palette: Record<Status, { bg: string; fg: string }> = {
    PENDING:  { bg: "#fff7ed", fg: "#9a3412" },   // orange-ish
    APPROVED: { bg: "#ecfdf5", fg: "#065f46" },   // green
    REJECTED: { bg: "#fef2f2", fg: "#991b1b" },   // red
  };

  const pad = size === "sm" ? "2px 8px" : "4px 10px";
  const { bg, fg } = palette[status];

  return (
    <span
      style={{
        display: "inline-block",
        padding: pad,
        borderRadius: 999,
        fontSize: size === "sm" ? 12 : 13,
        fontWeight: 600,
        background: bg,
        color: fg,
        border: `1px solid ${fg}20`,
      }}
    >
      {status}
    </span>
  );
}
