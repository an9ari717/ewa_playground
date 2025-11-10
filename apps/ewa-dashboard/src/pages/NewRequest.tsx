// src/pages/NewRequest.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
import { useCreateRequest } from "../hooks/useRequests";
import { getUserEmail } from "../lib/session";

export default function NewRequest() {
  const nav = useNavigate();
  const { mutate, isPending, isError, error } = useCreateRequest();

  const [title, setTitle] = useState("");
  const [type, setType] = useState("LEAVE");
  const [details, setDetails] = useState("");

  // NEW: date fields
  const [startDate, setStartDate] = useState(""); // "YYYY-MM-DD"
  const [endDate, setEndDate] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();

    // optional guard: keep A <= B if both provided
    if (startDate && endDate && startDate > endDate) {
      alert("Start date must be on or before End date.");
      return;
    }

    // we keep the mutate signature the same, but pass `from` & `to`
    mutate(
      {
        title: title.trim() || "(untitled)",
        type,
        details: details.trim() || undefined,
        // NEW:
        from: startDate || undefined,
        to: endDate || undefined,
      } as any,
      {
        onSuccess: () => {
          nav("/app/employee/requests");
          alert("Request submitted successfully!");
        },
        onError: (err: any) => {
          console.error(
            "[NewRequest] submit failed:",
            err?.response?.status,
            err?.response?.data || err?.message
          );
        },
      }
    );
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <PageHeader
        title="New Request"
        subtitle={`Submit a new service request${getUserEmail() ? ` as ${getUserEmail()}` : ""}.`}
      />

      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        {/* Title */}
        <label style={{ display: "grid", gap: 6 }}>
          <span>Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Annual leave — 2 days"
            style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
          />
        </label>

        {/* Type */}
        <label style={{ display: "grid", gap: 6 }}>
          <span>Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
          >
            <option value="LEAVE">Leave</option>
            <option value="PROCUREMENT">Procurement</option>
            <option value="IT_SUPPORT">IT Support</option>
          </select>
        </label>

        {/* Dates (optional; used especially for LEAVE) */}
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "1fr 1fr",
            alignItems: "end",
          }}
        >
          <label style={{ display: "grid", gap: 6 }}>
            <span>Start Date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>End Date</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
            />
          </label>
        </div>

        {/* Details */}
        <label style={{ display: "grid", gap: 6 }}>
          <span>Details (optional)</span>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Add extra notes…"
            style={{
              padding: 8,
              borderRadius: 8,
              border: "1px solid #ddd",
              minHeight: 100,
            }}
          />
        </label>

        {/* Error */}
        {isError && (
          <div style={{ color: "crimson" }}>
            Failed to submit. Check console (F12) for details.
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {(error as any)?.response?.data?.message ||
                (error as any)?.message ||
                "Unknown error"}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? "Submitting…" : "Submit"}
          </Button>
          <Button variant="ghost" onClick={() => nav(-1)} disabled={isPending}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
