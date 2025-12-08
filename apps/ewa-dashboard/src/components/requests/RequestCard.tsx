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

// Card border is now neutral – color lives in the badge, not the whole box
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
    <div className="rcard">
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
          background: var(--card);
          border: 1px solid var(--border);      /* ✅ neutral border */
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
          padding: 12px;
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 12px;
          transition:
            box-shadow .15s ease,
            transform .12s ease,
            background-color .15s ease,
            border-color .15s ease;
          color: var(--text);
        }
        .rcard:hover {
          box-shadow: 0 8px 20px rgba(15,23,42,.10);
          background: var(--bg-soft);
          border-color: rgba(148,163,184,0.6);
        }

        .rcard-left { min-width: 0; }

        .rcard-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          min-width: 0;
        }
        .rcard-title {
          font-weight: 700;
          font-size: 14px;
          color: var(--text);
          letter-spacing: .01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 680px;
        }
        .rcard-type {
          font-size: 12px;
          color: var(--muted);
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 1px 8px;
          background: var(--card);
          white-space: nowrap;
        }

        .rcard-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 12px;
          color: var(--muted);
          margin-top: 2px;
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
