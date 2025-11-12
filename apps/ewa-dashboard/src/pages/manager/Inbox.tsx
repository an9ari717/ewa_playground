// src/pages/manager/Inbox.tsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Page from "../../components/layout/Page";
import Card from "../../components/ui/Card";
import Button from "../../components/Button";
import { useRequests } from "../../hooks/useRequests";
import RequestCard from "../../components/requests/RequestCard";
import Loader from "../../components/Loader";

type Item = {
  id: string;
  type: string;
  title?: string;
  createdAt: string; // ISO
  status: "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED";
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

function resolveTypeLabel(r: any): string {
  if (typeof r?.type === "string" && r.type.trim()) return r.type;
  const obj = typeof r?.type === "object" ? r.type : undefined;
  const objLabel = obj?.name ?? obj?.title ?? obj?.key ?? obj?.id;
  if (objLabel) return String(objLabel);
  const other = r?.typeKey ?? r?.typeId ?? r?.typeName ?? r?.typeTitle;
  return other ? String(other) : "—";
}

export default function ManagerInbox() {
  const nav = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Waiting for MANAGER
  const { data, isLoading, isError, isFetching, refetch } = useRequests(
    "inbox",
    "MANAGER",
    page,
    pageSize
  );

  const items: Item[] = useMemo(() => {
    const list = data?.items ?? [];
    return list.map((r: any) => ({
      id: r.id,
      type: resolveTypeLabel(r),
      title: r.title ?? r.reason ?? "",
      createdAt: r.createdAt ?? "",
      status: (r.status as Item["status"]) ?? "PENDING",
      createdBy: r.createdBy ?? r.requester ?? null,
    }));
  }, [data]);

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Page
      title="Manager's Inbox"
      right={
        <Button
          size="sm"
          variant="secondary"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? "Refreshing…" : "Refresh"}
        </Button>
      }
      maxWidth={1100}
      leftOffset={60}
    >
      <Card title="Pending Requests" stickyHeader stickyTop={0}>
        {/* Info bar */}
        <div className="mi-infobar">
          <div className="mi-infobar__left">
            {isFetching ? "Refreshing…" : "Requests waiting for your approval."}
          </div>
          <div className="mi-infobar__right" aria-live="polite">
            <span className="mi-chip">
              <span className="mi-chip__dot" />
              Total {total}
            </span>
          </div>
        </div>

        {/* List */}
        <div className="mi-body">
          {isLoading ? (
            <Loader fullHeight />
          ) : isError ? (
            <div className="mi-empty mi-empty--error">
              <div className="mi-empty__title">Failed to load.</div>
              <Button size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="mi-empty">
              <div className="mi-empty__dot" />
              <div className="mi-empty__text">Nothing pending for you.</div>
            </div>
          ) : (
            <div className="mi-list">
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
          <div className="mi-pager">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Prev
            </Button>
            <span className="mi-pager__meta">
              Page {page} / {totalPages} • Total {total}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </Card>

      {/* local styles */}
      <style>{`
        .mi-infobar {
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
          background: #f8fafc;
          font-size: 13px;
          color: #475569;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .mi-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          background: #fff;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: .02em;
        }
        .mi-chip__dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #2563eb;
        }

        .mi-body { padding: 12px; }
        .mi-list { display: grid; gap: 12px; }

        /* Empty states */
        .mi-empty {
          display: grid;
          place-items: center;
          gap: 8px;
          padding: 32px 12px;
          color: #6b7280;
          font-size: 14px;
        }
        .mi-empty__dot {
          width: 8px; height: 8px; border-radius: 999px; background: #e5e7eb;
        }
        .mi-empty__text { opacity: .9; }
        .mi-empty--error .mi-empty__title {
          margin-bottom: 12px;
          color: #dc2626;
          font-weight: 600;
        }

        /* Pager */
        .mi-pager {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-top: 1px solid #e5e7eb;
          background: #f8fafc;
        }
        .mi-pager__meta {
          font-size: 12px;
          color: #6b7280;
        }
      `}</style>
    </Page>
  );
}
