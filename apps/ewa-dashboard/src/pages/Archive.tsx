// src/pages/Archive.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Page from "../components/layout/Page";
import Card from "../components/ui/Card";
import Button from "../components/Button";
import { useRequests } from "../hooks/useRequests";
import RequestCard from "../components/requests/RequestCard";

type Item = {
  id: string;
  type: string;
  title: string;
  createdAt: string;
  status: "APPROVED" | "REJECTED" | "ARCHIVED" | "PENDING";
  createdBy?: { name?: string; email?: string } | null;
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

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

  const items: Item[] = useMemo(() => {
    const list = data?.items ?? [];
    return list.map((r: any) => ({
      id: r.id,
      type:
        typeof r?.type === "object"
          ? r.type?.name ?? r.type?.title ?? "-"
          : r?.type ?? "-",
      title: r.title ?? "-",
      createdAt: r.createdAt ?? "",
      status: (r.status as Item["status"]) ?? "ARCHIVED",
      createdBy: r.createdBy ?? r.requester ?? null,
    }));
  }, [data]);

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Page
      title="Archive"
      right={
        <Button size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Refreshing…" : "Refresh"}
        </Button>
      }
      maxWidth={1100}
      leftOffset={60}
    >
      <Card title="Completed and Closed Requests" stickyHeader stickyTop={0}>
        {/* Info bar */}
        <div
          style={{
            padding: "10px 12px",
            borderBottom: "1px solid #e5e7eb",
            background: "#f9fafb",
            fontSize: 13,
            color: "#475569",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div>
            {isFetching
              ? "Refreshing…"
              : "All requests that have been completed and archived."}
          </div>
          <div style={{ color: "#6b7280" }}>
            Total <strong>{total}</strong>
          </div>
        </div>

        {/* List */}
        <div style={{ padding: 12 }}>
          {isLoading ? (
            <div className="text-sm text-gray-600">Loading…</div>
          ) : isError ? (
            <div style={{ color: "crimson", marginBottom: 12 }}>
              Failed to load.{" "}
              <Button size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-sm text-gray-600">No archived items.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {items.map((it) => (
                <RequestCard
                  key={it.id}
                  id={it.id}
                  title={it.title || it.id}
                  type={it.type}
                  createdAt={formatDate(it.createdAt)}
                  createdBy={it.createdBy?.name || it.createdBy?.email || "—"}
                  status={it.status}
                  onOpen={() => nav(`/app/requests/${it.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && !isError && items.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 12px",
              borderTop: "1px solid #e5e7eb",
              background: "#f8fafc",
            }}
          >
            <Button
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Prev
            </Button>
            <span style={{ fontSize: 12, color: "#6b7280" }}>
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
        )}
      </Card>
    </Page>
  );
}
