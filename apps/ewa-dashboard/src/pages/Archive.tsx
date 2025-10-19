// src/pages/Archive.tsx
import Table from "../components/Table";

type ArchiveRow = {
  id: string;
  title: string;
  type: string;
  finalStatus: "APPROVED" | "REJECTED";
  closedAt: string;
};

export default function Archive() {
  // 🔹 mock archived items (we’ll wire backend later)
  const data: ArchiveRow[] = [
    { id: "REQ-1009", title: "Travel claim — Dubai",   type: "Finance", finalStatus: "APPROVED", closedAt: "2025-10-06 13:21" },
    { id: "REQ-1008", title: "Sick leave — 1 day",     type: "Leave",   finalStatus: "REJECTED", closedAt: "2025-10-05 09:02" },
    { id: "REQ-1007", title: "Monitor upgrade",        type: "IT",      finalStatus: "APPROVED", closedAt: "2025-10-04 15:47" },
  ];

  const columns = [
    { key: "id", header: "ID", width: "140px" },
    { key: "title", header: "Request", width: "2fr" },
    { key: "type", header: "Type", width: "1fr" },
    {
      key: "finalStatus",
      header: "Final",
      width: "140px",
      render: (row: ArchiveRow) => {
        const isApproved = row.finalStatus === "APPROVED";
        return (
          <span
            style={{
              background: isApproved ? "#ECFDF5" : "#FEF2F2",
              color: isApproved ? "#065F46" : "#991B1B",
              padding: "4px 8px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {row.finalStatus}
          </span>
        );
      },
    },
    { key: "closedAt", header: "Closed", width: "170px" },
  ];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div>
        <h2 style={{ margin: 0, marginBottom: 4 }}>Archive</h2>
        <div style={{ color: "var(--muted)", fontSize: 14 }}>
          Completed / rejected requests (mock data for now)
        </div>
      </div>

      <Table<ArchiveRow> columns={columns} data={data} emptyText="No archived requests." />
    </div>
  );
}
