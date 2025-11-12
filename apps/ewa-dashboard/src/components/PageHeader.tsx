// src/components/PageHeader.tsx
import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, right }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header__left">
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {right && <div className="page-header__right">{right}</div>}

      <style>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 12px;
          margin-bottom: 28px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .page-header__left {
          display: flex;
          flex-direction: column;
        }

        .page-header__title {
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #0f172a;
          margin: 0;
          line-height: 1.2;
          animation: fadeIn 0.2s ease;
        }

        .page-header__subtitle {
          font-size: 15px;
          color: #6b7280;
          margin-top: 4px;
        }

        .page-header__right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(2px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 640px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          .page-header__right {
            width: 100%;
            justify-content: flex-start;
          }
        }
      `}</style>
    </header>
  );
}
