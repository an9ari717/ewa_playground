// src/pages/Archive.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Page from "../components/layout/Page";
import Card from "../components/ui/Card";
import Button from "../components/Button";

import { useRequests } from "../hooks/useRequests";
import RequestCard from "../components/requests/RequestCard";
import DataToolbar from "../components/ui/DataToolbar";

// Small inline select used in the toolbar
function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "8px 12px",
        borderRadius: 999,
        border: "1px solid var(--border)",
        background: "var(--input-bg)",
        color: "var(--text)",
        fontSize: 14,
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// Helper to make status labels pretty
function prettyStatusLabel(status: string): string {
  const s = status.toUpperCase();
  if (s === "APPROVED") return "Approved";
  if (s === "REJECTED") return "Rejected";
  if (s === "ARCHIVED") return "Archived";
  if (s === "COMPLETED") return "Completed";

  // Fallback: turn "AUTO_CLOSED" → "Auto closed"
  return s
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type Item = {
  id: string;
  type: string;
  title: string;
  createdAt: string;
  status: string; // allow whatever backend sends
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

export default function Archive() {
  const nav = useNavigate();

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Backend fetch – ONLY box + pagination
  const { data, isLoading, isError, refetch, isFetching } = useRequests(
    "archive",
    undefined,
    page,
    pageSize
  );

  const items: Item[] = useMemo(() => {
    const list = data?.items ?? [];
    return list.map((r: any) => ({
      id: r.id,
      type:
        typeof r?.type === "object"
          ? r.type?.name ?? r.type?.title ?? "-"
          : r?.type ?? "-",
      title: r.title ?? "-",
      createdAt: r.createdAt ?? "",
      status: String(r.status ?? "ARCHIVED"),
      createdBy: r.createdBy ?? r.requester ?? null,
    }));
  }, [data]);

  // Dynamic request-type options based on what actually exists
  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => {
      if (it.type) set.add(it.type);
    });
    return Array.from(set);
  }, [items]);

  // 🔥 Dynamic status options based on actual data
  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => {
      if (it.status) set.add(it.status);
    });
    return Array.from(set);
  }, [items]);

  // Client-side filtering: search + type + status
  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = items;

    if (term) {
      list = list.filter((it) => {
        const createdBy =
          it.createdBy?.name || it.createdBy?.email || "";
        return (
          it.id.toLowerCase().includes(term) ||
          it.title.toLowerCase().includes(term) ||
          it.type.toLowerCase().includes(term) ||
          createdBy.toLowerCase().includes(term)
        );
      });
    }

    if (statusFilter !== "all") {
      list = list.filter((it) => it.status === statusFilter);
    }

    if (typeFilter !== "all") {
      list = list.filter((it) => it.type === typeFilter);
    }

    return list;
  }, [items, search, statusFilter, typeFilter]);

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const visibleCount = filteredItems.length;

  return (
    <Page
      title="Archive"
      right={
        <Button size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Refreshing…" : "Refresh"}
        </Button>
      }
      maxWidth={1100}
      leftOffset={60}
    >
      <Card title="Completed and Closed Requests" stickyHeader stickyTop={0}>
        {/* 🔍 Filter toolbar (search + dropdowns) */}
        <div style={{ padding: "12px 12px 0" }}>
          <DataToolbar
            searchValue={search}
            onSearchChange={(v) => {
              setPage(1);
              setSearch(v);
            }}
            searchPlaceholder="Search by Request ID, Title, or Employee…"
          >
            {/* Status filter – built from real statuses */}
            <FilterSelect
              value={statusFilter}
              onChange={(v) => {
                setPage(1);
                setStatusFilter(v);
              }}
              options={[
                { value: "all", label: "All statuses" },
                ...statusOptions.map((s) => ({
                  value: s,
                  label: prettyStatusLabel(s),
                })),
              ]}
            />

            {/* Type filter (client-side, dynamic) */}
            <FilterSelect
              value={typeFilter}
              onChange={(v) => {
                setPage(1);
                setTypeFilter(v);
              }}
              options={[
                { value: "all", label: "All types" },
                ...typeOptions.map((t) => ({ value: t, label: t })),
              ]}
            />
          </DataToolbar>
        </div>

        {/* Info bar */}
        <div
          style={{
            padding: "10px 12px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-soft)",
            fontSize: 13,
            color: "var(--muted)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div>
            {isFetching
              ? "Refreshing…"
              : "All requests that have been completed and archived."}
          </div>
          <div style={{ color: "var(--muted)" }}>
            Showing{" "}
            <strong style={{ color: "var(--text)" }}>{visibleCount}</strong> of{" "}
            <strong style={{ color: "var(--text)" }}>{total}</strong>
          </div>
        </div>

        {/* List */}
        <div style={{ padding: 12 }}>
          {isLoading ? (
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              Loading…
            </div>
          ) : isError ? (
            <div
              style={{
                color: "#f87171",
                marginBottom: 12,
                fontSize: 13,
              }}
            >
              Failed to load.{" "}
              <Button size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              No archived items.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {filteredItems.map((it) => (
                <RequestCard
                  key={it.id}
                  id={it.id}
                  title={it.title || it.id}
                  type={it.type}
                  createdAt={formatDate(it.createdAt)}
                  createdBy={it.createdBy?.name || it.createdBy?.email || "—"}
                  status={it.status as any}
                  onOpen={() => nav(`/app/requests/${it.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && !isError && filteredItems.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 12px",
              borderTop: "1px solid var(--border)",
              background: "var(--bg-soft)",
            }}
          >
            <Button
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Prev
            </Button>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              Page {page} / {totalPages} • Total {total}
            </span>
            <Button
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </Card>
    </Page>
  );
}
