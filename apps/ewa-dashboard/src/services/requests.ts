// src/services/requests.ts
import { api } from "../lib/api";
import { z } from "zod";
import { RequestZ, HistoryItemZ } from "../lib/dto";

/**
 * fetchRequests
 * Translates UI params to backend query flags:
 * - box === "my"       -> mine=true
 * - box === "archive"  -> archived=true
 * - box === "inbox"    -> (handled elsewhere via /inbox; here we just return active requests)
 */
export async function fetchRequests(params: {
  box: "inbox" | "my" | "archive";
  role?: string;       // not used by this endpoint
  page?: number;
  pageSize?: number;
  status?: string;
}) {
  const { box, page = 1, pageSize = 10, status } = params;

  // Map UI "box" to API flags
  const query: Record<string, any> = {
    page,
    pageSize,
  };

  if (status) query.status = status;

  if (box === "my") {
    query.mine = true;
  } else if (box === "archive") {
    query.archived = true;
  }
  // box === "inbox" is not handled by /requests; we use /inbox elsewhere.
  // Here we’ll just fetch active requests visible to the caller (RLS), which is fine for Dashboard lists.

  const { data } = await api.get("/requests", { params: query });

  // backend may return { data: [...] } or { items: [...] }
  const rawItems: any[] = Array.isArray((data as any)?.data)
    ? (data as any).data
    : Array.isArray((data as any)?.items)
    ? (data as any).items
    : [];

  // normalize each item so UI doesn't explode
  const items = rawItems.map((r: any) => ({
    id: String(r.id),
    title: r.title ?? "(untitled)",
    type:
      typeof r.type === "object"
        ? r.type.name ?? r.type.title ?? r.type.id ?? "-"
        : r.type ?? r.typeId ?? "-",
    status: r.status ?? "PENDING",
    currentStage: r.currentStage ?? null,
    createdAt: r.createdAt ?? new Date().toISOString(),
    createdBy:
      typeof r.requester === "object"
        ? {
            id: r.requester.id ?? "",
            name: r.requester.name ?? r.requester.email ?? "—",
          }
        : typeof r.createdBy === "object"
        ? {
            id: r.createdBy.id ?? "",
            name: r.createdBy.name ?? r.createdBy.email ?? "—",
          }
        : {
            id: r.requesterId ?? r.createdById ?? "",
            name: r.by ?? r.requesterName ?? "—",
          },
  }));

  return {
    items,
    page: (data as any)?.page ?? page,
    pageSize: (data as any)?.pageSize ?? pageSize,
    total: (data as any)?.total ?? items.length,
  };
}

/** Single request */
// src/services/requests.ts
export async function fetchRequest(id: string) {
  // ✅ includeArchived so completed/archived requests can still be viewed
  const { data } = await api.get(`/requests/${id}`, {
    params: { includeArchived: true },
  });
  return RequestZ.parse(data);
}


/** History */
export async function fetchHistory(id: string) {
  const { data } = await api.get(`/requests/${id}/history`);
  return z.array(HistoryItemZ).parse(data);
}

/** Approve / Reject (keep as-is; backend returns a summary) */
export async function mutateStatus(
  id: string,
  payload: { approved: boolean; comment?: string }
) {
  const { data } = await api.patch(`/requests/${id}/status`, payload);
  return data; // don't force-parse with RequestZ; backend returns summary object
}

/** Create request */
export async function createRequest(payload: {
  title: string;
  type: string; // "LEAVE", "PROCUREMENT", "IT_SUPPORT"
  details?: any;
}) {
  const dto = {
    typeKey: payload.type,
    title: payload.title,
    payload: payload.details ?? {},
  };

  const { data } = await api.post("/requests", dto);

  try {
    return RequestZ.parse(data);
  } catch {
    return data;
  }
}
