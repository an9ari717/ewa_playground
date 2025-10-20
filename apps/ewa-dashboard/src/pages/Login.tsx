import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth } from "../auth/session";

export default function Login() {
  const nav = useNavigate();
  const location = useLocation() as any;
  const [email, setEmail] = useState("");

  // If already signed in, go straight to app
  useEffect(() => {
    const existing = auth.getEmail();
    if (existing) {
      nav("/app/dashboard", { replace: true });
    }
  }, [nav]);

  const handleContinue = () => {
    const e = email.trim();
    if (!e) return;
    auth.setEmail(e);

    // If we were sent here by RequireAuth, go back there; otherwise inbox
    const to = location?.state?.from?.pathname ?? "/app/inbox";
    nav(to, { replace: true });
  };

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
          onKeyDown={(e) => e.key === "Enter" && handleContinue()}
          style={{ width: "100%", padding: 10, marginBottom: 12 }}
        />
        <button
          onClick={handleContinue}
          style={{ width: "100%", padding: 10, cursor: "pointer" }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
