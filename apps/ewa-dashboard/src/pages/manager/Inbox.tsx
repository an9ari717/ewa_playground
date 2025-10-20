// src/pages/manager/Inbox.tsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Table from "../../components/Table";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";

type Row = {
  id: string;
  type: "LEAVE" | "PROCUREMENT" | "IT_SUPPORT";
  title: string;
  submittedBy: string;
  submittedAt: string; // ISO
  status: "PENDING" | "APPROVED" | "REJECTED";
};

export default function ManagerInbox() {
  const nav = useNavigate();

  // 🔹 Mock rows (replace with API later)
  const rows: Row[] = useMemo(
    () => [
      {
        id: "REQ-1760868222693",
        type: "LEAVE",
        title: "Annual leave — 3 days",
        submittedBy: "isa@ewa.gov.bh",
        submittedAt: new Date().toISOString(),
        status: "PENDING",
      },
      {
        id: "REQ-1760868290716",
        type: "PROCUREMENT",
        title: "New headset for field team",
        submittedBy: "fae@ewa.gov.bh",
        submittedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        status: "PENDING",
      },
      {
        id: "REQ-1760868773658",
        type: "IT_SUPPORT",
        title: "Laptop running slow",
        submittedBy: "hamad@ewa.gov.bh",
        submittedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
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
    { key: "type", header: "Type", width: 140 },
    { key: "title", header: "Title" },
    { key: "submittedBy", header: "Submitted By", width: 220 },
    {
      key: "submittedAt",
      header: "Submitted At",
      width: 200,
      render: (r: Row) => new Date(r.submittedAt).toLocaleString(),
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
          <Button
            size="sm"
            variant="ghost"
            onClick={() => nav(`/app/requests/${r.id}`)}
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 980 }}>
      <PageHeader
        title="Manager — Inbox"
        subtitle="Requests waiting for your review."
      />
      <Table columns={columns} data={rows} emptyText="Nothing pending." />
    </div>
  );
}
