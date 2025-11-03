// src/pages/director/Inbox.tsx
import React from "react";
import Table from "../../components/Table";
import { useRequests } from "../../hooks/useRequests";
import StatusBadge from "../../components/requests/StatusBadge";
import { Link } from "react-router-dom";

type Row = {
  req: React.ReactElement;
  type: string;
  title: string;
  from: string;
  createdAt: string;
  status: React.ReactElement;
};

export default function DirectorInbox() {

  // This page is for the Director inbox; keep it explicit.
  // If you ever make a shared page, you can switch this back to me?.role.
  const role = "DIRECTOR";

  const { data, isLoading, isError } = useRequests("inbox", role);

  const rows: Row[] =
    data?.items?.map((r) => ({
      req: (
        <Link
          to={`/app/requests/${r.id}`}
          style={{ textDecoration: "underline", color: "#2563eb" }}
        >
          {r.id.slice(0, 8)}
        </Link>
      ),
      type: r.type,
      title: r.title,
      from: r.createdBy?.name ?? "—",
      createdAt: r.createdAt,
      status: <StatusBadge status={r.status} />,
    })) ?? [];

  const columns = React.useMemo(
    () => [
      { key: "req", header: "Request #" },
      { key: "type", header: "Type" },
      { key: "title", header: "Reason / Title" },
      { key: "from", header: "From" },
      { key: "createdAt", header: "Received" },
      { key: "status", header: "Status" },
    ],
    []
  );

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Director — Inbox</h2>
        <p style={{ color: "#666" }}>Requests waiting for your approval.</p>
      </div>

      {isLoading && <p>Loading…</p>}
      {isError && <p style={{ color: "red" }}>Failed to load your inbox.</p>}

      {rows.length ? (
        <Table<Row> columns={columns} data={rows} />
      ) : (
        !isLoading && <p>Nothing pending for you.</p>
      )}
    </div>
  );
}
