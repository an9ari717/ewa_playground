const KEY = "ewa_email";

// Safe localStorage access (prevents crashes in non-browser contexts)
const storage =
  typeof window !== "undefined" && window?.localStorage
    ? window.localStorage
    : {
        getItem: (_: string) => null,
        setItem: (_: string, __: string) => {},
        removeItem: (_: string) => {},
      };

export const auth = {
  getEmail(): string | null {
    const v = storage.getItem(KEY);
    return v && v.trim() ? v : null;
  },
  setEmail(email: string) {
    storage.setItem(KEY, email);
  },
  clear() {
    storage.removeItem(KEY);
  },
};
