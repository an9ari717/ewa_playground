// src/pages/Login.tsx
import React from "react";
import { login } from "../services/auth";

//type Role = "EMPLOYEE" | "MANAGER" | "DIRECTOR" | "ADMIN";

export default function Login() {
  const [email, setEmail] = React.useState("manager_ali@demo.local");
  const [password, setPassword] = React.useState("manager123");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1) real backend login
      const { token, user } = await login(email, password);

      // 2) persist for our app
      try {
        localStorage.setItem("ewa.token", token);
        localStorage.setItem(
          "ewa.user",
          JSON.stringify({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name ?? null,
            isActive: user.isActive ?? true,
          })
        );
      } catch {
        // ignore storage errors
      }

      // 3) hard-redirect so the store hydrates fresh & RequireAuth stays happy
      const target =
        user.role === "MANAGER"
          ? "/app/manager/inbox"
          : user.role === "DIRECTOR"
          ? "/app/director/inbox"
          : "/app/dashboard";
      window.location.replace(target);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Login failed. Check your email/password.";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto" }}>
      <h1 style={{ marginBottom: 12 }}>EWA Dashboard — Login</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 6 }}
            placeholder="you@example.com"
            required
            autoFocus
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 6 }}
            placeholder="••••••••"
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

        <button
          type="submit"
          disabled={loading}
          style={{ padding: "10px 12px", width: "100%" }}
        >
          {loading ? "Signing in…" : "Login"}
        </button>

        <div style={{ fontSize: 12, color: "#555" }}>
          Test accounts you seeded:
          <ul style={{ margin: "6px 0 0 18px" }}>
            <li>manager_ali@demo.local / manager123</li>
            <li>director_sara@demo.local / director123</li>
            <li>admin@demo.local / admin123</li>
            <li>employee@demo.local / employee123</li>
          </ul>
        </div>
      </form>
    </div>
  );
}
