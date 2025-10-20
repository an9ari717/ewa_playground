import { useNavigate } from "react-router-dom";
import StatusBadge from "./StatusBadge";

type Row = {
  id: string;
  type: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  updatedAt: string; // ISO
};

type Props = { rows: Row[] };

export default function RequestTable({ rows }: Props) {
  const nav = useNavigate();

  if (!rows.length) {
    return <p className="text-sm text-gray-500">No data yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[640px] w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2 pr-4">ID</th>
            <th className="py-2 pr-4">Type</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4">Last Update</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className="border-b hover:bg-gray-50 cursor-pointer"
              onClick={() => nav(`/requests/${r.id}`)}
            >
              <td className="py-2 pr-4">{r.id}</td>
              <td className="py-2 pr-4">{r.type}</td>
              <td className="py-2 pr-4">
                <StatusBadge status={r.status} />
              </td>
              <td className="py-2 pr-4">
                {new Date(r.updatedAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
