// src/store/theme.ts
import { create } from "zustand";

export type Theme = "light" | "dark";

type ThemeState = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
};

function getInitialTheme(): Theme {
  try {
    // 1) From localStorage
    const stored = localStorage.getItem("ewa.theme");
    if (stored === "light" || stored === "dark") return stored;

    // 2) From current <html data-theme="">
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "light" || attr === "dark") return attr;

    // 3) From system preference
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  } catch {
    // ignore
  }
  return "light";
}

function applyTheme(theme: Theme) {
  try {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("ewa.theme", theme);
  } catch {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

export const useTheme = create<ThemeState>((set, get) => {
  // Initialise once
  const initial = getInitialTheme();
  applyTheme(initial);

  return {
    theme: initial,

    setTheme: (t: Theme) => {
      applyTheme(t);
      set({ theme: t });
    },

    toggleTheme: () => {
      const next: Theme = get().theme === "light" ? "dark" : "light";
      applyTheme(next);
      set({ theme: next });
    },
  };
});
