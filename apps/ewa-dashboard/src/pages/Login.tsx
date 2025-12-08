// src/pages/Login.tsx
import React from "react";
import { login } from "../services/auth";

export default function Login() {
  // seeded defaults for quick testing
  const [email, setEmail] = React.useState("manager_ali@demo.local");
  const [password, setPassword] = React.useState("manager123");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { token, user } = await login(email, password);

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
      } catch {}

      // 🔁 FIXED REDIRECTS:
      // - MANAGER → /app/inbox
      // - DIRECTOR → /app/inbox
      // - others → /app/dashboard (same as before)
      const target =
        user.role === "MANAGER"
          ? "/app/inbox"
          : user.role === "DIRECTOR"
          ? "/app/inbox"
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
    <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-2">
      {/* LEFT: Brand panel */}
      <aside className="relative hidden md:flex items-center justify-center bg-gradient-to-br from-[#0e3e79] to-[#1673ff] overflow-hidden">
        <svg
          aria-hidden
          className="absolute bottom-0 left-0 right-0 h-1/2 w-full opacity-25"
          viewBox="0 0 800 400"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="ewaWave" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
            </linearGradient>
          </defs>
          <path
            d="M0,260 C160,230 260,300 400,280 C540,260 640,200 800,220 L800,400 L0,400 Z"
            fill="url(#ewaWave)"
          />
          <path
            d="M0,200 C140,190 240,240 400,220 C560,200 640,150 800,170 L800,400 L0,400 Z"
            fill="url(#ewaWave)"
          />
        </svg>

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.12),rgba(0,0,0,0)_60%)]" />
        <div className="relative z-10 max-w-xl w-full px-10">
          <div className="mx-auto w-fit relative">
            <div className="absolute inset-0 -z-10 blur-3xl rounded-full bg-white/20 animate-pulse" />
            <img
              src="/ewa-logo.png"
              alt="Electricity & Water Authority (EWA) Bahrain"
              className="w-64 drop-shadow-xl select-none"
              draggable={false}
            />
          </div>
          <h1 className="mt-10 text-4xl font-semibold tracking-wide text-white text-center">
            EWA Approvals System
          </h1>
          <p className="mt-3 text-white/90 text-center max-w-md mx-auto">
            Secure internal workflow portal for employees, managers, directors &
            admin.
          </p>
        </div>
      </aside>

      {/* RIGHT: Login form */}
      <main className="flex items-center justify-center bg-[#0b1220] md:bg-white dark:bg-slate-950">
        <div className="w-full max-w-md p-6 sm:p-8">
          <div className="mb-8 text-center md:hidden">
            <img
              src="/ewa-logo.png"
              alt="EWA Logo"
              className="mx-auto w-40 mb-4 drop-shadow"
            />
            <h1 className="text-2xl font-semibold text-white md:text-slate-900">
              EWA Approvals System
            </h1>
            <p className="text-sm text-white/70 md:text-slate-500">
              Please sign in to continue
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 md:border-slate-200 dark:border-slate-800 shadow-2xl md:shadow-sm p-6 sm:p-8 bg-white/10 md:bg-white/95 dark:bg-slate-900/60 backdrop-blur">
            <h2 className="text-[22px] font-semibold text-white md:text-slate-600">
              Welcome back
            </h2>
            <p className="mt-1 text-sm text-white/85 md:text-slate-600">
              Sign in with your EWA account
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-white md:text-slate-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/25 md:border-slate-300 bg-white/5 md:bg-white px-3 py-2 text-white md:text-slate-900 placeholder-white/40 md:placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="you@example.com"
                  required
                  autoFocus
                  autoComplete="email"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-white md:text-slate-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/25 md:border-slate-300 bg-white/5 md:bg-white px-3 py-2 text-white md:text-slate-900 placeholder-white/40 md:placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="rounded-md border border-red-300/60 bg-red-500/10 text-red-100 md:text-red-800 text-sm px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <label className="inline-flex items-center gap-2 text-sm text-white/85 md:text-slate-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/30 md:border-slate-300 bg-white/10 md:bg-white"
                  />
                  Remember me
                </label>

                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Forgot password — to be implemented");
                  }}
                  className="text-sm font-medium text-blue-300 hover:text-blue-200 md:text-blue-600 md:hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                >
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-3 inline-flex w-full items-center justify-center rounded-lg !bg-blue-600 hover:!bg-blue-700 active:!bg-blue-800 !border-transparent px-4 py-2.5 !text-white font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Signing in…" : "Login"}
              </button>

              <div className="text-xs text-white/80 md:text-slate-500 pt-4">
                <p className="font-medium">Test accounts you seeded:</p>
                <ul className="list-disc ml-5 mt-1 space-y-0.5">
                  <li>manager_ali@demo.local / manager123</li>
                  <li>director_sara@demo.local / director123</li>
                  <li>admin@demo.local / admin123</li>
                  <li>employee@demo.local / employee123</li>
                </ul>
              </div>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-white/70 md:text-slate-500">
            © {new Date().getFullYear()} Electricity & Water Authority Internal
            Use Only
          </p>
        </div>
      </main>
    </div>
  );
}
