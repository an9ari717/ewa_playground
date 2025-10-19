// src/pages/Inbox.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listInbox, approve, reject } from "../api/requests";
import { useAuthStore, type Role } from "../auth/store";
import { RequestDetailsPanel } from "../components/RequestDetailsPanel";

// --- helper: robust date handling ---
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

function formatWhen(obj: any): string {
  const raw =
    obj?.createdAt ??
    obj?.created_at ??
    obj?.submittedAt ??
    obj?.created ??
    obj?.date ??
    null;
  const d = toDate(raw);
  return d ? d.toLocaleString() : "—";
}

// --- main page ---
export default function Inbox() {
  const qc = useQueryClient();

  const role = useAuthStore((s) => s.role);
  const userId = useAuthStore((s) => s.userId);
  const email = useAuthStore((s) => s.email);
  const setRole = useAuthStore((s) => s.setRole);
  const setUserId = useAuthStore((s) => s.setUserId);
  const setEmail = useAuthStore((s) => s.setEmail);

  const [tempUserId, setTempUserId] = useState(userId ?? "");
  const [tempEmail, setTempEmail] = useState(email ?? "");

  const canQuery = Boolean(role && userId);

  // --- Fetch inbox ---
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["inbox", role, userId, email],
    queryFn: () => listInbox(role!, userId!, email ?? undefined),
    enabled: canQuery,
    refetchOnWindowFocus: false,
  });

  // --- Mutations ---
  const approveMut = useMutation({
    mutationFn: (id: string) => approve(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["inbox", role, userId, email] }),
  });

  const rejectMut = useMutation({
    mutationFn: (id: string) => reject(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["inbox", role, userId, email] }),
  });

  // --- open details panel (via URL) ---
  function openDetails(id: string) {
    const sp = new URLSearchParams(window.location.search);
    sp.set("requestId", id);
    const url = `${window.location.pathname}?${sp.toString()}`;
    window.history.pushState({}, "", url);
  }

  // --- Setup screen when no role/userId yet ---
  if (!canQuery) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-lg font-semibold">
          Choose role and enter identifiers
        </div>

        <div className="flex gap-3 items-center">
          <label className="text-sm opacity-70">Role</label>
          <select
            value={role ?? ""}
            onChange={(e) => setRole(e.target.value as Role)}
            className="border rounded-lg px-2 py-1"
          >
            <option value="" disabled>
              Pick a role
            </option>
            <option value="EMPLOYEE">EMPLOYEE</option>
            <option value="MANAGER">MANAGER</option>
            <option value="DIRECTOR">DIRECTOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>

        <div className="flex gap-3 items-center">
          <label className="text-sm opacity-70">userId (UUID)</label>
          <input
            value={tempUserId}
            onChange={(e) => setTempUserId(e.target.value)}
            placeholder="paste a real user's UUID"
            className="border rounded-lg px-2 py-1 w-[460px] max-w-full"
          />
          <button
            onClick={() => setUserId(tempUserId.trim())}
            className="px-3 py-1 rounded-xl border hover:bg-gray-50"
          >
            Use this userId
          </button>
        </div>

        <div className="flex gap-3 items-center">
          <label className="text-sm opacity-70">Email (optional)</label>
          <input
            value={tempEmail}
            onChange={(e) => setTempEmail(e.target.value)}
            placeholder="manager_ali@demo.local"
            className="border rounded-lg px-2 py-1 w-[460px] max-w-full"
          />
          <button
            onClick={() => setEmail(tempEmail.trim())}
            className="px-3 py-1 rounded-xl border hover:bg-gray-50"
          >
            Use this email
          </button>
        </div>

        <div className="text-xs opacity-60">
          Backend requires <b>role</b> + <b>userId</b>. If provided, email is
          also sent as <code>?by=</code> and in <code>x-user-email</code> header.
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="p-6">Loading…</div>;

  if (error) {
    const anyErr = error as any;
    const serverMsg = anyErr?.response?.data ?? anyErr?.message ?? "Unknown error";
    return (
      <div className="p-6 text-red-600 space-y-2">
        <div className="font-semibold">Failed to load inbox for {role}</div>
        <pre className="text-xs bg-red-50 border rounded p-3 overflow-auto">
          {typeof serverMsg === "string"
            ? serverMsg
            : JSON.stringify(serverMsg, null, 2)}
        </pre>
        <button
          onClick={() =>
            qc.invalidateQueries({ queryKey: ["inbox", role, userId, email] })
          }
          className="px-3 py-1 rounded-xl border"
        >
          Retry
        </button>
      </div>
    );
  }

  // --- Main Inbox list ---
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Inbox — {role}{" "}
          {isFetching ? (
            <span className="text-sm opacity-60">(refreshing…)</span>
          ) : null}
        </h1>
        <div className="flex items-center gap-3 text-sm opacity-70">
          <div>
            userId:{" "}
            <code className="bg-gray-50 border rounded px-2 py-0.5">
              {userId}
            </code>
          </div>
          {email && (
            <div>
              email:{" "}
              <code className="bg-gray-50 border rounded px-2 py-0.5">
                {email}
              </code>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {data?.map((r: any) => (
          <div
            key={r.id}
            className="border rounded-xl p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
            onClick={() => openDetails(r.id)}
          >
            <div>
              <div className="font-medium">
                {r.title ?? r.subject ?? `Request #${r.id}`}
              </div>
              <div className="text-sm opacity-70">
                {formatWhen(r)} • {r.status ?? "PENDING"}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  rejectMut.mutate(r.id);
                }}
                disabled={rejectMut.isPending || approveMut.isPending}
                className="px-3 py-1 rounded-xl border"
              >
                {rejectMut.isPending ? "Rejecting…" : "Reject"}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  approveMut.mutate(r.id);
                }}
                disabled={approveMut.isPending || rejectMut.isPending}
                className="px-3 py-1 rounded-xl border"
              >
                {approveMut.isPending ? "Approving…" : "Approve"}
              </button>
            </div>
          </div>
        ))}

        {!data?.length && (
          <div className="text-sm opacity-70">No items for this role.</div>
        )}
      </div>

      {/* The slide-over request details panel */}
      <RequestDetailsPanel />
    </div>
  );
}
