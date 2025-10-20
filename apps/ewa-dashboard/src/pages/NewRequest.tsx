// src/pages/NewRequest.tsx
import { useState } from "react";
import PageHeader from "../components/PageHeader";

export default function NewRequest() {
  const [type, setType] = useState("Leave");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 720 }}>
     <PageHeader title="New Request" subtitle="Submit a new request for approval" />

      <label style={{ display: "grid", gap: 6 }}>
        <span>Type</span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px" }}
        >
          <option>Leave</option>
          <option>IT</option>
          <option>Procurement</option>
          <option>Finance</option>
        </select>
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Annual Leave — 3 days"
          style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px" }}
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Details</span>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={6}
          placeholder="Provide any notes or attachments summary…"
          style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", resize: "vertical" }}
        />
      </label>

      <div style={{ display: "flex", gap: 8 }}>
        <button>Submit (disabled for now)</button>
        <button type="button">Save Draft (later)</button>
      </div>
    </div>
  );
}
