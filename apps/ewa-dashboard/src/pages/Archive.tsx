// src/pages/Archive.tsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Table from "../components/Table";
import PageHeader from "../components/PageHeader";

type Row = {
  id: string;
  type: "LEAVE" | "PROCUREMENT" | "IT_SUPPORT";
  title: string;
  finalStatus: "APPROVED" | "REJECTED";
  closedAt: string; // ISO
  handledBy: string;
};

export default function Archive() {
  const nav = useNavigate();

  const rows: Row[] = useMemo(
    () => [
      {
        id: "REQ-1760867111111",
        type: "LEAVE",
        title: "Annual leave — 5 days",
        finalStatus: "APPROVED",
        closedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        handledBy: "director@ewa.gov.bh",
      },
      {
        id: "REQ-1760867222222",
        type: "PROCUREMENT",
        title: "Monitor 27”",
        finalStatus: "REJECTED",
        closedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        handledBy: "manager@ewa.gov.bh",
      },
    ],
    []
  );

  const columns = [
    {
      key: "id",
      header: "ID",
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
    { key: "type", header: "Type" },
    { key: "title", header: "Title" },
    { key: "finalStatus", header: "Final Status" },
    {
      key: "closedAt",
      header: "Closed At",
      render: (r: Row) => new Date(r.closedAt).toLocaleString(),
    },
    { key: "handledBy", header: "Handled By" },
  ];

  return (
    <div style={{ maxWidth: 980 }}>
      <PageHeader
        title="Archive"
        subtitle="Completed or closed requests."
      />
      <Table columns={columns} data={rows} emptyText="Nothing archived yet." />
    </div>
  );
}
