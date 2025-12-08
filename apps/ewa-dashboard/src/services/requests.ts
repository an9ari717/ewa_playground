// src/services/requests.ts
import { api } from "../lib/api";
import { z } from "zod";
import { RequestZ, HistoryItemZ } from "../lib/dto";

/** Normalized shape for list items */
export type NormalizedRequestItem = {
  id: string;
  title: string;
  type: string;
  status: string;
  currentStage?: string | null;
  createdAt: string;
  createdBy: { id: string; name: string };
  from?: string | null;
  to?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  reason?: string;
};

/** Returned by fetchRequests */
export type RequestsResult = {
  items: NormalizedRequestItem[];
  page: number;
  pageSize: number;
  total: number;
};

/**
 * Unified fetchRequests:
 *
 * Backend expects:
 *   GET /requests?box=inbox|my|archive&page=..&pageSize=..
 * and uses req.actor (JWT) to decide:
 *   - inbox   -> RequestAssignee for that user
 *   - my      -> requesterId = user
 *   - archive -> completed/approved/rejected/etc.
 */
export async function fetchRequests(params: {
  box: "inbox" | "my" | "archive";
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<RequestsResult> {
  const { box, page = 1, pageSize = 10, status } = params;

  const query: Record<string, any> = {
    box, // 👈 tells backend which “box” logic to use
    page,
    pageSize,
    _ts: Date.now(), // cache buster
  };
  if (status) query.status = status;

  // 🔥 always use /requests – no more /inbox endpoint on frontend
  const { data } = await api.get("/requests", { params: query });

  // Accept {data:[...]}, {items:[...]}, or raw [...]
  const rawItems: any[] = Array.isArray((data as any)?.data)
    ? (data as any).data
    : Array.isArray((data as any)?.items)
    ? (data as any).items
    : Array.isArray(data)
    ? (data as any)
    : [];

  const items: NormalizedRequestItem[] = rawItems.map((r: any) => {
    const p =
      r?.payload && typeof r.payload === "object"
        ? r.payload
        : r?.details && typeof r.details === "object"
        ? r.details
        : ({} as Record<string, any>);

    const start =
      p.from ??
      p.start ??
      p.startDate ??
      r.start ??
      r.startDate ??
      null;

    const end =
      p.to ??
      p.end ??
      p.endDate ??
      r.end ??
      r.endDate ??
      null;

    const reason = r.title ?? p.reason ?? p.details ?? "";

    const createdBy =
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
          };

    return {
      id: String(r.id),
      title: r.title ?? "(untitled)",
      type:
        typeof r.type === "object"
          ? r.type.name ?? r.type.title ?? r.type.id ?? "-"
          : r.type ?? r.typeId ?? "-",
      status: r.status ?? "PENDING",
      currentStage: r.currentStage ?? null,
      createdAt: r.createdAt ?? new Date().toISOString(),
      createdBy,
      from: start,
      to: end,
      startDate: start,
      endDate: end,
      reason,
    };
  });

  return {
    items,
    page: (data as any)?.page ?? page,
    pageSize: (data as any)?.pageSize ?? pageSize,
    total: (data as any)?.total ?? items.length,
  };
}

/** Single request */
export async function fetchRequest(id: string) {
  const { data } = await api.get(`/requests/${id}`, {
    params: { includeArchived: true, _ts: Date.now() },
  });
  return RequestZ.parse(data);
}

/** History */
export async function fetchHistory(id: string) {
  const { data } = await api.get(`/requests/${id}/history`, {
    params: { _ts: Date.now() },
  });
  return z.array(HistoryItemZ).parse(data);
}

/** Approve / Reject */
export async function mutateStatus(
  id: string,
  payload: { approved: boolean; comment?: string }
) {
  const { data } = await api.patch(`/requests/${id}/status`, payload);
  return data;
}

/** Create request */
export async function createRequest(payload: {
  title: string;
  type: string; // "LEAVE", "PROCUREMENT", "IT_SUPPORT"
  details?: any;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}) {
  const bodyPayload: any = {};
  if (payload.details) bodyPayload.reason = payload.details;
  if (payload.from) bodyPayload.from = payload.from;
  if (payload.to) bodyPayload.to = payload.to;

  const dto = {
    typeKey: payload.type,
    title: payload.title,
    payload: bodyPayload,
  };

  const { data } = await api.post("/requests", dto);

  try {
    return RequestZ.parse(data);
  } catch {
    return data;
  }
}
