// src/auth/session.ts
export const auth = {
  getEmail(): string | null {
    return localStorage.getItem("ewa_email");
  },
  setEmail(email: string) {
    localStorage.setItem("ewa_email", email);
  },
  clear() {
    localStorage.removeItem("ewa_email");
  },
};
