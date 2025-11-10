import React from "react";
import SectionHeader from "./SectionHeader";

type Props = {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  stickyTop?: number;
  /** Container width & offset so it hugs the sidebar nicely */
  maxWidth?: number | string; // default 1200
  leftOffset?: number | string; // default 60
  children: React.ReactNode;
};

export default function Page({
  title,
  onBack,
  right,
  stickyTop,
  maxWidth = 1200,
  leftOffset = 60,
  children,
}: Props) {
  const page: React.CSSProperties = {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "24px 0 48px",
  };
  const container: React.CSSProperties = {
    width: "100%",
    maxWidth,
    marginLeft: typeof leftOffset === "number" ? `${leftOffset}px` : leftOffset,
    padding: "0 24px",
  };

  return (
    <div style={page}>
      <div style={container}>
        {title ? (
          <SectionHeader title={title} onBack={onBack} right={right} stickyTop={stickyTop} />
        ) : null}
        {children}
      </div>
    </div>
  );
}
