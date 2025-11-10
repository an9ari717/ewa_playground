// src/pages/Dashboard.tsx
import Page from "../components/layout/Page";
import Card from "../components/ui/Card";

export default function Dashboard() {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Page title="Dashboard" maxWidth={1200} leftOffset={60}>
      <Card title="Overview" stickyHeader stickyTop={0}>
        {/* Intro / info strip (was the subtitle) */}
        <div
          style={{
            padding: "18px 20px",
            background: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
            fontSize: 13,
            color: "#475569",
          }}
        >
          Welcome to your dashboard! • {today}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 16,
            padding: 20,
          }}
        >
          {[
            { label: "Pending Approvals", value: 12 },
            { label: "Approved Requests", value: 8 },
            { label: "Rejected Requests", value: 3 },
            { label: "Archived", value: 25 },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "white",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                padding: 20,
                textAlign: "center",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ fontSize: 13, color: "#6b7280" }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </Page>
  );
}
