// src/pages/employee/MyRequests.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import Table from "../../components/Table";
import Button from "../../components/Button";
import { useRequests } from "../../hooks/useRequests";
import StatusBadge from "../../components/requests/StatusBadge"; // if this errors we'll fix next step

// This Row matches what we actually render in the table
type Row = {
  id: string;
  requestNo: string; // friendly ID we show
  type: string;
  title: string;
  createdAt: string;
  status: string;
  currentStage: string;
  createdByName: string;
};

// helper to format date like "20 Oct 2025"
function formatDateShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function MyRequests() {
  const nav = useNavigate();

  // pagination UI state
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // load current user's requests
  const { data, isLoading, isError, refetch, isFetching } = useRequests(
    "my",
    undefined,
    page,
    pageSize
  );

  // transform API response into table rows
  const rows: Row[] = useMemo(() => {
    const items = data?.items ?? [];

    return items.map((r: any, idx: number) => {
      // generate a friendly request number for display
      const friendlyId = r.id?.startsWith("REQ-")
        ? r.id
        : `REQ-${page}-${idx + 1}`;

      return {
        id: r.id,
        requestNo: friendlyId,
        type: r.type ?? "-",
        title: r.title ?? "-",
        createdAt: r.createdAt ?? "",
        status: r.status ?? "UNKNOWN",
        currentStage: r.currentStage ?? "-",
        createdByName: r.createdBy?.name ?? "-",
      };
    });
  }, [data, page]);

  // columns visible in My Requests
  const columns = [
    {
      key: "requestNo",
      header: "Request #",
      width: 120,
      render: (r: Row) => (
        <button
          onClick={() => nav(`/app/requests/${r.id}`)}
          style={{
            textDecoration: "underline",
            color: "#2563eb",
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          {r.requestNo}
        </button>
      ),
    },
    {
      key: "type",
      header: "Type",
      width: 140,
      render: (r: Row) => (
        <span style={{ fontSize: 13 }}>{r.type}</span>
      ),
    },
    {
      key: "title",
      header: "Title / Reason",
      render: (r: Row) => (
        <span
          style={{
            fontSize: 13,
            color: "#4b5563",
            display: "inline-block",
            maxWidth: 260,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={r.title}
        >
          {r.title}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      width: 140,
      render: (r: Row) => (
        <span style={{ fontSize: 12, color: "#6b7280" }}>
          {r.createdAt ? formatDateShort(r.createdAt) : "-"}
        </span>
      ),
    },
   {
  key: "status",
  header: "Status",
  width: 140,
  render: (r: Row) => (
    <StatusBadge status={r.status as any} size="sm" />
  ),
},

    {
      key: "currentStage",
      header: "Stage",
      width: 120,
      render: (r: Row) => (
        <span style={{ fontSize: 12, color: "#6b7280" }}>
          {r.currentStage}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      width: 80,
      render: (r: Row) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => nav(`/app/requests/${r.id}`)}
        >
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
        title="My Requests"
        subtitle={
          isFetching ? "Refreshing…" : "Everything you have submitted."
        }
      />

      {isLoading ? (
        <div>Loading…</div>
      ) : isError ? (
        <div style={{ color: "crimson", marginBottom: 12 }}>
          Failed to load.{" "}
          <button
            style={{
              background: "transparent",
              border: "1px solid #ccc",
              borderRadius: 4,
              padding: "2px 6px",
              cursor: "pointer",
              fontSize: 12,
            }}
            onClick={() => refetch()}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <Table
            columns={columns}
            data={rows}
            emptyText="You haven’t submitted anything yet."
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 12,
              fontSize: 13,
            }}
          >
            <Button
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Prev
            </Button>

            <span style={{ fontSize: 12 }}>
              Page {page} / {totalPages} • Total {total}
            </span>

            <Button
              size="sm"
              onClick={() =>
                setPage((p) => Math.min(totalPages, p + 1))
              }
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
