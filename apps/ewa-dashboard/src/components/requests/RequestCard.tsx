// src/components/requests/RequestCard.tsx
import StatusBadge from "./StatusBadge";
import Button from "../Button";

type Props = {
  id: string;
  title: string;
  type?: string;
  createdAt?: string;
  createdBy?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED" | "COMPLETED";
  onOpen?: () => void;
};

function borderByStatus(s?: string) {
  switch (s) {
    case "APPROVED":
    case "COMPLETED": // treat completed as approved (green border)
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
  const visualStatus = (status === "COMPLETED" ? "APPROVED" : status) as Props["status"];

  return (
    <div className="rcard" style={{ border: borderByStatus(visualStatus) }}>
      {/* Left section */}
      <div className="rcard-left">
        <div className="rcard-head">
          <span className="rcard-title">{title || id}</span>
          {type && <span className="rcard-type">{type}</span>}
        </div>

        <div className="rcard-meta">
          {createdAt && (
            <div>
              Received: <strong>{createdAt}</strong>
            </div>
          )}
          {createdBy && (
            <div>
              From: <strong>{createdBy}</strong>
            </div>
          )}
          <div className="rcard-status">
            Status: <StatusBadge status={visualStatus as any} size="sm" />
          </div>
        </div>
      </div>

      {/* Right section */}
      {onOpen && (
        <div className="rcard-actions">
          <Button size="sm" variant="primary" onClick={onOpen}>
            View / Act
          </Button>
        </div>
      )}

      <style>{`
        .rcard {
          border-radius: 12px;
          background: #fff;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
          padding: 12px;
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 12px;
          transition: box-shadow .15s ease, transform .12s ease, border-color .15s ease;
        }
        .rcard:hover { box-shadow: 0 6px 16px rgba(15,23,42,.06); }
        .rcard-left { min-width: 0; }

        .rcard-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          min-width: 0;
        }
        .rcard-title {
          font-weight: 800;
          font-size: 14px;
          color: #0f172a;
          letter-spacing: .01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 680px;
        }
        .rcard-type {
          font-size: 12px;
          color: #6b7280;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 1px 6px;
          background: #fff;
          white-space: nowrap;
        }

        .rcard-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 12px;
          color: #6b7280;
        }
        .rcard-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .rcard-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          justify-self: end;
        }

        @media (max-width: 640px) {
          .rcard { grid-template-columns: 1fr; gap: 10px; }
          .rcard-title { max-width: 100%; }
          .rcard-actions { justify-self: start; }
        }
      `}</style>
    </div>
  );
}
