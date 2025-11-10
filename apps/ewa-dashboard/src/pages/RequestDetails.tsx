// src/pages/RequestDetails.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../store/auth";
import Button from "../components/Button";
import StatusBadge from "../components/requests/StatusBadge";
import StatusDot from "../components/requests/StatusDot";
import Page from "../components/layout/Page";
import Card from "../components/ui/Card";
import { KeyValueTable, Row } from "../components/ui/KeyValueTable";
import { useRequest, useRequestHistory, useApproveReject } from "../hooks/useRequests";

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

export default function RequestDetails() {
  const { id = "" } = useParams();
  const nav = useNavigate();

  const { data: req, isLoading, isError, refetch } = useRequest(id);
  const { data: history } = useRequestHistory(id);
  const approveReject = useApproveReject(id);
  const me = useAuth((s) => s.me);
  const [comment, setComment] = useState("");

  // ✅ Redirect helper
  const backToInbox = () => {
    const role = (me as any)?.role;
    if (role === "MANAGER") return nav("/app/manager/inbox", { replace: true });
    if (role === "DIRECTOR") return nav("/app/director/inbox", { replace: true });
    return nav("/app/dashboard", { replace: true });
  };

  if (isLoading)
    return <div style={{ padding: 16, color: "#475569" }}>Loading…</div>;

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
  const status = (req as any)?.status as string | undefined;
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

  return (
    <Page title={`Request ${id}`} onBack={() => nav(-1)} maxWidth={1200} leftOffset={60}>
      <Card title="Summary" stickyHeader stickyTop={0} style={{ marginBottom: 18 }}>
        <KeyValueTable>
          <tbody>
            <Row label="Type">{type}</Row>
            <Row label="Status">
              <StatusDot status={status} />
              <StatusBadge status={status as any} />
            </Row>
            <Row label="Stage">{stage}</Row>
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
            <div style={{ padding: 12, background: "#f8fafc" }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: "#0f172a",
                  marginBottom: 8,
                }}
              >
                Decision
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Optional comment…"
                style={{
                  width: "100%",
                  minHeight: 110,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  borderRadius: 12,
                  padding: 10,
                  fontSize: 14,
                  marginBottom: 10,
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", gap: 8 }}>
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

                <Button
                  variant="ghost"
                  onClick={() => nav(-1)}
                  disabled={approveReject.isPending}
                >
                  Back
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </Page>
  );
}
