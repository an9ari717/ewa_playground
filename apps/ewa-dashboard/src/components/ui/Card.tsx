import React from "react";

type CardProps = {
  title?: string;
  stickyHeader?: boolean;
  stickyTop?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

export default function Card({
  title,
  stickyHeader,
  stickyTop,
  children,
  style,
}: CardProps) {
  const base: React.CSSProperties = {
    background: "var(--card)",            // ✅ theme-aware
    border: "1px solid var(--border)",    // ✅ theme-aware
    borderRadius: 16,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    overflow: "hidden",
    color: "var(--text)",                 // ✅ text follows theme
    ...style,
  };

  const header: React.CSSProperties = {
    position: stickyHeader ? "sticky" : undefined,
    top: stickyTop,
    zIndex: 5,
    background: "var(--bg-soft)",         // ✅ works in light & dark
    padding: "10px 16px",
    borderBottom: "1px solid var(--border)",
  };

  const titleCss: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--text)",                 // ✅ no more hard-coded blue
  };

  return (
    <div style={base}>
      {title ? (
        <div style={header}>
          <div style={titleCss}>{title}</div>
        </div>
      ) : null}
      {children}
    </div>
  );
}
