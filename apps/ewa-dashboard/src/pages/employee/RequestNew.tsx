// src/pages/employee/RequestNew.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";

export default function RequestNew() {
  const nav = useNavigate();

  // form state
  const [typeKey, setTypeKey] = useState("LEAVE"); // <-- matches backend: requestType.key
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ui state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg("Please enter a title.");
      return;
    }

    // read current user email from localStorage
    // we already saw you store it under ewa.user like { "email": "..." }
    let requesterEmail = "";
    try {
      const raw = localStorage.getItem("ewa.user");
      if (raw) {
        const obj = JSON.parse(raw);
        requesterEmail = obj?.email || "";
      }
    } catch {
      requesterEmail = "";
    }

    if (!requesterEmail) {
      setErrorMsg("No requester email found. Are you logged in?");
      return;
    }

    // build payload (goes into request.payload in DB)
    const payload: Record<string, any> = {
      reason: details || "",
    };

    if (typeKey === "LEAVE") {
      payload.from = startDate || null;
      payload.to = endDate || null;
    }

    setSubmitting(true);
    try {
      const res = await api.post(
        "/requests",
        {
          requesterEmail,
          typeKey, // <-- backend needs this, not "type"
          title,
          payload,
        },
        {
          headers: {
            // helps backend actor / RLS logic
            "x-user-email": requesterEmail,
          },
        }
      );

      console.log("Created request:", res.data);

      // after success: go to My Requests (employee view)
      nav("/app/employee/requests", { replace: true });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err?.response?.data?.error ||
          err?.message ||
          "Something went wrong while submitting."
      );
      setSubmitting(false);
    }
  }

  const fieldWrap: React.CSSProperties = { marginBottom: 14 };
  const label: React.CSSProperties = {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    color: "#374151",
  };
  const input: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
        New Request
      </h2>

      {errorMsg && (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: "8px 10px",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Request Type */}
        <div style={fieldWrap}>
          <label style={label}>Request Type</label>
          <select
            value={typeKey}
            onChange={(e) => setTypeKey(e.target.value)}
            style={input}
            disabled={submitting}
          >
            <option value="LEAVE">Leave</option>
            <option value="PROCUREMENT">Procurement</option>
            <option value="IT_SUPPORT">IT Support</option>
          </select>
        </div>

        {/* Title */}
        <div style={fieldWrap}>
          <label style={label}>Title</label>
          <input
            style={input}
            placeholder="Short title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={submitting}
          />
        </div>

        {/* Details / Reason */}
        <div style={fieldWrap}>
          <label style={label}>Details</label>
          <textarea
            style={{ ...input, minHeight: 120, resize: "vertical" }}
            placeholder="Describe your request..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            disabled={submitting}
          />
        </div>

        {/* Date range (for LEAVE only) */}
        {typeKey === "LEAVE" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <div style={fieldWrap}>
              <label style={label}>Start Date</label>
              <input
                type="date"
                style={input}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div style={fieldWrap}>
              <label style={label}>End Date</label>
              <input
                type="date"
                style={input}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>
        )}

        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #111827",
              background: submitting ? "#6b7280" : "#111827",
              color: "white",
              cursor: submitting ? "default" : "pointer",
              opacity: submitting ? 0.7 : 1,
              minWidth: 110,
              textAlign: "center",
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>

          <button
            type="button"
            onClick={() => nav(-1)}
            disabled={submitting}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
