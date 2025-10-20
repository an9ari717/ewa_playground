// src/pages/Archive.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Table from "../components/Table";
import Button from "../components/Button";
import { useRequests } from "../hooks/useRequests";

type Row = {
  id: string;
  type: string;
  title: string;
  createdAt: string; // ISO
  status: string;    // APPROVED | REJECTED | ARCHIVED | ...
};

export default function Archive() {
  const nav = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, isError, refetch, isFetching } = useRequests(
    "archive",
    undefined,
    page,
    pageSize
  );

  const rows: Row[] = useMemo(() => {
    const items = data?.items ?? [];
    return items.map((r) => ({
      id: r.id,
      type: typeof (r as any).type === "object"
        ? (r as any).type?.name ?? (r as any).type?.title ?? "-"
        : (r as any).type ?? "-",
      title: r.title,
      createdAt: r.createdAt,
      status: r.status,
    }));
  }, [data]);

  const columns = [
    {
      key: "id",
      header: "ID",
      width: 220,
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
    { key: "type", header: "Type", width: 160 },
    { key: "title", header: "Title" },
    {
      key: "createdAt",
      header: "Created",
      width: 200,
      render: (r: Row) => new Date(r.createdAt).toLocaleString(),
    },
    { key: "status", header: "Final Status", width: 140 },
    {
      key: "actions",
      header: "Actions",
      width: 120,
      render: (r: Row) => (
        <Button size="sm" variant="ghost" onClick={() => nav(`/app/requests/${r.id}`)}>
          View
        </Button>
      ),
    },
  ];

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div style={{ maxWidth: 980 }}>
      <PageHeader
        title="Archive"
        subtitle={isFetching ? "Refreshing…" : "Completed and closed requests."}
      />

      {isLoading ? (
        <div>Loading…</div>
      ) : isError ? (
        <div style={{ color: "crimson", marginBottom: 12 }}>
          Failed to load. <button onClick={() => refetch()}>Retry</button>
        </div>
      ) : (
        <>
          <Table columns={columns} data={rows} emptyText="No archived items." />
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
