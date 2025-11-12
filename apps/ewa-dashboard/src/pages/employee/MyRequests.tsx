// src/pages/employee/MyRequests.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Page from "../../components/layout/Page";
import Card from "../../components/ui/Card";
import Button from "../../components/Button";
import { useRequests } from "../../hooks/useRequests";
import RequestCard from "../../components/requests/RequestCard";
import Loader from "../../components/Loader";

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
  const location = useLocation();

  // success banner when returning from New Request
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("submitted") === "1") {
      setOk(true);
      // Clean the URL (remove the query) so banner doesn't persist on refresh
      const clean = location.pathname;
      nav(clean, { replace: true });
      // Auto-hide banner after a short delay
      const t = setTimeout(() => setOk(false), 2200);
      return () => clearTimeout(t);
    }
  }, [location.search, location.pathname, nav]);

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
    const list = (data?.items ?? []) as any[];
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
      <Card title="Everything you have submitted" stickyHeader stickyTop={0}>
        {/* Success banner (from create) */}
        {ok && <div className="mr-banner mr-banner--ok">Request submitted successfully.</div>}

        {/* Info bar */}
        <div className="mr-infobar">
          <div className="mr-infobar__left">
            {isFetching ? "Refreshing…" : "Your latest requests."}
          </div>
          <div className="mr-infobar__right" aria-live="polite">
            <span className="mr-chip">
              <span className="mr-chip__dot" />
              Total {total}
            </span>
          </div>
        </div>

        {/* List */}
        <div className="mr-body">
          {isLoading ? (
            <Loader fullHeight />
          ) : isError ? (
            <div className="mr-empty mr-empty--error">
              <div className="mr-empty__title">Failed to load.</div>
              <Button size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="mr-empty">
              <div className="mr-empty__dot" />
              <div className="mr-empty__text">You haven’t submitted anything yet.</div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => nav("/app/employee/request")}
                style={{ marginTop: 6 }}
              >
                Create a new request
              </Button>
            </div>
          ) : (
            <div className="mr-list">
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
          <div className="mr-pager">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Prev
            </Button>
            <span className="mr-pager__meta">
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
        .mr-banner {
          margin: 8px 12px 0 12px;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          border: 1px solid;
        }
        .mr-banner--ok {
          color: #166534; background: #ecfdf5; border-color: #bbf7d0;
        }

        .mr-infobar {
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
          background: #f8fafc;
          font-size: 13px;
          color: #475569;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .mr-chip {
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
        .mr-chip__dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #0ea5e9; /* cyan/sky accent */
        }

        .mr-body { padding: 12px; }
        .mr-list { display: grid; gap: 12px; }

        /* Empty states */
        .mr-empty {
          display: grid;
          place-items: center;
          gap: 8px;
          padding: 32px 12px;
          color: #6b7280;
          font-size: 14px;
        }
        .mr-empty__dot {
          width: 8px; height: 8px; border-radius: 999px; background: #e5e7eb;
        }
        .mr-empty__text { opacity: .9; }
        .mr-empty--error .mr-empty__title {
          margin-bottom: 12px;
          color: #dc2626;
          font-weight: 600;
        }

        /* Pager */
        .mr-pager {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-top: 1px solid #e5e7eb;
          background: #f8fafc;
        }
        .mr-pager__meta {
          font-size: 12px;
          color: #6b7280;
        }
      `}</style>
    </Page>
  );
}
