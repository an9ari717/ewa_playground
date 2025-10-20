// src/pages/NewRequest.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
import { useCreateRequest } from "../hooks/useRequests";

export default function NewRequest() {
  const nav = useNavigate();
  const { mutate, isPending, isError, error } = useCreateRequest();

  const [title, setTitle] = useState("");
  const [type, setType] = useState("LEAVE");
  const [details, setDetails] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      title: title.trim() || "(untitled)",
      type,
      details: details ? { note: details } : undefined,
    };

    console.log("[NewRequest] submitting →", payload);
    mutate(payload, {
      onSuccess: (created: any) => {
        console.log("[NewRequest] created →", created);

        // ✅ Redirect to My Requests after submit to avoid forbidden history
        nav("/app/employee/requests");

        // Optionally show a small alert for user feedback
        alert("Request submitted successfully!");
      },
      onError: (err: any) => {
        console.error(
          "[NewRequest] submit failed:",
          err?.response?.status,
          err?.response?.data || err?.message
        );
      },
    });
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <PageHeader title="New Request" subtitle="Submit a new service request." />

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

        {/* Error Message */}
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

        {/* Buttons */}
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
