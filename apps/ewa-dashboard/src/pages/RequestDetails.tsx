// src/pages/RequestDetails.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../store/auth";
import Button from "../components/Button";
import StatusBadge from "../components/requests/StatusBadge";
import Page from "../components/layout/Page";
import Card from "../components/ui/Card";
import { KeyValueTable, Row } from "../components/ui/KeyValueTable";
import { useRequest, useRequestHistory, useApproveReject } from "../hooks/useRequests";
import Loader from "../components/Loader";

/* -------------------- date helpers -------------------- */
const dOk = (i?: string | null) => (i ? new Date(i) : null);
const dFmt = (i?: string | null) => {
  const d = dOk(i);
  return d && !isNaN(d.getTime())
    ? d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" })
    : "—";
};
const dtFmt = (i?: string | null) => {
  const d = dOk(i);
  return d && !isNaN(d.getTime())
    ? d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
};
const typeLabel = (r: any) =>
  typeof r?.type === "string"
    ? r.type
    : r?.type?.name ?? r?.type?.title ?? r?.type?.key ?? r?.type?.id ?? "—";
const payload = (r: any) => (r?.payload ?? r?.details ?? {}) as Record<string, any>;
const shortId = (s?: string) => (s ? (s.length > 14 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s) : "");

/* -------------------- history helpers -------------------- */
function roleNice(role?: string) {
  const R = String(role || "").toUpperCase();
  if (R === "EMPLOYEE") return "Employee";
  if (R === "MANAGER") return "Manager";
  if (R === "DIRECTOR") return "Director";
  if (R === "ADMIN") return "Admin";
  return role || "User";
}
function eventType(h: any): "submitted" | "approved" | "rejected" | "updated" {
  const a = String(h?.action ?? h?.event ?? "").toUpperCase();
  const apr = h?.approved;
  if (a.includes("CREATE") || a === "SUBMITTED") return "submitted";
  if (a.includes("APPROVE") || apr === true) return "approved";
  if (a.includes("REJECT") || apr === false) return "rejected";
  return "updated";
}
function eventLabel(h: any) {
  const t = eventType(h);
  const step = h?.step ? String(h.step) : undefined;
  if (t === "submitted") return "Submitted";
  if (t === "approved") return step ? `${step} • Approved` : "Approved";
  if (t === "rejected") return step ? `${step} • Rejected` : "Rejected";
  return step || (h?.action ?? h?.event ?? "Update");
}
function badgeColor(t: ReturnType<typeof eventType>) {
  if (t === "approved") return { bg: "#ecfdf5", border: "#bbf7d0", text: "#166534" }; // green
  if (t === "rejected") return { bg: "#fef2f2", border: "#fecaca", text: "#991b1b" }; // red
  if (t === "submitted") return { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" }; // blue
  return { bg: "#f8fafc", border: "#e5e7eb", text: "#334155" }; // neutral
}

/* -------------------- main component -------------------- */
export default function RequestDetails() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const { data: req, isLoading, isError, refetch } = useRequest(id);
  const { data: history } = useRequestHistory(id);
  const approveReject = useApproveReject(id);
  const me = useAuth((s) => s.me);
  const [comment, setComment] = useState("");

  const backToInbox = () => {
    const role = (me as any)?.role;
    if (role === "MANAGER") return nav("/app/manager/inbox", { replace: true });
    if (role === "DIRECTOR") return nav("/app/director/inbox", { replace: true });
    return nav("/app/dashboard", { replace: true });
  };

  if (isLoading)
    return (
      <div style={{ padding: 16 }}>
        <Loader />
      </div>
    );

  if (isError)
    return (
      <div style={{ padding: 16 }}>
        <span style={{ color: "#dc2626", fontWeight: 600 }}>Failed to load.</span>{" "}
        <Button size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );

  if (!req) return <div style={{ padding: 16, color: "#475569" }}>Not found.</div>;

  const type = typeLabel(req);
  const rawStatus = (req as any)?.status as string | undefined;
  const normalizedStatus =
    (rawStatus || "").toUpperCase() === "COMPLETED" ? "APPROVED" : rawStatus;

  // 🔹 Stage label logic (this is the new bit)
  const rawStage = (req as any)?.currentStage ?? (req as any)?.stage ?? null;
  const isTerminal = ["APPROVED", "REJECTED", "ARCHIVED", "COMPLETED"].includes(
    String(normalizedStatus || "").toUpperCase()
  );

  let stage: string;
  if (isTerminal) {
    stage = "Completed";
  } else if (rawStage) {
    const S = String(rawStage).toUpperCase();
    if (S === "MANAGER") stage = "Manager Review";
    else if (S === "DIRECTOR") stage = "Director Review";
    else if (S === "ADMIN") stage = "Admin Review";
    else stage = String(rawStage);
  } else {
    stage = "—";
  }

  const createdAt = (req as any)?.createdAt as string | undefined;
  const submittedAt = createdAt;
  const by =
    (req as any)?.createdBy?.name ||
    (req as any)?.createdBy?.email ||
    (req as any)?.requester?.name ||
    (req as any)?.requester?.email ||
    "—";

  const p = payload(req);
  const from = p.from ?? p.start ?? p.startDate ?? (req as any)?.startDate;
  const to = p.to ?? p.end ?? p.endDate ?? (req as any)?.endDate;
  const reason = p.reason ?? (req as any)?.title ?? p.details ?? "—";

  const isApprover = ((me as any)?.role ?? "") !== "EMPLOYEE";
  const isActionable = isApprover && !isTerminal;

  // Public, human-friendly code (fallback to short id)
  const publicCode = (req as any)?.publicCode ?? (req as any)?.code ?? undefined;
  const displayCode = publicCode || shortId(id);

  return (
    <Page title={`Request ${displayCode}`} onBack={() => nav(-1)} maxWidth={1200} leftOffset={60}>
      {/* Header (type + status on the left; copy chip removed) */}
      <div className="rd-head">
        <div className="rd-head__left">
          {type && <span className="rd-type">{type}</span>}
          <StatusBadge status={normalizedStatus as any} />
        </div>
      </div>

      {/* Summary */}
      <Card title="Summary" stickyHeader stickyTop={0} style={{ marginBottom: 18 }}>
        <KeyValueTable>
          <tbody>
            <Row label="Code">{displayCode}</Row>
            <Row label="Stage">{stage}</Row>
            <Row label="Status">
              <StatusBadge status={normalizedStatus as any} />
            </Row>
            <Row label="Created">{dFmt(createdAt)}</Row>
            <Row label="Submitted At">{dtFmt(submittedAt)}</Row>
            <Row label="Submitted By">{by}</Row>
            <Row label="Dates">
              {dFmt(from)} {from || to ? "→" : ""} {dFmt(to)}
            </Row>
            <Row label="Reason / Details">{reason}</Row>
          </tbody>
        </KeyValueTable>
      </Card>

      {/* History */}
      <Card title="History" stickyHeader stickyTop={0}>
        <div className="tl">
          {(history?.length ?? 0) > 0 ? (
            (history ?? []).map((h: any, i: number) => {
              const t = eventType(h);
              const colors = badgeColor(t);
              return (
                <div key={i} className="tl-item">
                  <div className="tl-dot" />
                  <div className="tl-body">
                    <div className="tl-row">
                      <span
                        className="tl-badge"
                        style={{
                          color: colors.text,
                          background: colors.bg,
                          borderColor: colors.border,
                        }}
                      >
                        {eventLabel(h)}
                      </span>
                      <span className="tl-when">{dtFmt(h.date ?? h.at ?? h.createdAt)}</span>
                    </div>
                    <div className="tl-sub">
                      {(h?.by ?? h?.actor ?? h?.user?.name ?? h?.user?.email ?? "—") +
                        " • " +
                        roleNice(h?.role)}
                    </div>
                    {h.note ? <div className="tl-note">{h.note}</div> : null}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ color: "#64748b", fontSize: 14 }}>No history yet.</div>
          )}
        </div>

        {/* Decision (only for actionable requests) */}
        {isActionable && (
          <>
            <div style={{ height: 1, background: "#e5e7eb" }} />
            <div className="rd-decision">
              <div className="rd-decision__title">Decision</div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Optional comment…"
                className="rd-textarea"
              />
              <div className="rd-actions">
                <Button
                  variant="primary"
                  onClick={() =>
                    approveReject.mutate(
                      { approved: true, comment: comment || undefined },
                      { onSuccess: backToInbox }
                    )
                  }
                  disabled={approveReject.isPending}
                >
                  {approveReject.isPending ? "Approving…" : "Approve"}
                </Button>

                <Button
                  variant="danger"
                  onClick={() =>
                    approveReject.mutate(
                      { approved: false, comment: comment || undefined },
                      { onSuccess: backToInbox }
                    )
                  }
                  disabled={approveReject.isPending}
                >
                  {approveReject.isPending ? "Submitting…" : "Reject"}
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Styles */}
      <style>{`
        .rd-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 12px 0 12px; margin-bottom: 6px;
        }
        .rd-head__left { display: flex; align-items: center; gap: 10px; }
        .rd-type {
          font-size: 12px; color: #6b7280; border: 1px solid #e5e7eb;
          border-radius: 6px; padding: 2px 8px; background: #fff; white-space: nowrap;
        }

        /* Timeline */
        .tl { padding: 8px 12px; }
        .tl-item { position: relative; display: grid; grid-template-columns: 14px 1fr; gap: 10px; padding: 10px 0; }
        .tl-item + .tl-item { border-top: 1px solid #e5e7eb; }
        .tl-dot {
          width: 8px; height: 8px; border-radius: 999px; background: #94a3b8; margin: 6px 3px 0 3px;
        }
        .tl-body { min-width: 0; }
        .tl-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .tl-badge {
          display: inline-block; padding: 2px 8px; border-radius: 999px; border: 1px solid;
          font-size: 12px; font-weight: 800; letter-spacing: .02em; white-space: nowrap;
        }
        .tl-when { color: #64748b; font-size: 12px; }
        .tl-sub { color: #334155; font-size: 14px; margin-top: 2px; }
        .tl-note { margin-top: 4px; color: #0f172a; font-size: 15px; }

        /* Decision */
        .rd-decision { padding: 12px; background: #f8fafc; }
        .rd-decision__title { font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 8px; }
        .rd-textarea {
          width: 100%; min-height: 110px; border: 1px solid #e5e7eb; background: #fff;
          border-radius: 12px; padding: 10px; font-size: 14px; margin-bottom: 10px;
          outline: none; transition: border-color .15s ease, box-shadow .15s ease;
        }
        .rd-textarea:focus { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,.25); }
        .rd-actions { display: flex; gap: 8px; align-items: center; }
      `}</style>
    </Page>
  );
}
