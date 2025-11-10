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
    borderBottom: "1px solid #e5e7eb",
    padding: "8px 0 12px",
    marginBottom: 16,
    background: stickyTop !== undefined ? "#f8fafc" : "transparent",
  };
  const h1: React.CSSProperties = {
    fontSize: 26, fontWeight: 700, letterSpacing: "-0.01em", color: "#0f172a",
  };

  return (
    <div style={row}>
      <h1 style={h1}>{title}</h1>
      <div style={{ display: "flex", gap: 8 }}>
        {right}
        {onBack ? <Button variant="ghost" onClick={onBack}>Back</Button> : null}
      </div>
    </div>
  );
}
