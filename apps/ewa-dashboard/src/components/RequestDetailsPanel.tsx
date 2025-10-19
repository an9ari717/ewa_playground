// src/components/RequestDetailsPanel.tsx
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore, type Role } from "../auth/store";
import {
  getRequestById,
  approve as approveReq,
  reject as rejectReq,
  type RequestItem,
} from "../api/requests";

export type RequestStatus = "PENDING" | "IN_REVIEW" | "REJECTED" | "COMPLETED";

export interface RequestHistoryItem {
  step: string;
  by?: string;
  role?: Role;
  date: string;
  comment?: string;
}

export interface RequestDetail {
  id: string;
  typeId: string;
  title: string;
  payload: Record<string, any>;
  status: RequestStatus;
  requesterId: string;
  requester?: { id: string; name?: string; email?: string } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  pendingWith?: Role | null;
  history?: RequestHistoryItem[];
}

/* -------- robust date helpers (same as Inbox) -------- */
function toDate(v: unknown): Date | null {
  if (v == null) return null;
  if (typeof v === "number") {
    const ms = v < 1e12 ? v * 1000 : v;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === "string") {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
    const alt = new Date(v.replace(" ", "T"));
    return isNaN(alt.getTime()) ? null : alt;
  }
  return null;
}

/* -------- URL state -------- */
let historyPatched = false;
function patchHistoryEvents() {
  if (historyPatched) return;
  const push = history.pushState;
  const replace = history.replaceState;
  // @ts-ignore
  history.pushState = function (...args) {
    const ret = push.apply(this, args);
    window.dispatchEvent(new Event("x-location-change"));
    return ret;
  };
  // @ts-ignore
  history.replaceState = function (...args) {
    const ret = replace.apply(this, args);
    window.dispatchEvent(new Event("x-location-change"));
    return ret;
  };
  window.addEventListener("popstate", () =>
    window.dispatchEvent(new Event("x-location-change"))
  );
  historyPatched = true;
}
function useUrlState() {
  const getId = () =>
    new URLSearchParams(window.location.search).get("requestId");
  const [requestId, setRequestId] = React.useState<string | null>(() => getId());
  React.useEffect(() => {
    patchHistoryEvents();
    const onAny = () => setRequestId(getId());
    window.addEventListener("x-location-change", onAny);
    return () => window.removeEventListener("x-location-change", onAny);
  }, []);
  const close = () => {
    const sp = new URLSearchParams(window.location.search);
    sp.delete("requestId");
    const qs = sp.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.pushState({}, "", url);
  };
  return { requestId, close };
}

/* -------- details via API (role + userId + by) -------- */
function useRequest(
  id: string | null,
  role: Role | null,
  userId: string | null,
  email: string | null
) {
  return useQuery<RequestDetail | null>({
    queryKey: ["request", id, role, userId, email],
    enabled: Boolean(id && role && userId),
    queryFn: async () => {
      if (!id || !role || !userId) return null;
      return await getRequestById(id, role, userId, email ?? undefined);
    },
    staleTime: 10_000,
  });
}

export function RequestDetailsPanel() {
  const { requestId, close } = useUrlState();

  const role = useAuthStore((s) => s.role);
  const userId = useAuthStore((s) => s.userId);
  const email = useAuthStore((s) => s.email);

  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useRequest(
    requestId ?? null,
    role ?? null,
    userId ?? null,
    email ?? null
  );

  // Fallback to the inbox row if details aren't available
  const inboxCache =
    qc.getQueryData<RequestItem[]>(["inbox", role, userId, email]) ?? [];
  const fallback = inboxCache.find((x) => x.id === requestId) || null;
  const effective: (RequestDetail | RequestItem) | null = data ?? fallback;

  const [comment, setComment] = React.useState("");
  const [errorText, setErrorText] = React.useState<string | null>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const approveMut = useMutation({
    mutationFn: async () => {
      if (!effective) throw new Error("No request loaded");
      return await approveReq((effective as any).id, comment.trim() || undefined);
    },
    onSuccess: () => {
      setErrorText(null);
      qc.invalidateQueries({ queryKey: ["inbox", role, userId, email] });
      qc.invalidateQueries({ queryKey: ["request", requestId, role, userId, email] });
    },
    onError: (err: any) => setErrorText(err?.message ?? "Failed to approve"),
  });

  const rejectMut = useMutation({
    mutationFn: async () => {
      if (!effective) throw new Error("No request loaded");
      if (!comment.trim())
        throw new Error("Please add a brief reason before rejecting.");
      return await rejectReq((effective as any).id, comment.trim());
    },
    onSuccess: () => {
      setErrorText(null);
      qc.invalidateQueries({ queryKey: ["inbox", role, userId, email] });
      qc.invalidateQueries({ queryKey: ["request", requestId, role, userId, email] });
    },
    onError: (err: any) => setErrorText(err?.message ?? "Failed to reject"),
  });

  const isOpen = Boolean(requestId);
  if (!isOpen) return null;

  const hasRealDetails = Boolean(data && (data as any).id === requestId);
 // true when GET details succeeded
  const pendingWith: Role | null | undefined = (data as any)?.pendingWith ?? null;
  const canAct = Boolean(hasRealDetails && role && pendingWith === role);

  const createdLabel =
    effective && (effective as any)?.createdAt
      ? (() => {
          const d = toDate((effective as any).createdAt);
          return d ? d.toLocaleString() : null;
        })()
      : null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60" onClick={close} />

      {/* Panel */}
      <aside className="fixed right-0 top-0 h-full w-full max-w-xl bg-white dark:bg-zinc-800 shadow-2xl border-l border-gray-200 dark:border-zinc-700 ring-1 ring-white/10 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-800/90 backdrop-blur">
          <div className="min-w-0">
            {isLoading ? (
              <div className="h-6 w-48 bg-gray-200 dark:bg-zinc-700 animate-pulse rounded" />
            ) : (
              <h2 className="text-lg font-semibold truncate">
                {((effective as any)?.title ?? "Request") as string}
              </h2>
            )}
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              {createdLabel && <span>Created: {createdLabel}</span>}
            </div>
          </div>
          <button
            onClick={close}
            aria-label="Close"
            className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-700"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-6">
          {/* Error details (why details failed) */}
          {isError && (
            <div className="space-y-2">
              <div className="p-3 border border-yellow-300 bg-yellow-50 text-yellow-800 rounded">
                Showing limited info (no details endpoint).{" "}
                <button onClick={() => refetch()} className="underline">
                  Retry
                </button>
              </div>
              <div className="text-xs p-3 bg-gray-50 dark:bg-zinc-900 border rounded">
                <div className="font-semibold mb-1">Debug</div>
                <div className="mb-1">
                  id=<code>{requestId}</code> · role=<code>{role ?? "null"}</code>{" "}
                  · userId=<code>{userId ?? "null"}</code> · by=
                  <code>{email ?? "null"}</code>
                </div>
                <pre className="whitespace-pre-wrap text-xs">
                  {JSON.stringify(
                    (error as any)?._debug ?? {
                      response: (error as any)?.response?.data,
                      message: (error as any)?.message ?? String(error),
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          )}

          {/* Inline action error (approve/reject) */}
          {errorText && !isError && (
            <div className="p-3 border border-red-300 bg-red-50 text-red-700 rounded">
              {errorText}
            </div>
          )}

          {/* Summary row (always available with fallback) */}
          {effective && (
            <section className="space-y-2">
              <div className="text-sm text-gray-700 dark:text-gray-200">
                <span className="inline-block mr-2 px-2 py-0.5 rounded border text-xs">
                  {(effective as any)?.status ?? "PENDING"}
                </span>
                {hasRealDetails && (data as any)?.pendingWith && (
                  <span className="inline-block mr-2 px-2 py-0.5 rounded border text-xs">
                    Pending with {(data as any).pendingWith}
                  </span>
                )}
              </div>
            </section>
          )}

          {/* Only render rich info when we actually have details */}
          {hasRealDetails ? (
            <>
              {/* Requester */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Requester</h3>
                <div className="text-sm text-gray-800 dark:text-gray-100">
                  <div>
                    {(data as any)?.requester?.name ??
                      (data as any)?.requesterId}
                  </div>
                  {(data as any)?.requester?.email && (
                    <div className="text-xs text-gray-500">
                      {(data as any).requester.email}
                    </div>
                  )}
                </div>
              </section>

              {/* Key fields */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries((data as any)?.payload ?? {})
                    .slice(0, 8)
                    .map(([k, v]) => (
                      <div
                        key={k}
                        className="border rounded p-2 bg-gray-50 dark:bg-zinc-900"
                      >
                        <div className="text-xs uppercase tracking-wide text-gray-500">
                          {k}
                        </div>
                        <div className="text-sm font-medium break-words">
                          {String(v)}
                        </div>
                      </div>
                    ))}
                </div>
              </section>

              {/* History */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">History</h3>
                <div className="space-y-2">
                  {(((data as any)?.history ?? []) as RequestHistoryItem[])
                    .slice()
                    .reverse()
                    .map((h, idx) => (
                      <div key={idx} className="text-sm border-l-2 pl-3">
                        <div className="font-medium">{h.step}</div>
                        <div className="text-xs text-gray-500">
                          {h.by} {h.role ? `(${h.role})` : ""} ·{" "}
                          {toDate(h.date)?.toLocaleString() ?? h.date}
                        </div>
                        {h.comment && (
                          <div className="mt-1 text-sm">{h.comment}</div>
                        )}
                      </div>
                    ))}
                  {!((data as any)?.history || []).length && (
                    <div className="text-sm text-gray-500">No activity yet.</div>
                  )}
                </div>
              </section>
            </>
          ) : (
            // Limited mode message when we only have fallback row
            <div className="text-xs text-gray-500">
              Limited info (using inbox row). Backend details endpoint not
              available yet.
            </div>
          )}
        </div>

        {/* Actions (only when it's our turn AND we have real details) */}
        {hasRealDetails && canAct && (
          <div className="border-t border-gray-200 dark:border-zinc-700 p-4 space-y-2">
            <label
              htmlFor="comment"
              className="text-xs text-gray-700 dark:text-gray-200"
            >
              Comment{" "}
              {approveMut.isPending || rejectMut.isPending ? "(sending…)" : ""}
            </label>
            <textarea
              id="comment"
              placeholder="Add a short note… (required if rejecting)"
              className="w-full border rounded-lg px-2 py-1 text-sm"
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                You are acting as <b>{role}</b>
                {email ? ` · ${email}` : ""}.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => rejectMut.mutate()}
                  className="px-3 py-1 rounded-lg border border-red-400 text-red-600 hover:bg-red-50 disabled:opacity-60"
                  disabled={approveMut.isPending || rejectMut.isPending}
                  title="Reject (comment required)"
                >
                  {rejectMut.isPending ? "Rejecting..." : "Reject"}
                </button>
                <button
                  onClick={() => approveMut.mutate()}
                  className="px-3 py-1 rounded-lg border border-green-500 text-green-600 hover:bg-green-50 disabled:opacity-60"
                  disabled={approveMut.isPending || rejectMut.isPending}
                >
                  {approveMut.isPending ? "Approving..." : "Approve"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Not your turn / limited mode */}
        {effective && (!hasRealDetails || !canAct) && (
          <div className="border-t border-gray-200 dark:border-zinc-700 p-3 text-xs text-gray-600 dark:text-gray-300">
            {hasRealDetails
              ? `Waiting on ${pendingWith ?? "—"}. You can’t take action on this item.`
              : "Limited view – details not available from backend."}
          </div>
        )}
      </aside>
    </div>
  );
}
