// src/pages/Inbox.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Table from "../components/Table";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
import { useRequests } from "../hooks/useRequests";

type Row = {
  id: string;
  from: string;
  type: "LEAVE" | "PROCUREMENT" | "IT_SUPPORT" | string;
  title: string;
  receivedAt: string; // ISO
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
};

export default function Inbox() {
  const nav = useNavigate();

  // If you have an auth store with role, plug it in here
  const role = undefined; // backend can infer from cookie/session

  // Simple pagination (frontend). Your service already supports page/pageSize.
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, isError, isFetching, refetch } = useRequests(
    "inbox",
    role,
    page,
    pageSize
  );

  const rows: Row[] = useMemo(() => {
    const items = data?.items ?? [];
    return items.map((r) => ({
      id: r.id,
      from: (r.createdBy as any)?.name ?? "—",
      type: r.type,
      title: r.title,
      receivedAt: r.createdAt,
      status: r.status,
    }));
  }, [data]);

  const columns = [
    {
      key: "id",
      header: "ID",
      width: 200,
      render: (r: Row) => (
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            nav(`/app/requests/${r.id}`);
          }}
          style={{ textDecoration: "underline" }}
        >
          {r.id}
        </a>
      ),
    },
    { key: "from", header: "From", width: 220 },
    { key: "type", header: "Type", width: 140 },
    { key: "title", header: "Title" },
    {
      key: "receivedAt",
      header: "Received",
      width: 200,
      render: (r: Row) => new Date(r.receivedAt).toLocaleString(),
    },
    { key: "status", header: "Status", width: 120 },
    {
      key: "actions",
      header: "Actions",
      width: 280,
      render: (r: Row) => (
        <div style={{ display: "flex", gap: 8 }}>
          {/* We’ll wire these to the mutation after RequestDetails is in */}
          <Button variant="primary" size="sm" onClick={() => nav(`/app/requests/${r.id}`)}>
            Approve
          </Button>
          <Button size="sm" onClick={() => nav(`/app/requests/${r.id}`)}>
            Reject
          </Button>
          <Button size="sm" variant="ghost" onClick={() => nav(`/app/requests/${r.id}`)}>
            View
          </Button>
        </div>
      ),
    },
  ];

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div style={{ maxWidth: 980 }}>
      <PageHeader
        title="Inbox"
        subtitle={isFetching ? "Refreshing…" : "Items assigned to you for review."}
      />

      {isLoading ? (
        <div>Loading…</div>
      ) : isError ? (
        <div style={{ color: "crimson", marginBottom: 12 }}>
          Failed to load inbox. <button onClick={() => refetch()}>Retry</button>
        </div>
      ) : (
        <>
          <Table columns={columns} data={rows} emptyText="Nothing here yet." />

          {/* Pagination */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <Button size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              Prev
            </Button>
            <span style={{ fontSize: 12 }}>
              Page {page} / {totalPages} • Total {total}
            </span>
            <Button
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
