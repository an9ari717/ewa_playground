// src/components/admin/RoleBadge.tsx
//import React from "react";

export interface RoleBadgeProps {
  role: string;
}

export default function RoleBadge({ role }: RoleBadgeProps) {
  const r = role.toUpperCase();
  const label =
    r === "EMPLOYEE"
      ? "Employee"
      : r === "MANAGER"
      ? "Manager"
      : r === "DIRECTOR"
      ? "Director"
      : r === "ADMIN"
      ? "Admin"
      : role;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 10px",
        borderRadius: 999,
        border: "1px solid var(--border)",
        fontSize: 12,
        textTransform: "capitalize",
      }}
    >
      {label}
    </span>
  );
}
