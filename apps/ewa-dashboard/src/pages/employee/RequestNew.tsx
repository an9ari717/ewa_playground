// src/pages/employee/RequestNew.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import Page from "../../components/layout/Page";
import Card from "../../components/ui/Card";
import Button from "../../components/Button";

type TypeKey = "LEAVE" | "PROCUREMENT" | "IT_SUPPORT";

export default function RequestNew() {
  const nav = useNavigate();

  // form state
  const [typeKey, setTypeKey] = useState<TypeKey>("LEAVE");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ui state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function readEmail(): string {
    try {
      const raw = localStorage.getItem("ewa.user");
      return raw ? JSON.parse(raw)?.email || "" : "";
    } catch {
      return "";
    }
  }

  function validate(): string | null {
    if (!title.trim()) return "Please enter a title.";
    if (typeKey === "LEAVE") {
      if (!startDate || !endDate) return "Please select both start and end dates.";
      if (new Date(endDate) < new Date(startDate))
        return "End date cannot be before start date.";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const err = validate();
    if (err) {
      setErrorMsg(err);
      return;
    }

    const requesterEmail = readEmail();
    if (!requesterEmail) {
      setErrorMsg("No requester email found. Are you logged in?");
      return;
    }

    const payload: Record<string, any> = { reason: details || "" };
    if (typeKey === "LEAVE") {
      payload.from = startDate || null;
      payload.to = endDate || null;
    }

    setSubmitting(true);
    try {
      await api.post(
        "/requests",
        { requesterEmail, typeKey, title, payload },
        { headers: { "x-user-email": requesterEmail } }
      );
      nav("/app/employee/requests", { replace: true });
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.error ||
          err?.message ||
          "Something went wrong while submitting."
      );
      setSubmitting(false);
    }
  }

  const fieldLabel: React.CSSProperties = {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    color: "#374151",
    fontWeight: 600,
  };
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#fff",
  };

  return (
    <Page title="New Request" maxWidth={900} leftOffset={60}>
      <Card title="Request Details" stickyHeader stickyTop={0}>
        {/* Info strip */}
        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid #e5e7eb",
            background: "#f9fafb",
            fontSize: 13,
            color: "#475569",
          }}
        >
          Fill the form and submit. Your request will follow the configured approval flow.
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 16 }}>
          {errorMsg ? (
            <div
              style={{
                background: "#fee2e2",
                color: "#991b1b",
                border: "1px solid #fecaca",
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {errorMsg}
            </div>
          ) : null}

          {/* Request Type */}
          <div style={{ marginBottom: 14 }}>
            <label style={fieldLabel}>Request Type</label>
            <select
              value={typeKey}
              onChange={(e) => setTypeKey(e.target.value as TypeKey)}
              style={inputStyle}
              disabled={submitting}
            >
              <option value="LEAVE">Leave</option>
              <option value="PROCUREMENT">Procurement</option>
              <option value="IT_SUPPORT">IT Support</option>
            </select>
          </div>

          {/* Title */}
          <div style={{ marginBottom: 14 }}>
            <label style={fieldLabel}>Title</label>
            <input
              style={inputStyle}
              placeholder="Short title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
            />
          </div>

          {/* Details */}
          <div style={{ marginBottom: 14 }}>
            <label style={fieldLabel}>Details</label>
            <textarea
              style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
              placeholder="Describe your request…"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              disabled={submitting}
            />
          </div>

   {/* Date range (LEAVE only) */}
{typeKey === "LEAVE" && (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "36px",
      marginTop: "20px",
      marginBottom: "28px",
      paddingLeft: "12px",   // shift slightly left
      paddingRight: "16px",  // keep balanced edge on right
      transform: "translateX(-4px)", // subtle visual centering
    }}
  >
    {/* Start Date */}
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        marginLeft: "0px",
      }}
    >
      <label style={{ ...fieldLabel, marginBottom: "8px" }}>Start Date</label>
      <input
        type="date"
        style={{
          ...inputStyle,
          padding: "12px 14px",
          borderRadius: "10px",
        }}
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        disabled={submitting}
      />
    </div>

    {/* End Date */}
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        marginRight: "8px", // slight inset from card edge
      }}
    >
      <label style={{ ...fieldLabel, marginBottom: "8px" }}>End Date</label>
      <input
        type="date"
        style={{
          ...inputStyle,
          padding: "12px 14px",
          borderRadius: "10px",
        }}
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        disabled={submitting}
      />
    </div>
  </div>
)}

          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => nav(-1)} disabled={submitting}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </Page>
  );
}
