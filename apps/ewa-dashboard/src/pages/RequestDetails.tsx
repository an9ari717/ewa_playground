// src/pages/RequestDetails.tsx
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StatusBadge from "../components/requests/StatusBadge";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";

type HistoryItem = {
  step: string;
  by: string;
  role?: string;
  date: string; // ISO
  comment?: string;
};

export default function RequestDetails() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  // 🔹 Mock request (replace with API later)
  const req = useMemo(
    () => ({
      id: id ?? "REQ-UNKNOWN",
      type: "LEAVE" as const,
      title: "Annual leave — 3 days",
      details:
        "I’d like to request annual leave for 3 days to attend a family event.",
      submittedBy: "isa@ewa.gov.bh",
      submittedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      status: "PENDING" as "PENDING" | "APPROVED" | "REJECTED",
      meta: {
        startDate: "2025-10-23",
        endDate: "2025-10-25",
      },
      history: [
        {
          step: "Created",
          by: "isa@ewa.gov.bh",
          date: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        },
        {
          step: "Pending Manager",
          by: "system",
          date: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
        },
      ] as HistoryItem[],
    }),
    [id]
  );

  const [comment, setComment] = useState("");

  const label: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 4,
  };
  const value: React.CSSProperties = { fontWeight: 600, marginBottom: 10 };

  const handleAction = (action: "approve" | "reject") => {
    alert(`${action.toUpperCase()} (stub) for ${req.id} — comment: ${comment || "-"}`);
    nav(-1);
  };

  return (
    <div style={{ maxWidth: 980 }}>
      <PageHeader title="Request Details" subtitle={req.title} />

      {/* Meta info */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <span style={label}>Request ID</span>
          <div style={value}>{req.id}</div>
        </div>
        <div>
          <span style={label}>Type</span>
          <div style={value}>{req.type}</div>
        </div>
        <div>
          <span style={label}>Status</span>
          <StatusBadge status={req.status} />
        </div>
        <div>
          <span style={label}>Submitted At</span>
          <div style={value}>{new Date(req.submittedAt).toLocaleString()}</div>
        </div>
        <div>
          <span style={label}>Submitted By</span>
          <div style={value}>{req.submittedBy}</div>
        </div>
        {req.type === "LEAVE" && (
          <>
            <div>
              <span style={label}>Start Date</span>
              <div style={value}>{req.meta.startDate}</div>
            </div>
            <div>
              <span style={label}>End Date</span>
              <div style={value}>{req.meta.endDate}</div>
            </div>
          </>
        )}
      </div>

      {/* Details */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          padding: 14,
          marginBottom: 20,
          background: "#fff",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Details</div>
        <div style={{ color: "#374151" }}>{req.details}</div>
      </div>

      {/* History */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          padding: 14,
          marginBottom: 20,
          background: "#fff",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8 }}>History</div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {req.history.map((h, i) => (
            <li key={i} style={{ marginBottom: 6 }}>
              <span style={{ fontWeight: 600 }}>{h.step}</span>{" "}
              — {h.by} — {new Date(h.date).toLocaleString()}
              {h.comment ? <> — <i>{h.comment}</i></> : null}
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          padding: 14,
          background: "#fff",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Manager Action (stub)</div>

        <textarea
          placeholder="Optional comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          style={{
            width: "100%",
            minHeight: 90,
            resize: "vertical",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            marginBottom: 12,
          }}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="primary" onClick={() => handleAction("approve")}>
            Approve
          </Button>
          <Button onClick={() => handleAction("reject")}>Reject</Button>
          <Button variant="ghost" onClick={() => nav(-1)}>
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
