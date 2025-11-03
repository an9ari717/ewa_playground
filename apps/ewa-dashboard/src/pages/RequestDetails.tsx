// src/pages/RequestDetails.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import {
  useRequest,
  useRequestHistory,
  useApproveReject,
} from "../hooks/useRequests";
import { useAuth } from "../store/auth";
import StatusBadge from "../components/requests/StatusBadge";

// Small helper to render a row "Label: Value"
function Labeled({ label, value }: { label: string; value: any }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "140px 1fr",
        gap: 8,
        fontSize: 14,
        lineHeight: 1.4,
      }}
    >
      <div style={{ color: "#555" }}>{label}</div>
      <div>{value ?? "—"}</div>
    </div>
  );
}

function nextPathForRole(role: string) {
  switch (role) {
    case "MANAGER":
      return "/app/manager/inbox";
    case "DIRECTOR":
      return "/app/director/inbox";
    case "ADMIN":
      return "/app/admin/archive";
    default:
      return "/app/employee/requests";
  }
}

// Safe date -> local string
function fmt(ts?: string) {
  if (!ts) return "—";
  try {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString();
  } catch {
    return "—";
  }
}

export default function RequestDetails() {
  const { id = "" } = useParams();
  const nav = useNavigate();

  // fetch main request + timeline from backend
  const {
    data: req,
    isLoading,
    isError,
    error: reqError,
    refetch,
  } = useRequest(id);

  const {
    data: history,
    isError: historyIsError,
    error: historyError,
  } = useRequestHistory(id);

  const approveReject = useApproveReject(id);

  // current logged-in user & role
  const { me } = useAuth();
  const role = me?.role ?? "EMPLOYEE";

  // who is allowed to act
  const isDecisionRole =
    role === "MANAGER" || role === "DIRECTOR" || role === "ADMIN";

  // Support either `currentStage` or `stage` from backend
  const stage = (req as any)?.currentStage ?? (req as any)?.stage ?? null;

  // canAct only if backend says there's an active stage AND user role can act
  const canAct = !!stage && isDecisionRole;

  // extract status codes from both requests so we can detect forbidden
  const reqStatus = (reqError as any)?.response?.status;
  const histStatus = (historyError as any)?.response?.status;
  const forbidden = reqStatus === 403 || histStatus === 403;

  // Compute timeline with a hook placed BEFORE any early return (rule of hooks)
  const timeline = useMemo(() => {
    if (!history || !Array.isArray(history)) return [];
    return history.map((h: any) => ({
      when: h.date ? fmt(h.date) : "",
      step: h.step,
      who: h.by || h.role || "",
      comment: h.comment || "",
    }));
  }, [history]);

  //
  // 1. still loading
  //
  if (isLoading) {
    return (
      <div style={{ maxWidth: 980 }}>
        <PageHeader title="Request" subtitle="Loading…" />
        <div>Loading…</div>
      </div>
    );
  }

  //
  // 2. forbidden (403)
  //
  if (forbidden) {
    return (
      <div style={{ maxWidth: 980, display: "grid", gap: 16 }}>
        <PageHeader
          title="Request"
          subtitle="You do not have permission to view this request."
        />
        <div
          style={{
            color: "#b91c1c",
            background: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: "12px 16px",
            fontSize: 14,
            lineHeight: 1.4,
          }}
        >
          You don’t have access to this item. It may belong to another employee,
          or it may require a higher approval role.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="ghost" onClick={() => nav(-1)}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  //
  // 3. generic failure / not found
  //
  if ((isError || !req) && !forbidden) {
    const statusText =
      (reqError as any)?.response?.status ||
      (historyError as any)?.response?.status ||
      "Error";

    const messageText =
      (reqError as any)?.response?.data?.error ||
      (historyError as any)?.response?.data?.error ||
      (reqError as any)?.message ||
      "Request could not be loaded.";

    return (
      <div style={{ maxWidth: 980 }}>
        <PageHeader title="Request" subtitle="Couldn’t load this request." />
        <div
          style={{
            background: "#fff1f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 16,
            fontSize: 14,
            color: "#b91c1c",
            lineHeight: 1.4,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Failed to load.</div>
          <div style={{ whiteSpace: "pre-line" }}>
            <div>
              <strong>Status:</strong> {statusText}
            </div>
            <div>
              <strong>Message:</strong> {messageText}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button size="sm" onClick={() => refetch()}>
            Retry
          </Button>
          <Button size="sm" variant="ghost" onClick={() => nav(-1)}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  //
  // 4. happy path → render the real request
  //
  const createdByName =
    ((req?.createdBy as any)?.name ||
      (req?.createdBy as any)?.email ||
      "—") ?? "—";

  // optional payload display (if backend includes it)
  const payload: any = (req as any)?.payload || {};
  const prettyDates =
    payload?.from || payload?.to
      ? `${payload?.from ?? "—"} → ${payload?.to ?? "—"}`
      : "—";

  return (
    <div style={{ maxWidth: 980, display: "grid", gap: 16 }}>
      <PageHeader title={`Request ${req?.id ?? ""}`} subtitle={req?.title ?? ""} />

      {/* Summary card */}
      <section
        style={{
          display: "grid",
          gap: 8,
          padding: 12,
          border: "1px solid #eee",
          borderRadius: 8,
          background: "#fff",
        }}
      >
        <Labeled label="Type" value={(req as any)?.type ?? (req as any)?.typeId ?? "—"} />
        <Labeled
          label="Status"
          value={<StatusBadge status={((req?.status as any) ?? "PENDING") as any} size="sm" />}
        />
        <Labeled label="Stage" value={stage ?? "—"} />
        <Labeled label="Created" value={fmt(req?.createdAt)} />
        <Labeled label="By" value={createdByName} />
        {/* Optional payload fields */}
        <Labeled label="Dates" value={prettyDates} />
        <Labeled label="Reason/Details" value={payload?.reason ?? req?.title ?? "—"} />
      </section>

      {/* History card */}
      <section
        style={{
          padding: 12,
          border: "1px solid #eee",
          borderRadius: 8,
          background: "#fff",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8 }}>History</div>
        {historyIsError && !history ? (
          <div style={{ fontSize: 14, color: "#777" }}>History is not available.</div>
        ) : timeline.length === 0 ? (
          <div>—</div>
        ) : (
          <ul style={{ display: "grid", gap: 6, paddingLeft: 16 }}>
            {timeline.map((item, i) => (
              <li key={i} style={{ fontSize: 14, lineHeight: 1.4 }}>
                <span style={{ fontWeight: 500 }}>{item.step}</span>{" "}
                {item.who ? `• ${item.who}` : ""} • {item.when}
                {item.comment ? ` — ${item.comment}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Decision / Action card */}
      <section
        style={{
          padding: 12,
          border: "1px solid #eee",
          borderRadius: 8,
          background: "#fff",
        }}
      >
        <DecisionBlock
          canAct={canAct}
          isDecisionRole={isDecisionRole}
          approveReject={approveReject}
          nav={nav}
          role={role}
        />
      </section>
    </div>
  );
}

// pull the decision UI out for clarity
function DecisionBlock({
  canAct,
  isDecisionRole,
  approveReject,
  nav,
  role,
}: {
  canAct: boolean;
  isDecisionRole: boolean;
  approveReject: ReturnType<typeof useApproveReject>;
  nav: ReturnType<typeof useNavigate>;
  role: string;
}) {
  const [comment, setComment] = useState("");

  const afterSuccess = () => {
    nav(nextPathForRole(role), { replace: true });
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div style={{ fontWeight: 600 }}>Decision</div>
        {!canAct && (
          <span style={{ fontSize: 12, color: "#777" }}>
            {isDecisionRole
              ? "You can’t act on this request at its current stage."
              : "Your role cannot take action on this request."}
          </span>
        )}
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
        disabled={approveReject.isPending}
      />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button
          variant="primary"
          disabled={!canAct || approveReject.isPending}
          onClick={() =>
            approveReject.mutate(
              { approved: true, comment: comment || undefined },
              { onSuccess: afterSuccess }
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
              { onSuccess: afterSuccess }
            )
          }
        >
          {approveReject.isPending ? "Saving…" : "Reject"}
        </Button>

        <Button variant="ghost" onClick={() => nav(-1)}>
          Back
        </Button>
      </div>
    </>
  );
}
