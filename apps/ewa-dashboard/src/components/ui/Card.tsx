import React from "react";

type CardProps = {
  title?: string;
  stickyHeader?: boolean;
  stickyTop?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

export default function Card({ title, stickyHeader, stickyTop, children, style }: CardProps) {
  const base: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    overflow: "hidden",
    ...style,
  };
  const header: React.CSSProperties = {
    position: stickyHeader ? "sticky" : undefined,
    top: stickyTop,
    zIndex: 5,
    background: "linear-gradient(90deg,#eff6ff,#f8fafc)",
    padding: "10px 16px",
    borderBottom: "1px solid #e5e7eb",
  };
  const titleCss: React.CSSProperties = {
    fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#1e3a8a",
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
