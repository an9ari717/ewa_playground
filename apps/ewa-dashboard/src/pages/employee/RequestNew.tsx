// src/pages/employee/RequestNew.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RequestNew() {
  const nav = useNavigate();

  // Skeleton state only (no API yet)
  const [type, setType] = useState("LEAVE");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now just log and navigate to "My Requests"
    console.log("NEW REQUEST (stub)", {
      type,
      title,
      details,
      startDate,
      endDate,
    });
    nav("/app/employee/requests");
  };

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

      <form onSubmit={handleSubmit}>
        {/* Request Type */}
        <div style={fieldWrap}>
          <label style={label}>Request Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={input}
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
          />
        </div>

        {/* Details */}
        <div style={fieldWrap}>
          <label style={label}>Details</label>
          <textarea
            style={{ ...input, minHeight: 120, resize: "vertical" }}
            placeholder="Describe your request..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
        </div>

        {/* Date range (optional, shown for LEAVE type) */}
        {type === "LEAVE" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={fieldWrap}>
              <label style={label}>Start Date</label>
              <input
                type="date"
                style={input}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div style={fieldWrap}>
              <label style={label}>End Date</label>
              <input
                type="date"
                style={input}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <button
            type="submit"
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #111827",
              background: "#111827",
              color: "white",
              cursor: "pointer",
            }}
          >
            Submit (stub)
          </button>

          <button
            type="button"
            onClick={() => nav(-1)}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
