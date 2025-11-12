// src/pages/Dashboard.tsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Page from "../components/layout/Page";
import Card from "../components/ui/Card";
import Button from "../components/Button";
import RequestCard from "../components/requests/RequestCard";
import { useRequests } from "../hooks/useRequests";

type Item = {
  id: string;
  type: string;
  title?: string;
  createdAt?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED" | "COMPLETED";
  createdBy?: { name?: string; email?: string } | null;
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function labelFromKey(key?: string) {
  if (!key) return undefined;
  const K = key.toUpperCase();
  if (K === "LEAVE") return "Leave";
  if (K === "PROCUREMENT") return "Procurement";
  if (K === "IT_SUPPORT" || K === "IT-SUPPORT" || K === "ITSUPPORT") return "IT Support";
  return key;
}

function resolveTypeLabel(r: any): string {
  if (typeof r?.type === "string" && r.type.trim()) return labelFromKey(r.type) ?? r.type;
  const obj = typeof r?.type === "object" ? r.type : undefined;
  const objLabel = obj?.name ?? obj?.title ?? labelFromKey(obj?.key) ?? obj?.id;
  if (objLabel) return String(objLabel);
  const other = labelFromKey(r?.typeKey) ?? labelFromKey(r?.typeId) ?? r?.typeName ?? r?.typeTitle;
  return other ? String(other) : "—";
}

export default function Dashboard() {
  const nav = useNavigate();

  // newest 5 of the current user's requests
  const { data, isLoading, isError, refetch, isFetching } = useRequests("my", undefined, 1, 5);

  const items: Item[] = useMemo(() => {
    const list = data?.items ?? [];
    return list.map((r: any) => ({
      id: r.id,
      type: resolveTypeLabel(r),
      title: r.title ?? r.reason ?? "",
      createdAt: r.createdAt ?? "",
      status: String(r.status ?? "PENDING").toUpperCase() as Item["status"],
      createdBy: r.createdBy ?? r.requester ?? null,
    }));
  }, [data]);

  // Quick stats computed locally
  const stats = useMemo(() => {
    const all = data?.total ?? 0;
    let pending = 0, approved = 0, rejected = 0;
    (data?.items ?? []).forEach((r: any) => {
      const s = String(r.status ?? "").toUpperCase();
      if (s === "PENDING") pending++;
      else if (s === "APPROVED" || s === "COMPLETED") approved++;
      else if (s === "REJECTED") rejected++;
    });
    return { all, pending, approved, rejected };
  }, [data]);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <Page title="Dashboard" maxWidth={1100} leftOffset={60}>
      {/* Top welcome & CTA (since Page has no subtitle/right) */}
      <div className="dash-topbar">
        <div className="dash-topbar__left">Welcome! • {today}</div>
        <div className="dash-topbar__right">
          <Button size="sm" variant="primary" onClick={() => nav("/app/employee/request")}>
            + New Request
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="dash-grid">
        <div className="kpi">
          <div className="kpi__label">Total</div>
          <div className="kpi__value">{stats.all}</div>
        </div>
        <div className="kpi kpi--pending">
          <div className="kpi__label">Pending</div>
          <div className="kpi__value">{stats.pending}</div>
        </div>
        <div className="kpi kpi--approved">
          <div className="kpi__label">Approved</div>
          <div className="kpi__value">{stats.approved}</div>
        </div>
        <div className="kpi kpi--rejected">
          <div className="kpi__label">Rejected</div>
          <div className="kpi__value">{stats.rejected}</div>
        </div>
      </div>

      {/* Latest requests */}
      <Card title="Recent Requests" stickyHeader stickyTop={0}>
        {/* since Card has no 'right', we render a small header bar inside */}
        <div className="dash-cardbar">
          <div className="dash-cardbar__spacer" />
          <div className="dash-cardbar__actions">
            <Button size="sm" variant="secondary" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? "Refreshing…" : "Refresh"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => nav("/app/employee/requests")}>
              View all
            </Button>
          </div>
        </div>

        <div className="dash-list">
          {isLoading ? (
            <div className="skeletons">
              <div className="skeleton" />
              <div className="skeleton" />
              <div className="skeleton" />
            </div>
          ) : isError ? (
            <div className="empty empty--error">
              <div className="empty__title">Failed to load.</div>
              <Button size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : items.length === 0 ? (
            <div className="empty">
              <div className="empty__dot" />
              <div className="empty__text">No recent requests yet.</div>
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
            <div className="list">
              {items.map((it) => (
                <RequestCard
                  key={it.id}
                  id={it.id}
                  title={it.title || it.id}
                  type={it.type}
                  createdAt={formatDate(it.createdAt)}
                  createdBy={it.createdBy?.name || it.createdBy?.email || "—"}
                  status={it.status === "COMPLETED" ? "APPROVED" : it.status}
                  onOpen={() => nav(`/app/requests/${it.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Styles */}
      <style>{`
        .dash-topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 12px; margin-bottom: 8px;
          border: 1px solid #e5e7eb; background: #f8fafc; border-radius: 12px;
          font-size: 13px; color: #475569;
        }
        .dash-topbar__right { display: flex; gap: 8px; }

        .dash-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin: 12px 0 16px 0;
        }
        .kpi {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #fff;
          padding: 12px;
        }
        .kpi__label { font-size: 12px; color: #64748b; margin-bottom: 6px; }
        .kpi__value { font-size: 24px; font-weight: 800; line-height: 1; color: #0f172a; }

        .kpi--pending .kpi__value { color: #b45309; }   /* amber-700 */
        .kpi--approved .kpi__value { color: #15803d; }  /* green-700 */
        .kpi--rejected .kpi__value { color: #b91c1c; }  /* red-700 */

        .dash-cardbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 12px; border-bottom: 1px solid #e5e7eb; background: #f9fafb;
        }
        .dash-cardbar__actions { display: flex; gap: 8px; }
        .dash-cardbar__spacer { flex: 1; }

        .dash-list { padding: 12px; }
        .list { display: grid; gap: 12px; }

        .empty {
          display: grid; place-items: center; gap: 8px;
          padding: 32px 12px; color: #6b7280; font-size: 14px;
        }
        .empty__dot { width: 8px; height: 8px; border-radius: 999px; background: #e5e7eb; }
        .empty__text { opacity: .9; }
        .empty--error .empty__title { margin-bottom: 12px; color: #dc2626; font-weight: 600; }

        .skeletons { display: grid; gap: 12px; }
        .skeleton {
          height: 74px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: linear-gradient(90deg, #f8fafc 25%, #eef2f7 37%, #f8fafc 63%);
          background-size: 400% 100%;
          animation: d-shimmer 1.2s ease-in-out infinite;
        }
        @keyframes d-shimmer { 0% { background-position: 100% 0; } 100% { background-position: 0 0; } }

        @media (max-width: 900px) {
          .dash-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 600px) {
          .dash-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </Page>
  );
}
