// src/pages/Login.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useAuth,
  deriveIdentityFromEmail,
  ALLOWED_EMAILS,
} from "../store/auth";

export default function Login() {
  const nav = useNavigate();
  const setMe = useAuth((s) => s.set);
  const hydrate = useAuth((s) => s.hydrate); // 🟢 ensure store picks it up immediately

  const [email, setEmail] = useState("manager_ali@demo.local");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const lower = email.toLowerCase().trim();

    // ✅ Restrict to known demo users only
    if (!ALLOWED_EMAILS.includes(lower)) {
      setError("Unknown email. Use one of: " + ALLOWED_EMAILS.join(", "));
      return;
    }

    const me = deriveIdentityFromEmail(lower);
    setMe(me);   // writes to localStorage
    hydrate();   // 🟢 immediately read it back into the store
    setError(null);

    // Optional: land managers directly in manager inbox for convenience
    if (me.role === "MANAGER") nav("/app/manager/inbox");
    else nav("/app/dashboard");
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto" }}>
      <h1 style={{ marginBottom: 12 }}>EWA Dashboard — Demo Login</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 6 }}
            placeholder="manager_ali@demo.local"
            required
          />
        </label>

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              border: "1px solid #fecaca",
              padding: "8px 12px",
              borderRadius: 6,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <button type="submit" style={{ padding: "10px 12px" }}>
          Login
        </button>

        <div style={{ fontSize: 12, color: "#555" }}>
          Demo users:
          <ul style={{ margin: "6px 0 0 18px" }}>
            <li>manager_ali@demo.local</li>
            <li>director_sara@demo.local</li>
            <li>admin@demo.local</li>
            <li>employee@demo.local</li>
          </ul>
        </div>
      </form>
    </div>
  );
}
