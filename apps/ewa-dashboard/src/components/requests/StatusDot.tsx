export default function StatusDot({ status }: { status?: string }) {
  const s = (status ?? "").toUpperCase();
  const color =
    s === "APPROVED" ? "#16a34a" :
    s === "REJECTED" ? "#dc2626" :
    s === "CANCELLED" ? "#64748b" :
    "#f59e0b"; // pending / default
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block", width: 8, height: 8, borderRadius: 999,
        background: color, marginRight: 8, verticalAlign: "middle",
      }}
    />
  );
}
