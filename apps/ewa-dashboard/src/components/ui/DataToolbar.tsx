// src/components/ui/DataToolbar.tsx
import React from "react";

type DataToolbarProps = {
  /** Current search text */
  searchValue: string;
  /** Called when search input changes */
  onSearchChange: (value: string) => void;
  /** Placeholder for the search box */
  searchPlaceholder?: string;
  /** Extra controls on the right side (filters, buttons, etc.) */
  children?: React.ReactNode;
};

export default function DataToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  children,
}: DataToolbarProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        marginBottom: 16,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      {/* Search input – always first and flexible */}
      <input
        type="text"
        value={searchValue}
        placeholder={searchPlaceholder}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{
          flex: 1,
          minWidth: 220,
          padding: "8px 12px",
          borderRadius: 999,
          border: "1px solid var(--border, #e5e7eb)",
          fontSize: 14,
          background: "var(--input-bg, #ffffff)",
          color: "var(--text, #0f172a)",
        }}
      />

      {/* Right-side filters / buttons */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {children}
      </div>
    </div>
  );
}
