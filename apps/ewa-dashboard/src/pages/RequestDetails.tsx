// src/pages/RequestDetails.tsx
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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
    // later: POST /requests/:id/status
    nav(-1);
  };

  return (
    <div style={{ maxWidth: 980 }}>
      <button
        onClick={() => nav(-1)}
        style={{
          padding: "6px 10px",
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          background: "#f9fafb",
          cursor: "pointer",
          marginBottom: 12,
        }}
      >
        ← Back
      </button>

      <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
        Request Details
      </h2>
      <p style={{ color: "#6b7280", marginBottom: 16 }}>
        Review and take action on this request.
      </p>

      {/* Top meta */}
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
          <div style={value}>{req.status}</div>
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
          <button
            onClick={() => handleAction("approve")}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #111827",
              background: "#111827",
              color: "white",
              cursor: "pointer",
            }}
          >
            Approve (stub)
          </button>
          <button
            onClick={() => handleAction("reject")}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
              cursor: "pointer",
            }}
          >
            Reject (stub)
          </button>
        </div>
      </div>
    </div>
  );
}
