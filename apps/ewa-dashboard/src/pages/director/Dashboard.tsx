// src/pages/director/Dashboard.tsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Page from "../../components/layout/Page";
import Card from "../../components/ui/Card";
import Button from "../../components/Button";
import RequestCard from "../../components/requests/RequestCard";
import { useRequests } from "../../hooks/useRequests";

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

export default function DirectorDashboard() {
  const nav = useNavigate();

  // A) Inbox (pending for DIRECTOR)
  const {
    data: inboxData,
    isLoading: inboxLoading,
    isError: inboxError,
    refetch: refetchInbox,
    isFetching: fetchingInbox,
  } = useRequests("inbox", "DIRECTOR", 1, 5);

  // B) Recently handled (archive view)
  const {
    data: recentData,
    isLoading: recentLoading,
    isError: recentError,
    refetch: refetchRecent,
    isFetching: fetchingRecent,
  } = useRequests("archive", "DIRECTOR", 1, 5);

  const inboxItems: Item[] = useMemo(
    () =>
      (inboxData?.items ?? []).map((r: any) => ({
        id: r.id,
        type: resolveTypeLabel(r),
        title: r.title ?? r.reason ?? "",
        createdAt: r.createdAt ?? "",
        status: String(r.status ?? "PENDING").toUpperCase() as Item["status"],
        createdBy: r.createdBy ?? r.requester ?? null,
      })),
    [inboxData]
  );

  const recentItems: Item[] = useMemo(
    () =>
      (recentData?.items ?? []).map((r: any) => ({
        id: r.id,
        type: resolveTypeLabel(r),
        title: r.title ?? r.reason ?? "",
        createdAt: r.createdAt ?? "",
        status: String(r.status ?? "PENDING").toUpperCase() as Item["status"],
        createdBy: r.createdBy ?? r.requester ?? null,
      })),
    [recentData]
  );

  // KPIs
  const kpi = useMemo(() => {
    const pending = inboxData?.total ?? 0; // waiting for director
    let approved = 0;
    let rejected = 0;
    (recentItems ?? []).forEach((r) => {
      const s = r.status;
      if (s === "APPROVED" || s === "COMPLETED") approved++;
      else if (s === "REJECTED") rejected++;
    });
    return { pending, approved, rejected };
  }, [inboxData, recentItems]);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <Page title="Director Dashboard" maxWidth={1100} leftOffset={60}>
      {/* Top bar */}
      <div className="dash-topbar">
        <div className="dash-topbar__left">Welcome! • {today}</div>
        <div className="dash-topbar__right">
          <Button size="sm" variant="primary" onClick={() => nav("/app/director/inbox")}>
            Go to Inbox
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="dash-grid">
        <div className="kpi kpi--pending">
          <div className="kpi__label">Pending for your review</div>
          <div className="kpi__value">{kpi.pending}</div>
        </div>
        <div className="kpi kpi--approved">
          <div className="kpi__label">Recently approved</div>
          <div className="kpi__value">{kpi.approved}</div>
        </div>
        <div className="kpi kpi--rejected">
          <div className="kpi__label">Recently rejected</div>
          <div className="kpi__value">{kpi.rejected}</div>
        </div>
      </div>

      {/* Inbox preview */}
      <Card title="Awaiting Your Review" stickyHeader stickyTop={0}>
        <div className="dash-cardbar">
          <div className="dash-cardbar__spacer" />
          <div className="dash-cardbar__actions">
            <Button size="sm" variant="secondary" onClick={() => refetchInbox()} disabled={fetchingInbox}>
              {fetchingInbox ? "Refreshing…" : "Refresh"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => nav("/app/director/inbox")}>
              View inbox
            </Button>
          </div>
        </div>

        <div className="dash-list">
          {inboxLoading ? (
            <div className="skeletons"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div>
          ) : inboxError ? (
            <div className="empty empty--error">
              <div className="empty__title">Failed to load.</div>
              <Button size="sm" onClick={() => refetchInbox()}>Retry</Button>
            </div>
          ) : inboxItems.length === 0 ? (
            <div className="empty">
              <div className="empty__dot" />
              <div className="empty__text">Nothing is pending right now.</div>
            </div>
          ) : (
            <div className="list">
              {inboxItems.map((it) => (
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

      {/* Recently handled */}
      <Card title="Recently Handled" stickyHeader stickyTop={0} style={{ marginTop: 14 }}>
        <div className="dash-cardbar">
          <div className="dash-cardbar__spacer" />
          <div className="dash-cardbar__actions">
            <Button size="sm" variant="secondary" onClick={() => refetchRecent()} disabled={fetchingRecent}>
              {fetchingRecent ? "Refreshing…" : "Refresh"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => nav("/app/archive")}>
              View archive
            </Button>
          </div>
        </div>

        <div className="dash-list">
          {recentLoading ? (
            <div className="skeletons"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div>
          ) : recentError ? (
            <div className="empty empty--error">
              <div className="empty__title">Failed to load.</div>
              <Button size="sm" onClick={() => refetchRecent()}>Retry</Button>
            </div>
          ) : recentItems.length === 0 ? (
            <div className="empty">
              <div className="empty__dot" />
              <div className="empty__text">No recent actions yet.</div>
            </div>
          ) : (
            <div className="list">
              {recentItems.map((it) => (
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
          grid-template-columns: repeat(3, minmax(0, 1fr));
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
        .kpi__value { font-size: 26px; font-weight: 800; line-height: 1; color: #0f172a; }
        .kpi--pending .kpi__value { color: #b45309; }
        .kpi--approved .kpi__value { color: #15803d; }
        .kpi--rejected .kpi__value { color: #b91c1c; }

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
      `}</style>
    </Page>
  );
}
