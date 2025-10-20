// src/pages/RequestDetails.tsx
import { useParams, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import { useRequest, useRequestHistory, useApproveReject } from "../hooks/useRequests";
import { useState } from "react";

function Labeled({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8 }}>
      <div style={{ color: "#555" }}>{label}</div>
      <div>{value ?? "—"}</div>
    </div>
  );
}

export default function RequestDetails() {
  const { id = "" } = useParams();
  const nav = useNavigate();

  const { data: req, isLoading, isError, refetch } = useRequest(id);
  const { data: history } = useRequestHistory(id);
  const approveReject = useApproveReject(id);

  const [comment, setComment] = useState("");

  if (isLoading) {
    return (
      <div style={{ maxWidth: 980 }}>
        <PageHeader title="Request" subtitle="Loading…" />
        <div>Loading…</div>
      </div>
    );
  }

  if (isError || !req) {
    return (
      <div style={{ maxWidth: 980 }}>
        <PageHeader title="Request" subtitle="Couldn’t load this request." />
        <div style={{ color: "crimson", marginBottom: 12 }}>Failed to load.</div>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  const canAct = !!req.currentStage; // simple gate; refine later with actual role

  return (
    <div style={{ maxWidth: 980, display: "grid", gap: 16 }}>
      <PageHeader title={`Request ${req.id}`} subtitle={req.title} />

      <section style={{ display: "grid", gap: 8, padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
        <Labeled label="Type" value={req.type} />
        <Labeled label="Status" value={req.status} />
        <Labeled label="Stage" value={req.currentStage ?? "—"} />
        <Labeled label="Created" value={new Date(req.createdAt).toLocaleString()} />
        <Labeled label="By" value={(req.createdBy as any)?.name ?? "—"} />
      </section>

      <section style={{ padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>History</div>
        {!history || history.length === 0 ? (
          <div>—</div>
        ) : (
          <ul style={{ display: "grid", gap: 6, paddingLeft: 16 }}>
            {history.map((h, i) => (
              <li key={i}>
                <span style={{ fontWeight: 500 }}>{h.step}</span>{" "}
                {h.role ? `• ${h.role}` : ""} {h.by ? `• ${h.by}` : ""} •{" "}
                {new Date(h.date).toLocaleString()}
                {h.comment ? ` — ${h.comment}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Approve / Reject */}
      <section style={{ padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 600 }}>Decision</div>
          {!canAct && <span style={{ fontSize: 12, color: "#777" }}>No action available at this stage.</span>}
        </div>

        <textarea
          placeholder="Optional comment…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          style={{
            width: "100%",
            height: 80,
            padding: 8,
            borderRadius: 8,
            border: "1px solid #ddd",
            marginBottom: 10,
            resize: "vertical",
          }}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <Button
            variant="primary"
            disabled={!canAct || approveReject.isPending}
            onClick={() =>
              approveReject.mutate(
                { approved: true, comment: comment || undefined },
                {
                  onSuccess: () => nav("/app/inbox"),
                }
              )
            }
          >
            {approveReject.isPending ? "Saving…" : "Approve"}
          </Button>
          <Button
            disabled={!canAct || approveReject.isPending}
            onClick={() =>
              approveReject.mutate(
                { approved: false, comment: comment || undefined },
                {
                  onSuccess: () => nav("/app/inbox"),
                }
              )
            }
          >
            {approveReject.isPending ? "Saving…" : "Reject"}
          </Button>
          <Button variant="ghost" onClick={() => nav(-1)}>
            Back
          </Button>
        </div>
      </section>
    </div>
  );
}
