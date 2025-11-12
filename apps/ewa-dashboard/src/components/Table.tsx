// src/components/Table.tsx
import React from "react";

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
  const colsTemplate = columns.map((c) => c.width ?? "1fr").join(" ");

  return (
    <section className="tbl-card" role="table" aria-label="Data table">
      {/* Header */}
      <div
        className="tbl-header"
        role="row"
        style={{ gridTemplateColumns: colsTemplate }}
      >
        {columns.map((c) => (
          <div key={String(c.key)} className="tbl-th" role="columnheader">
            {c.header}
          </div>
        ))}
      </div>

      {/* Body */}
      {data.length === 0 ? (
        <div className="tbl-empty" role="row">
          <div className="tbl-empty-inner">
            <div className="tbl-empty-dot" aria-hidden />
            <div className="tbl-empty-text">{emptyText}</div>
          </div>
        </div>
      ) : (
        <div className="tbl-body">
          {data.map((row, i) => (
            <div
              key={i}
              className={`tbl-row ${i % 2 === 1 ? "alt" : ""}`}
              role="row"
              style={{ gridTemplateColumns: colsTemplate }}
            >
              {columns.map((c) => (
                <div key={String(c.key)} className="tbl-td" role="cell" title={String((row as any)[c.key] ?? "")}>
                  {c.render ? c.render(row) : String((row as any)[c.key] ?? "")}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Styles */}
      <style>{`
        :root {
          --tbl-border: #e5e7eb;
          --tbl-bg: #ffffff;
          --tbl-muted: #6b7280;
          --tbl-text: #0f172a;
          --tbl-header-bg: #f8fafc;
          --tbl-hover: #f3f4f6;
        }

        .tbl-card {
          border: 1px solid var(--tbl-border);
          background: var(--tbl-bg);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(15,23,42,0.03);
        }

        .tbl-header {
          display: grid;
          gap: 0;
          padding: 10px 12px;
          border-bottom: 1px solid var(--tbl-border);
          background: var(--tbl-header-bg);
        }

        .tbl-th {
          font-weight: 800;
          font-size: 12px;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: var(--tbl-muted);
          user-select: none;
          white-space: nowrap;
        }

        .tbl-body {
          display: block;
        }

        .tbl-row {
          display: grid;
          padding: 12px;
          border-bottom: 1px solid var(--tbl-border);
          align-items: center;
          transition: background .12s ease;
        }
        .tbl-row:last-child { border-bottom: none; }
        .tbl-row.alt { background: #fcfcfd; }
        .tbl-row:hover { background: var(--tbl-hover); }

        .tbl-td {
          color: var(--tbl-text);
          font-size: 14px;
          line-height: 1.45;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Empty state */
        .tbl-empty {
          padding: 28px 16px;
          color: var(--tbl-muted);
        }
        .tbl-empty-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .tbl-empty-dot {
          width: 8px; height: 8px; border-radius: 999px; background: var(--tbl-border);
        }
        .tbl-empty-text {
          font-size: 14px;
        }

        /* Responsive tightening */
        @media (max-width: 640px) {
          .tbl-row { padding: 10px; }
          .tbl-header { padding: 8px 10px; }
          .tbl-td { font-size: 13px; }
        }
      `}</style>
    </section>
  );
}
