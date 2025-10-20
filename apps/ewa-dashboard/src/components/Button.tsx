// src/components/Button.tsx
import React from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export default function Button({
  variant = "secondary",
  size = "md",
  style,
  disabled,
  ...rest
}: Props) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 8,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    border: "1px solid transparent",
    whiteSpace: "nowrap",
  };

  const pad =
    size === "sm"
      ? { padding: "6px 10px", fontSize: 14 }
      : { padding: "10px 14px", fontSize: 15 };

  const variants: Record<Variant, React.CSSProperties> = {
    primary: { background: "#111827", color: "white", borderColor: "#111827" },
    secondary: { background: "#f9fafb", color: "#111827", borderColor: "#e5e7eb" },
    ghost: { background: "transparent", color: "#111827", borderColor: "#e5e7eb" },
  };

  return (
    <button
      {...rest}
      disabled={disabled}
      style={{ ...base, ...pad, ...variants[variant], ...style }}
    />
  );
}
