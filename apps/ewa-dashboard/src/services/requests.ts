// src/services/requests.ts
import { api } from "../lib/api";
import { z } from "zod";
import { RequestZ, HistoryItemZ } from "../lib/dto";
import { getUserEmail } from "../lib/session";

/**
 * fetchRequests
 * - inbox    -> GET /inbox?role=...&userId=... (or by=email fallback)
 * - my       -> GET /requests?mine=true
 * - archive  -> GET /requests?archived=true
 */
export async function fetchRequests(params: {
  box: "inbox" | "my" | "archive";
  role?: string;
  userId?: string;
  page?: number;
  pageSize?: number;
  status?: string;
}) {
  const { box, role, userId, page = 1, pageSize = 10, status } = params;

  const query: Record<string, any> = {
    page,
    pageSize,
    _ts: Date.now(), // cache buster
  };
  if (status) query.status = status;

  let endpoint = "/requests";

  if (box === "my") {
    query.mine = true;
  }

  if (box === "archive") {
    query.archived = true;
  }

  if (box === "inbox") {
    endpoint = "/inbox";
    if (role) query.role = role;

    // Prefer userId if provided; otherwise fall back to current user's email
    if (userId) {
      query.userId = userId;
    } else {
      const email = getUserEmail();
      if (email) query.by = email;
    }
  }

  const { data } = await api.get(endpoint, { params: query });

  // Accept {data:[...]}, {items:[...]}, or a raw array [...]
  const rawItems: any[] = Array.isArray((data as any)?.data)
    ? (data as any).data
    : Array.isArray((data as any)?.items)
    ? (data as any).items
    : Array.isArray(data)
    ? (data as any)
    : [];

  // Normalize: expose start/end dates & reason for tables and details
  const items = rawItems.map((r: any) => {
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

    return {
      id: String(r.id),
      title: r.title ?? "(untitled)",
      type:
        typeof r.type === "object"
          ? r.type.name ?? r.type.title ?? r.type.id ?? "-"
          : r.type ?? r.typeId ?? "-",
      status: r.status ?? "PENDING",
      currentStage: r.currentStage ?? null,

      // "Received"
      createdAt: r.createdAt ?? new Date().toISOString(),

      // "From" (person)
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

      // Date aliases so UI can reliably render
      from: start,
      to: end,
      startDate: start,
      endDate: end,

      // "Reason / Title"
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
