// src/components/Button.tsx
import React from "react";
import type { CSSProperties } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  loading?: boolean;
  /** normalize disabled across <button> and <a> use */
  disabled?: boolean;
};

type ButtonAsButton = React.ButtonHTMLAttributes<HTMLButtonElement> &
  CommonProps & { as?: "button" };

type ButtonAsLink = React.AnchorHTMLAttributes<HTMLAnchorElement> &
  CommonProps & { as: "a" };

type Props = ButtonAsButton | ButtonAsLink;

export default function Button(props: Props) {
  const {
    as = "button",
    variant = "primary",
    size = "md",
    iconLeft,
    iconRight,
    className,
    children,
    loading = false,
    disabled = false,
    ...rest
  } = props;

  const isLink = as === "a";

  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 10,
    fontWeight: 700,
    letterSpacing: ".01em",
    lineHeight: 1,
    cursor: loading || disabled ? "not-allowed" : "pointer",
    transition:
      "background .15s ease, border-color .15s ease, box-shadow .15s ease, transform .12s ease, color .15s ease",
    textDecoration: "none",
    userSelect: "none",
    borderWidth: 1,
    borderStyle: "solid",
    opacity: loading || disabled ? 0.7 : 1,
  };

  const sizes: Record<Size, CSSProperties> = {
    sm: { padding: "8px 10px", fontSize: 13 },
    md: { padding: "10px 14px", fontSize: 14 },
  };

  const variants: Record<Variant, CSSProperties> = {
    primary: { background: "#111827", color: "#fff", borderColor: "#0f172a" },
    secondary: { background: "#f3f4f6", color: "#111827", borderColor: "#e5e7eb" },
    ghost: { background: "#fff", color: "#374151", borderColor: "#e5e7eb" },
    danger: { background: "#dc2626", color: "#fff", borderColor: "#b91c1c" },
  };

  const Comp: any = isLink ? "a" : "button";

  return (
    <>
      <Comp
        className={`btn ${className || ""}`.trim()}
        style={{ ...base, ...sizes[size], ...variants[variant] }}
        // only real <button> honors disabled, but we keep it unified for styling
        disabled={!isLink && (loading || disabled)}
        aria-disabled={isLink ? (loading || disabled) : undefined}
        {...(rest as any)}
      >
        {loading && (
          <span
            className="btn-spinner"
            aria-hidden
            style={{
              width: size === "sm" ? 14 : 16,
              height: size === "sm" ? 14 : 16,
              border: "2px solid rgba(255,255,255,0.4)",
              borderTopColor:
                variant === "ghost" || variant === "secondary" ? "#111827" : "#fff",
              borderRadius: "50%",
              animation: "btn-spin 0.7s linear infinite",
            }}
          />
        )}
        {iconLeft && !loading && (
          <span aria-hidden style={{ display: "inline-flex" }}>{iconLeft}</span>
        )}
        <span>{children}</span>
        {iconRight && !loading && (
          <span aria-hidden style={{ display: "inline-flex" }}>{iconRight}</span>
        )}
      </Comp>

      <style>{`
        .btn:hover { filter: brightness(0.98); }
        .btn:active { transform: translateY(0.5px); }
        .btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,.35); }
        @keyframes btn-spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
