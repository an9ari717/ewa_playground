// src/components/ui/AvatarCircle.tsx
//import React from "react";

interface AvatarCircleProps {
  name: string;
}

export function AvatarCircle({ name }: AvatarCircleProps) {
  const safe = name?.trim() || "?";
  const parts = safe.split(/\s+/);
  const initials = parts
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: 999,
        background:
          "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(129,140,248,0.15))",
        border: "1px solid rgba(129,140,248,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 600,
        color: "#1d4ed8",
      }}
    >
      {initials}
    </div>
  );
}
