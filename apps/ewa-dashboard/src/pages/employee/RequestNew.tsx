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
    if (!details.trim()) return "Please provide details.";
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
      // ⬇️ Redirect with a flag so MyRequests shows a success banner
      nav("/app/employee/requests?submitted=1", { replace: true });
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.error ||
          err?.message ||
          "Something went wrong while submitting."
      );
      setSubmitting(false);
    }
  }

  return (
    <Page title="New Request" maxWidth={900} leftOffset={60}>
      <Card title="Request Details" stickyHeader stickyTop={0}>
        {/* Info strip */}
        <div className="rn-infobar">
          Fill the form and submit. Your request will follow the configured approval flow.
        </div>

        <form onSubmit={handleSubmit} className="rn-form" noValidate>
          {errorMsg ? (
            <div className="rn-banner rn-banner--err">{errorMsg}</div>
          ) : null}

          {/* Request Type */}
          <div className="rn-field">
            <label className="rn-label">Request Type</label>
            <select
              className="rn-input rn-select"
              value={typeKey}
              onChange={(e) => setTypeKey(e.target.value as TypeKey)}
              disabled={submitting}
            >
              <option value="LEAVE">Leave</option>
              <option value="PROCUREMENT">Procurement</option>
              <option value="IT_SUPPORT">IT Support</option>
            </select>
            <div className="rn-help">Choose the category that best fits your request.</div>
          </div>

          {/* Title */}
          <div className="rn-field">
            <label className="rn-label">Title</label>
            <input
              className="rn-input"
              placeholder="Short title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
            />
            <div className="rn-help">A concise summary (e.g., “Annual leave 3 days”).</div>
          </div>

          {/* Details */}
          <div className="rn-field">
            <label className="rn-label">Details</label>
            <textarea
              className="rn-textarea"
              placeholder="Provide relevant details, dates, suppliers, justification, etc."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              disabled={submitting}
              rows={6}
            />
            <div className="rn-help">Include any context approvers need to make a decision.</div>
          </div>

          {/* Date range (LEAVE only) */}
          {typeKey === "LEAVE" && (
            <div className="rn-daterow">
              <div className="rn-field">
                <label className="rn-label">Start Date</label>
                <input
                  type="date"
                  className="rn-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="rn-field">
                <label className="rn-label">End Date</label>
                <input
                  type="date"
                  className="rn-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="rn-actions">
            <Button
              type="button"
              variant="ghost"
              onClick={() => nav(-1)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <div style={{ flex: 1 }} />
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit"}
            </Button>
          </div>
        </form>

        {/* Styles */}
        <style>{`
          .rn-infobar {
            padding: 12px 14px;
            border-bottom: 1px solid #e5e7eb;
            background: #f8fafc;
            font-size: 13px;
            color: #475569;
          }

          .rn-form {
            padding: 16px;
            display: grid;
            gap: 14px;
          }

          .rn-banner {
            padding: 10px 12px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 600;
            border: 1px solid;
            margin-bottom: 6px;
          }
          .rn-banner--err {
            color: #991b1b; background: #fef2f2; border-color: #fecaca;
          }

          .rn-field { display: grid; gap: 6px; }
          .rn-label {
            font-weight: 700; font-size: 13px; color: #0f172a; letter-spacing: .01em;
          }
          .rn-help { font-size: 12px; color: #6b7280; }

          .rn-input, .rn-textarea {
            width: 100%;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            background: #fff;
            padding: 10px 12px;
            font-size: 14px;
            color: #0f172a;
            transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
          }
          .rn-input:focus, .rn-textarea:focus {
            outline: none; border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,.25);
          }
          .rn-textarea { resize: vertical; min-height: 120px; }

          .rn-select {
            appearance: none;
            background-image:
              linear-gradient(45deg, transparent 50%, #94a3b8 50%),
              linear-gradient(135deg, #94a3b8 50%, transparent 50%);
            background-position:
              calc(100% - 18px) calc(1em + 2px),
              calc(100% - 13px) calc(1em + 2px);
            background-size: 5px 5px, 5px 5px;
            background-repeat: no-repeat;
          }

          .rn-daterow {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 40px;
            margin-top: 8px;
            margin-bottom: 14px;
            padding: 0 24px;
            transform: translateX(-8px);
            box-sizing: border-box;
          }

          .rn-actions {
            margin-top: 4px;
            display: flex; align-items: center; gap: 10px;
            padding-top: 10px; border-top: 1px solid #e5e7eb;
          }

          @media (max-width: 640px) {
            .rn-daterow {
              grid-template-columns: 1fr;
              gap: 12px;
              padding: 0;
              transform: none;
            }
          }
        `}</style>
      </Card>
    </Page>
  );
}
