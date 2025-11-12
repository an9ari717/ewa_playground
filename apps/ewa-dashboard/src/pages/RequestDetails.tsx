// src/pages/RequestDetails.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../store/auth";
import Button from "../components/Button";
import StatusBadge from "../components/requests/StatusBadge";
import Page from "../components/layout/Page";
import Card from "../components/ui/Card";
import { KeyValueTable, Row } from "../components/ui/KeyValueTable";
import { useRequest, useRequestHistory, useApproveReject } from "../hooks/useRequests";
import Loader from "../components/Loader";

/* helpers */
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
const shortId = (s?: string) => {
  if (!s) return "";
  return s.length > 14 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;
};

export default function RequestDetails() {
  const { id = "" } = useParams();
  const nav = useNavigate();

  const { data: req, isLoading, isError, refetch } = useRequest(id);
  const { data: history } = useRequestHistory(id);
  const approveReject = useApproveReject(id);
  const me = useAuth((s) => s.me);
  const [comment, setComment] = useState("");

  // which action is in-flight (for per-button spinner)
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  // Copy-to-clipboard UI state
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);
  useEffect(() => () => { if (copyTimer.current) window.clearTimeout(copyTimer.current); }, []);

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

  if (!req)
    return <div style={{ padding: 16, color: "#475569" }}>Not found.</div>;

  const type = typeLabel(req);
  const rawStatus = (req as any)?.status as string | undefined;
  const normalizedStatus =
    (rawStatus || "").toUpperCase() === "COMPLETED" ? "APPROVED" : rawStatus;
  const stage = String((req as any)?.currentStage ?? (req as any)?.stage ?? "—");
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

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <Page title={`Request ${shortId(id)}`} onBack={() => nav(-1)} maxWidth={1200} leftOffset={60}>
      {/* Header strip */}
      <div className="rd-head">
        <div className="rd-head__left">
          {type && <span className="rd-type">{type}</span>}
          <StatusBadge status={normalizedStatus as any} />
        </div>

        <div className="rd-head__right">
          <div className="rd-idchip" title={id}>
            <span className="rd-idtext">{shortId(id)}</span>
            <button
              type="button"
              className="rd-idbtn"
              onClick={handleCopyId}
              aria-label="Copy Request ID"
              title={copied ? "Copied!" : "Copy ID"}
            >
              {/* copy icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="1.6"/>
              </svg>
            </button>
            {copied && <span className="rd-copied">Copied</span>}
          </div>
        </div>
      </div>

      <Card title="Summary" stickyHeader stickyTop={0} style={{ marginBottom: 18 }}>
        <KeyValueTable>
          <tbody>
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

      <Card title="History" stickyHeader stickyTop={0}>
        <div style={{ padding: "10px 12px" }}>
          {history?.length ? (
            <KeyValueTable>
              <tbody>
                {(history ?? []).map((h: any, i: number) => (
                  <tr key={i} className="kv-row">
                    <th
                      style={{
                        width: 220,
                        textAlign: "left",
                        padding: "10px 12px",
                        background: "#f3f4f6",
                        color: "#1f2937",
                        fontSize: 14,
                        fontWeight: 600,
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      {h.event ?? h.action ?? "Event"}
                    </th>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontSize: 14,
                        color: "#334155",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <div>
                        {h.by ?? h.actor ?? "—"} •{" "}
                        {dtFmt(h.date ?? h.at ?? h.createdAt)}
                      </div>
                      {h.note ? (
                        <div
                          style={{
                            marginTop: 4,
                            color: "#111827",
                            fontSize: 15,
                          }}
                        >
                          {h.note}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </KeyValueTable>
          ) : (
            <div style={{ color: "#64748b", fontSize: 14 }}>No history yet.</div>
          )}
        </div>

        {isApprover && (
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
                  loading={approveReject.isPending && action === "approve"}
                  disabled={approveReject.isPending}
                  onClick={() => {
                    setAction("approve");
                    approveReject.mutate(
                      { approved: true, comment: comment || undefined },
                      { onSuccess: backToInbox, onSettled: () => setAction(null) }
                    );
                  }}
                >
                  {approveReject.isPending && action === "approve" ? "Approving…" : "Approve"}
                </Button>

                <Button
                  variant="danger"
                  loading={approveReject.isPending && action === "reject"}
                  disabled={approveReject.isPending}
                  onClick={() => {
                    setAction("reject");
                    approveReject.mutate(
                      { approved: false, comment: comment || undefined },
                      { onSuccess: backToInbox, onSettled: () => setAction(null) }
                    );
                  }}
                >
                  {approveReject.isPending && action === "reject" ? "Rejecting…" : "Reject"}
                </Button>

                <Button
                  variant="ghost"
                  disabled={approveReject.isPending}
                  onClick={() => nav(-1)}
                >
                  Back
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Styles */}
      <style>{`
        .rd-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px 0 12px;
          margin-bottom: 6px;
        }
        .rd-head__left { display: flex; align-items: center; gap: 10px; }
        .rd-type {
          font-size: 12px; color: #6b7280; border: 1px solid #e5e7eb;
          border-radius: 6px; padding: 2px 8px; background: #fff; white-space: nowrap;
        }

        /* ID chip */
        .rd-head__right { display: flex; align-items: center; }
        .rd-idchip {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid #e2e8f0;
          background: #f1f5f9;
          color: #0f172a;
          font-size: 12px;
          letter-spacing: .02em;
        }
        .rd-idtext {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }
        .rd-idbtn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 24px; height: 24px; border-radius: 999px;
          border: 1px solid #e2e8f0; background: #fff; color: #334155;
          cursor: pointer;
          transition: transform .08s ease, box-shadow .12s ease, background .12s ease;
        }
        .rd-idbtn:hover { background: #f8fafc; }
        .rd-idbtn:active { transform: translateY(0.5px); }
        .rd-copied {
          position: absolute;
          right: 6px; top: -18px;
          font-size: 10px; color: #16a34a;
        }

        .rd-decision { padding: 12px; background: #f8fafc; }
        .rd-decision__title {
          font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 8px;
        }
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
