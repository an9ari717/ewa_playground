// src/pages/employee/MyRequests.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Page from "../../components/layout/Page";
import Card from "../../components/ui/Card";
import Button from "../../components/Button";
import { useRequests } from "../../hooks/useRequests";
import RequestCard from "../../components/requests/RequestCard";

type CardStatus = "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED";

type Item = {
  id: string;
  type: string;
  title: string;
  createdAt: string;
  status: CardStatus;
  currentStage?: string;
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

function labelFromKey(key?: string) {
  if (!key) return undefined;
  const K = key.toUpperCase();
  if (K === "LEAVE") return "Leave";
  if (K === "PROCUREMENT") return "Procurement";
  if (K === "IT_SUPPORT" || K === "IT-SUPPORT" || K === "ITSUPPORT") return "IT Support";
  return key; // fallback
}

function resolveTypeLabel(r: any): string {
  if (typeof r?.type === "string" && r.type.trim())
    return labelFromKey(r.type) ?? r.type;
  const obj = typeof r?.type === "object" ? r.type : undefined;
  const objLabel = obj?.name ?? obj?.title ?? labelFromKey(obj?.key) ?? obj?.id;
  if (objLabel) return String(objLabel);
  const other =
    labelFromKey(r?.typeKey) ??
    labelFromKey(r?.typeId) ??
    r?.typeName ??
    r?.typeTitle;
  return other ? String(other) : "—";
}

// Ensure status always matches RequestCard's accepted union
function normalizeStatus(s: any): CardStatus {
  const x = String(s ?? "").toUpperCase();
  if (x === "APPROVED" || x === "REJECTED" || x === "ARCHIVED" || x === "PENDING") return x;
  return "PENDING";
}

export default function MyRequests() {
  const nav = useNavigate();

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // load current user's requests
  const { data, isLoading, isError, refetch, isFetching } = useRequests(
    "my",
    undefined,
    page,
    pageSize
  );

  // normalize for RequestCard
  const items: Item[] = useMemo(() => {
    const list = data?.items ?? [];
    return list.map((r: any) => ({
      id: r.id,
      type: resolveTypeLabel(r),
      title: r.title ?? "-",
      createdAt: r.createdAt ?? "",
      status: normalizeStatus(r.status),
      currentStage: r.currentStage ?? "-",
      createdBy: r.createdBy ?? r.requester ?? null,
    }));
  }, [data]);

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Page
      title="My Requests"
      right={
        <Button size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Refreshing…" : "Refresh"}
        </Button>
      }
      maxWidth={1100}
      leftOffset={60}
    >
      <Card title="Everything you have submitted" stickyHeader stickyTop={0}>
        {/* Top info strip */}
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
          <div>{isFetching ? "Refreshing…" : "Your latest requests."}</div>
          <div style={{ color: "#6b7280" }}>
            Total <strong>{total}</strong>
          </div>
        </div>

        {/* List */}
        <div style={{ padding: 12 }}>
          {isLoading ? (
            <div className="text-sm text-gray-600">Loading…</div>
          ) : isError ? (
            <div>
              <div className="mb-3 text-sm font-medium text-red-600">
                Failed to load.
              </div>
              <Button size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-sm text-gray-600">
              You haven’t submitted anything yet.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {items.map((it) => (
                <RequestCard
                  key={it.id}
                  id={it.id}
                  title={it.title || it.id}
                  type={it.type}
                  createdAt={formatDate(it.createdAt)}
                  createdBy={it.createdBy?.name || it.createdBy?.email || undefined}
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
