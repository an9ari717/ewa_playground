// src/components/Table.tsx
type Col<T> = {
  key: keyof T | string;
  header: string;
  width?: number | string;
  render?: (row: T) => React.ReactNode;
};

type Props<T> = {
  columns: Col<T>[];
  data: T[];
  emptyText?: string;
};

export default function Table<T extends Record<string, any>>({
  columns,
  data,
  emptyText = "No items",
}: Props<T>) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", background: "var(--card)" }}>
      {/* header */}
      <div style={{ display: "grid", gridTemplateColumns: columns.map(c => c.width ?? "1fr").join(" "), padding: "10px 12px", borderBottom: "1px solid var(--border)", fontWeight: 600 }}>
        {columns.map((c) => (
          <div key={String(c.key)}>{c.header}</div>
        ))}
      </div>

      {/* body */}
      {data.length === 0 ? (
        <div style={{ padding: 16, color: "var(--muted)" }}>{emptyText}</div>
      ) : (
        data.map((row, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: columns.map(c => c.width ?? "1fr").join(" "),
              padding: "10px 12px",
              borderBottom: i === data.length - 1 ? "none" : "1px solid var(--border)",
            }}
          >
            {columns.map((c) => (
              <div key={String(c.key)}>
                {c.render ? c.render(row) : String(row[c.key as keyof typeof row] ?? "")}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
