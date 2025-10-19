import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth } from "../auth/session";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");

  // ✅ redirect if already signed in
  useEffect(() => {
    const existing = auth.getEmail();
    if (existing) {
      nav("/dashboard");
    }
  }, [nav]);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div
        style={{
          width: 320,
          padding: 24,
          border: "1px solid #e5e7eb",
          borderRadius: 12,
        }}
      >
        <h1 style={{ marginBottom: 12 }}>EWA — Sign in</h1>
        <input
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 12 }}
        />
        <button
          onClick={() => {
            if (email.trim()) {
              auth.setEmail(email.trim());
              nav("/inbox");
            }
          }}
          style={{ width: "100%", padding: 10, cursor: "pointer" }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
