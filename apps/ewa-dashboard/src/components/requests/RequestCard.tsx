import StatusBadge from "./StatusBadge";

type Props = {
  id: string;
  title: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  onOpen?: () => void;
};

export default function RequestCard({ id, title, status, onOpen }: Props) {
  return (
    <div className="p-4 rounded-xl border shadow-sm flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-500">#{id}</div>
        <div className="font-medium">{title}</div>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status={status} />
        {onOpen && (
          <button className="px-3 py-1 rounded-lg border" onClick={onOpen}>
            Open
          </button>
        )}
      </div>
    </div>
  );
}
