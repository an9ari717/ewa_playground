// src/pages/Inbox.tsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Table from "../components/Table";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";

type Row = {
  id: string;
  from: string;
  type: "LEAVE" | "PROCUREMENT" | "IT_SUPPORT";
  title: string;
  receivedAt: string; // ISO
  status: "PENDING" | "APPROVED" | "REJECTED";
};

export default function Inbox() {
  const nav = useNavigate();

  const rows: Row[] = useMemo(
    () => [
      {
        id: "REQ-1760869000001",
        from: "isa@ewa.gov.bh",
        type: "LEAVE",
        title: "Annual leave — 2 days",
        receivedAt: new Date().toISOString(),
        status: "PENDING",
      },
      {
        id: "REQ-1760869000002",
        from: "fae@ewa.gov.bh",
        type: "PROCUREMENT",
        title: "Ergonomic chair",
        receivedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        status: "PENDING",
      },
    ],
    []
  );

  const columns = [
    {
      key: "id",
      header: "ID",
      width: 200,
      render: (r: Row) => (
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            nav(`/app/requests/${r.id}`);
          }}
          style={{ textDecoration: "underline" }}
        >
          {r.id}
        </a>
      ),
    },
    { key: "from", header: "From", width: 220 },
    { key: "type", header: "Type", width: 140 },
    { key: "title", header: "Title" },
    {
      key: "receivedAt",
      header: "Received",
      width: 200,
      render: (r: Row) => new Date(r.receivedAt).toLocaleString(),
    },
    { key: "status", header: "Status", width: 120 },
    {
      key: "actions",
      header: "Actions",
      width: 280,
      render: (r: Row) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="primary" size="sm" onClick={() => alert(`Approve (stub): ${r.id}`)}>
            Approve
          </Button>
          <Button size="sm" onClick={() => alert(`Reject (stub): ${r.id}`)}>
            Reject
          </Button>
          <Button size="sm" variant="ghost" onClick={() => nav(`/app/requests/${r.id}`)}>
            View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 980 }}>
      <PageHeader title="Inbox" subtitle="Items assigned to you for review." />
      <Table columns={columns} data={rows} emptyText="Nothing here yet." />
    </div>
  );
}
