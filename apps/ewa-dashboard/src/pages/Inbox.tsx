// src/pages/Inbox.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Page from "../components/layout/Page";
import Card from "../components/ui/Card";
import Button from "../components/Button";
import Loader from "../components/Loader";
import RequestCard from "../components/requests/RequestCard";
import DataToolbar from "../components/ui/DataToolbar";

import { useRequests } from "../hooks/useRequests";
import { useAuth } from "../store/auth";

type Item = {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  status:
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "ARCHIVED"
    | "COMPLETED"
    | string;
  createdBy?: { name?: string; email?: string } | null;
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default function Inbox() {
  const nav = useNavigate();
  const me = useAuth((s) => s.me);

  const role = me?.role ?? "";

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [search, setSearch] = useState("");

  // Unified inbox – backend filters by actor + RequestAssignee
  const { data, isLoading, isError, isFetching, refetch } = useRequests(
    "inbox",
    undefined,
    page,
    pageSize
  );

  const items: Item[] = useMemo(() => {
    const list = data?.items ?? [];
    return list.map((r: any) => ({
      id: r.id,
      type: r.type,
      title: r.title ?? r.reason ?? "",
      createdAt: r.createdAt ?? "",
      status: r.status ?? "PENDING",
      createdBy: r.createdBy ?? null,
    }));
  }, [data]);

  // 🔍 simple client-side search of the *current page* items
  const visibleItems: Item[] = useMemo(() => {
    if (!search.trim()) return items;
    const s = search.trim().toLowerCase();
    return items.filter((it) => {
      const who =
        (it.createdBy?.name || it.createdBy?.email || "").toLowerCase();
      return (
        it.title.toLowerCase().includes(s) ||
        (it.type || "").toLowerCase().includes(s) ||
        who.includes(s)
      );
    });
  }, [items, search]);

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const roleLabel = (role: string) => {
    if (!role) return "Inbox";
    if (role === "HR_OFFICER") return "HR Officer";
    if (role === "IT_OFFICER") return "IT Officer";
    return role.charAt(0) + role.slice(1).toLowerCase();
  };

  const pageTitle = role ? `${roleLabel(role)}’s Inbox` : "Inbox";

  return (
    <Page
      title={pageTitle}
      right={
        <Button
          size="sm"
          variant="secondary"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? "Refreshing…" : "Refresh"}
        </Button>
      }
      maxWidth={1100}
      leftOffset={60}
    >
      {/* 🔷 Toolbar – same vibe as Users page */}
      <DataToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by title, type, or requester…"
      />

      <Card title="Pending Requests" stickyHeader stickyTop={0}>
        {/* Info bar under the card header */}
        <div className="mi-infobar">
          <div className="mi-infobar__left">
            {isFetching ? "Refreshing…" : "Requests waiting for your approval."}
          </div>
          <div className="mi-infobar__right" aria-live="polite">
            <span className="mi-chip">
              <span className="mi-chip__dot" />
              Total {total}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="mi-body">
          {isLoading ? (
            <Loader fullHeight />
          ) : isError ? (
            <div className="mi-empty mi-empty--error">
              <div className="mi-empty__title">Failed to load.</div>
              <Button size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="mi-empty">
              <div className="mi-empty__dot" />
              <div className="mi-empty__text">Nothing pending for you.</div>
            </div>
          ) : (
            <div className="mi-list">
              {visibleItems.map((it) => (
                <RequestCard
                  key={it.id}
                  id={it.id}
                  title={it.title}
                  type={it.type}
                  createdAt={formatDate(it.createdAt)}
                  createdBy={it.createdBy?.name || it.createdBy?.email || "—"}
                  status={
                    (it.status === "IN_REVIEW" ? "PENDING" : it.status) as
                      | "PENDING"
                      | "APPROVED"
                      | "REJECTED"
                      | "ARCHIVED"
                      | "COMPLETED"
                  }
                  onOpen={() => nav(`/app/requests/${it.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pager */}
        {!isLoading && !isError && items.length > 0 && (
          <div className="mi-pager">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Prev
            </Button>

            <span className="mi-pager__meta">
              Page {page} / {totalPages} • Total {total}
            </span>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </Card>

      {/* Local styles for Inbox layout */}
      <style>{`
        .mi-infobar {
          padding: 10px 12px;
          border-bottom: 1px solid var(--border, #e5e7eb);
          background: var(--card, #ffffff);
          font-size: 13px;
          color: var(--muted, #64748b);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .mi-infobar__left {
          opacity: 0.95;
        }

        .mi-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px;
          border: 1px solid var(--border, #e2e8f0);
          border-radius: 999px;
          background: var(--bg, #f9fafb);
          font-weight: 700;
          color: var(--text, #0f172a);
          letter-spacing: .02em;
        }
        .mi-chip__dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
        }

        .mi-body {
          padding: 12px;
        }
        .mi-list {
          display: grid;
          gap: 12px;
        }

        .mi-empty {
          display: grid;
          place-items: center;
          gap: 8px;
          padding: 32px 12px;
          color: var(--muted, #6b7280);
          font-size: 14px;
        }
        .mi-empty__dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: var(--border, #e5e7eb);
        }
        .mi-empty__text {
          opacity: .9;
        }
        .mi-empty--error .mi-empty__title {
          margin-bottom: 12px;
          color: #dc2626;
          font-weight: 600;
        }

        .mi-pager {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-top: 1px solid var(--border, #e5e7eb);
          background: var(--card, #ffffff);
        }
        .mi-pager__meta {
          font-size: 12px;
          color: var(--muted, #6b7280);
        }
      `}</style>
    </Page>
  );
}
