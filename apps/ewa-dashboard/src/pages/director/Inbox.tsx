// src/pages/director/Inbox.tsx
import { useMemo, useState } from "react";
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
  status: "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED" | "COMPLETED";
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

export default function DirectorInbox() {
  const nav = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Waiting for DIRECTOR
  const { data, isLoading, isError, isFetching, refetch } = useRequests(
    "inbox",
    "DIRECTOR",
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
      status: (String(r.status ?? "PENDING").toUpperCase() as Item["status"]) ??
        "PENDING",
      createdBy: r.createdBy ?? r.requester ?? null,
    }));
  }, [data]);

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Page
      title="Director's Inbox"
      maxWidth={1100}
      leftOffset={60}
    >
      <Card stickyHeader stickyTop={0}>
        {/* Header bar */}
        <div className="di-header">
          <div className="di-header__left">
            <div className="di-header__title">Pending requests</div>
            <div className="di-header__subtitle">
              {isFetching
                ? "Refreshing…"
                : "Requests currently assigned to you as Director."}
            </div>
          </div>
          <div className="di-header__right" aria-live="polite">
            <span className="di-chip">
              <span className="di-chip__dot" />
              Total {total}
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? "Refreshing…" : "Refresh"}
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="di-body">
          {isLoading ? (
            <Loader fullHeight />
          ) : isError ? (
            <div className="di-empty di-empty--error">
              <div className="di-empty__title">Failed to load.</div>
              <Button size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="di-empty">
              <div className="di-empty__dot" />
              <div className="di-empty__text">Nothing pending for you.</div>
            </div>
          ) : (
            <div className="di-list">
              {items.map((it) => (
                <RequestCard
                  key={it.id}
                  id={it.id}
                  title={it.title || it.id}
                  type={it.type}
                  createdAt={formatDate(it.createdAt)}
                  createdBy={it.createdBy?.name || it.createdBy?.email || "—"}
                  // Treat COMPLETED as APPROVED for visuals
                  status={
                    (it.status === "COMPLETED" ? "APPROVED" : it.status) as
                      | "PENDING"
                      | "APPROVED"
                      | "REJECTED"
                      | "ARCHIVED"
                      | "COMPLETED"
                  }
                  onOpen={() => nav(`/app/requests/${it.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && !isError && items.length > 0 && (
          <div className="di-pager">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Prev
            </Button>
            <span className="di-pager__meta">
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
        .di-header {
          padding: 10px 12px;
          border-bottom: 1px solid var(--border);
          background: var(--bg-soft);
          font-size: 13px;
          color: var(--muted);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .di-header__left {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .di-header__title {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .09em;
          color: var(--text);
        }
        .di-header__subtitle {
          font-size: 12px;
          color: var(--muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .di-header__right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .di-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: var(--card);
          font-weight: 700;
          color: var(--text);
          letter-spacing: .02em;
          font-size: 11px;
        }
        .di-chip__dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
        }

        .di-body { padding: 12px; }
        .di-list { display: grid; gap: 12px; }

        /* Empty states */
        .di-empty {
          display: grid;
          place-items: center;
          gap: 8px;
          padding: 32px 12px;
          color: var(--muted);
          font-size: 14px;
        }
        .di-empty__dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: var(--border);
        }
        .di-empty__text { opacity: .9; }
        .di-empty--error .di-empty__title {
          margin-bottom: 12px;
          color: #dc2626;
          font-weight: 600;
        }

        /* Pager */
        .di-pager {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-top: 1px solid var(--border);
          background: var(--bg-soft);
        }
        .di-pager__meta {
          font-size: 12px;
          color: var(--muted);
        }

        @media (max-width: 800px) {
          .di-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .di-header__subtitle {
            white-space: normal;
          }
          .di-header__right {
            flex-wrap: wrap;
            justify-content: flex-start;
          }
        }
      `}</style>
    </Page>
  );
}
