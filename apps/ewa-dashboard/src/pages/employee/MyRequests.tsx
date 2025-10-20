// src/pages/employee/MyRequests.tsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";

type Row = {
  id: string;
  type: "LEAVE" | "PROCUREMENT" | "IT_SUPPORT";
  status: "PENDING" | "APPROVED" | "REJECTED";
  updatedAt: string; // ISO
};

export default function MyRequests() {
  const nav = useNavigate();

  // 🔹 Mock data (replace with API later)
  const rows: Row[] = useMemo(
    () => [
      {
        id: "REQ-1760868222693",
        type: "LEAVE",
        status: "PENDING",
        updatedAt: new Date().toISOString(),
      },
      {
        id: "REQ-1760868290716",
        type: "PROCUREMENT",
        status: "PENDING",
        updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: "REQ-1760868773658",
        type: "IT_SUPPORT",
        status: "PENDING",
        updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
      {
        id: "REQ-1760870029183",
        type: "LEAVE",
        status: "PENDING",
        updatedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      },
    ],
    []
  );

  const th: React.CSSProperties = {
    textAlign: "left",
    fontWeight: 600,
    padding: "10px 8px",
    borderBottom: "1px solid #e5e7eb",
  };
  const td: React.CSSProperties = {
    padding: "10px 8px",
    borderBottom: "1px solid #f3f4f6",
  };

  return (
    <div style={{ maxWidth: 980 }}>
      <PageHeader
        title="My Requests"
        subtitle="Your requests will show here."
        right={
          <Button variant="primary" onClick={() => nav("/app/employee/request")}>
            + New Request
          </Button>
        }
      />

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
          }}
        >
          <thead>
            <tr>
              <th style={th}>ID</th>
              <th style={th}>Type</th>
              <th style={th}>Status</th>
              <th style={th}>Last Update</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={td}>
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
                </td>
                <td style={td}>{r.type}</td>
                <td style={td}>{r.status}</td>
                <td style={td}>{new Date(r.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 20, color: "#6b7280" }}>
                  You have no requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
