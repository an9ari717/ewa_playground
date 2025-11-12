// src/components/Loader.tsx
import React from "react";

type LoaderProps = {
  size?: number;        // px diameter of the spinner
  stroke?: number;      // px thickness of the ring
  label?: string;       // optional accessible label
  inline?: boolean;     // if true, no centering box — just the spinner
  muted?: boolean;      // use softer gray
  fullHeight?: boolean; // take available height and center
};

export default function Loader({
  size = 28,
  stroke = 3,
  label = "Loading…",
  inline = false,
  muted = true,
  fullHeight = false,
}: LoaderProps) {
  const spinner = (
    <span
      role="status"
      aria-label={label}
      title={label}
      style={{
        width: size,
        height: size,
        display: "inline-block",
        borderRadius: "50%",
        border: `${stroke}px solid ${muted ? "#e5e7eb" : "#cbd5e1"}`, // gray-200 / slate-300
        borderTopColor: "#334155", // slate-700
        animation: "ewa-spin 0.9s linear infinite",
      }}
    />
  );

  if (inline) return spinner;

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        padding: 12,
        height: fullHeight ? "100%" : undefined,
      }}
    >
      {spinner}
      {/* local keyframes so no global css needed */}
      <style>{`
        @keyframes ewa-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
