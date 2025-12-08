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
    return (
      <p
        style={{
          fontSize: 13,
          color: "var(--muted)",
        }}
      >
        No data yet.
      </p>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          minWidth: "640px",
          width: "100%",
          fontSize: 13,
          borderCollapse: "collapse",
          color: "var(--text)",
        }}
      >
        <thead>
          <tr
            style={{
              textAlign: "left",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <th style={{ padding: "8px 16px 8px 0" }}>ID</th>
            <th style={{ padding: "8px 16px 8px 0" }}>Type</th>
            <th style={{ padding: "8px 16px 8px 0" }}>Status</th>
            <th style={{ padding: "8px 0 8px 0" }}>Last Update</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              onClick={() => nav(`/requests/${r.id}`)}
              style={{
                borderBottom: "1px solid var(--border)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                  "var(--bg-soft)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                  "transparent";
              }}
            >
              <td style={{ padding: "8px 16px 8px 0" }}>{r.id}</td>
              <td style={{ padding: "8px 16px 8px 0" }}>{r.type}</td>
              <td style={{ padding: "8px 16px 8px 0" }}>
                <StatusBadge status={r.status} />
              </td>
              <td style={{ padding: "8px 0 8px 0" }}>
                {new Date(r.updatedAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
