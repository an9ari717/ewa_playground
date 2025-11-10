import React from "react";

export function KeyValueTable({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`.kv-row:hover th, .kv-row:hover td { background: #f9fafb; }`}</style>
      <table style={{ width: "100%", borderCollapse: "separate" }}>{children}</table>
    </>
  );
}

export function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="kv-row">
      <th
        style={{
          width: 220, textAlign: "left", padding: "10px 12px",
          background: "#f3f4f6", color: "#1f2937", fontSize: 14, fontWeight: 600,
          borderBottom: "1px solid #e5e7eb", transition: "background 160ms ease",
        }}
      >
        {label}
      </th>
      <td
        style={{
          padding: "10px 12px", fontSize: 15, color: "#111827",
          borderBottom: "1px solid #e5e7eb", transition: "background 160ms ease",
        }}
      >
        {children}
      </td>
    </tr>
  );
}
