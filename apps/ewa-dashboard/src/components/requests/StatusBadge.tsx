type Props = { status: "PENDING" | "APPROVED" | "REJECTED" };

export default function StatusBadge({ status }: Props) {
  const color =
    status === "APPROVED"
      ? "bg-green-100 text-green-700"
      : status === "REJECTED"
      ? "bg-red-100 text-red-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
      {status}
    </span>
  );
}
