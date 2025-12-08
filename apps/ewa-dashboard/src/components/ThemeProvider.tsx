// src/components/ThemeProvider.tsx
import React, { useEffect } from "react";
import { useTheme } from "../store/theme";

type ThemeProviderProps = {
  children: React.ReactNode;
};

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme } = useTheme();

  useEffect(() => {
    // Keep <html data-theme="..."> & color-scheme in sync
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return <>{children}</>;
}
