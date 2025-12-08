import React from "react";
import Button from "../Button";

type Props = {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  stickyTop?: number; // e.g., 56 if you have a top app bar
};

export default function SectionHeader({ title, onBack, right, stickyTop }: Props) {
  const row: React.CSSProperties = {
    position: stickyTop !== undefined ? "sticky" : undefined,
    top: stickyTop,
    zIndex: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid var(--border)",      // ✅ theme-aware border
    padding: "8px 0 12px",
    marginBottom: 16,
    background:
      stickyTop !== undefined ? "var(--bg)" : "transparent", // ✅ no hard-coded light bg
  };

  const h1: React.CSSProperties = {
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: "-0.01em",
    color: "var(--text)",                              // ✅ title follows theme
  };

  return (
    <div style={row}>
      <h1 style={h1}>{title}</h1>
      <div style={{ display: "flex", gap: 8 }}>
        {right}
        {onBack ? (
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
        ) : null}
      </div>
    </div>
  );
}
