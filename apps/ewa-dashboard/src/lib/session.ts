// src/lib/session.ts
// Tries a few common places to find the signed-in user's email.
export function getUserEmail(): string | null {
  try {
    // 1) Our preferred key (set by your auth flow if available)
    const ewaUser = localStorage.getItem("ewa.user");
    if (ewaUser) {
      const u = JSON.parse(ewaUser);
      if (u?.email && typeof u.email === "string") return u.email;
    }

    // 2) Generic "user" key some apps use
    const generic = localStorage.getItem("user");
    if (generic) {
      const u = JSON.parse(generic);
      if (u?.email && typeof u.email === "string") return u.email;
    }

    // 3) SessionStorage fallback
    const sess = sessionStorage.getItem("ewa.user") || sessionStorage.getItem("user");
    if (sess) {
      const u = JSON.parse(sess);
      if (u?.email && typeof u.email === "string") return u.email;
    }

    // 4) Cookie fallback: email=<value>
    const m = document.cookie.match(/(?:^|;\s*)email=([^;]+)/i);
    if (m?.[1]) return decodeURIComponent(m[1]);

    return null;
  } catch {
    return null;
  }
}
