// src/pages/manager/Inbox.tsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import Table from "../../components/Table";
import Button from "../../components/Button";
import { useRequests } from "../../hooks/useRequests";
import StatusBadge from "../../components/requests/StatusBadge";

type Row = {
  id: string;
  requestNo: string;
  type: string;
  title: string;
  submittedBy: string;
  submittedAt: string; // ISO
  status: string;
};

// re-use same date style everywhere
function formatDateShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ManagerInbox() {
  const nav = useNavigate();

  const [page, setPage] = useState(1);
  const pageSize = 10;

  // manager inbox = things waiting on MANAGER
  const { data, isLoading, isError, isFetching, refetch } = useRequests(
    "inbox",
    "MANAGER",
    page,
    pageSize
  );

  // normalize API response for table display
  const rows: Row[] = useMemo(() => {
    const items = data?.items ?? [];

    return items.map((r: any, idx: number) => {
      const friendlyId = r.id?.startsWith("REQ-")
        ? r.id
        : `REQ-${page}-${idx + 1}`;

      return {
        id: r.id,
        requestNo: friendlyId,
        type: r.type ?? "-",
        title: r.title ?? "-",
        submittedBy:
          (r.createdBy && (r.createdBy.name || r.createdBy.email)) || "—",
        submittedAt: r.createdAt ?? "",
        status: r.status ?? "PENDING",
      };
    });
  }, [data, page]);

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
      header: "Reason / Title",
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
      key: "submittedBy",
      header: "From",
      width: 160,
      render: (r: Row) => (
        <span style={{ fontSize: 12, color: "#111827" }}>
          {r.submittedBy}
        </span>
      ),
    },
    {
      key: "submittedAt",
      header: "Received",
      width: 140,
      render: (r: Row) => (
        <span style={{ fontSize: 12, color: "#6b7280" }}>
          {r.submittedAt ? formatDateShort(r.submittedAt) : "-"}
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
      key: "actions",
      header: "",
      width: 100,
      render: (r: Row) => (
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            nav(`/app/requests/${r.id}`);
          }}
        >
          View / Act
        </Button>
      ),
    },
  ];

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div style={{ maxWidth: 980 }}>
      <PageHeader
        title="Manager — Inbox"
        subtitle={
          isFetching
            ? "Refreshing…"
            : "Requests waiting for your approval."
        }
      />

      {isLoading ? (
        <div>Loading…</div>
      ) : isError ? (
        <>
          <div style={{ color: "crimson", marginBottom: 12 }}>
            Failed to load.
          </div>
          <Button size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </>
      ) : (
        <>
          <Table
            columns={columns}
            data={rows}
            emptyText="Nothing pending for you."
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 12,
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
