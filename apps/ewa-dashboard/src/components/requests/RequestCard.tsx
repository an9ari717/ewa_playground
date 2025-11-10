import StatusBadge from "./StatusBadge";
import Button from "../Button";

type Props = {
  id: string;
  title: string;
  type?: string;
  createdAt?: string;
  createdBy?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED";
  onOpen?: () => void;
};

function borderByStatus(s?: string) {
  switch (s) {
    case "APPROVED":
      return "1px solid #86efac"; // green-300
    case "REJECTED":
      return "1px solid #fecaca"; // red-200
    case "PENDING":
      return "1px solid #fde68a"; // amber-300
    case "ARCHIVED":
    default:
      return "1px solid #e5e7eb"; // gray-200
  }
}

export default function RequestCard({
  id,
  title,
  type,
  createdAt,
  createdBy,
  status,
  onOpen,
}: Props) {
  return (
    <div
      style={{
        border: borderByStatus(status),
        borderRadius: 12,
        background: "#fff",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        padding: 12,
        display: "grid",
        gridTemplateColumns: "1fr auto",
        alignItems: "center",
        gap: 12,
      }}
    >
      {/* Left section */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: "#1d4ed8",
            }}
          >
            {title || id}
          </span>
          {type && (
            <span
              style={{
                fontSize: 12,
                color: "#6b7280",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                padding: "1px 6px",
              }}
            >
              {type}
            </span>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            fontSize: 12,
            color: "#6b7280",
          }}
        >
          {createdAt && <div>Received: <strong>{createdAt}</strong></div>}
          {createdBy && <div>From: <strong>{createdBy}</strong></div>}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            Status: <StatusBadge status={status as any} size="sm" />
          </div>
        </div>
      </div>

      {/* Right section */}
      {onOpen && (
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            justifySelf: "end",
          }}
        >
          <Button
            size="sm"
            variant="primary"
            onClick={onOpen}
          >
            View / Act
          </Button>
        </div>
      )}
    </div>
  );
}
