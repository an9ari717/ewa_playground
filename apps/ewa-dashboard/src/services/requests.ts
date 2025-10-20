// src/services/requests.ts
import { api } from "../lib/api";
import { z } from "zod";
import { RequestZ, HistoryItemZ } from "../lib/dto";
import { getUserEmail } from "../lib/session";

// Accept backend response shape:
// { page, pageSize, total, totalPages, data: [...] }
// and normalize it to { items, page, pageSize, total }
export async function fetchRequests(params: {
  box: "inbox" | "my" | "archive";
  role?: string;
  page?: number;
  pageSize?: number;
  status?: string;
}) {
  const { data } = await api.get("/requests", { params });

  // Prefer `data` field; fallback to `items` if backend changes later.
  const rawItems: any[] = Array.isArray((data as any)?.data)
    ? (data as any).data
    : Array.isArray((data as any)?.items)
    ? (data as any).items
    : [];

  // Map and normalize every request
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
      typeof r.createdBy === "object"
        ? {
            id: r.createdBy.id ?? "",
            name: r.createdBy.name ?? r.createdBy.email ?? "—",
          }
        : { id: r.createdById ?? "", name: r.by ?? r.requesterName ?? "—" },
  }));

  // Return normalized structure
  return {
    items,
    page: (data as any)?.page ?? params.page ?? 1,
    pageSize: (data as any)?.pageSize ?? params.pageSize ?? 10,
    total: (data as any)?.total ?? items.length,
  };
}

export async function fetchRequest(id: string) {
  const { data } = await api.get(`/requests/${id}`);
  return RequestZ.parse(data);
}

export async function fetchHistory(id: string) {
  try {
    const { data } = await api.get(`/requests/${id}/history`);
    return z.array(HistoryItemZ).parse(data);
  } catch (err: any) {
    // If employee isn't allowed to see history yet, just return empty list
    if (err?.response?.status === 403) return [];
    throw err;
  }
}

export async function mutateStatus(
  id: string,
  payload: { approved: boolean; comment?: string }
) {
  const { data } = await api.patch(`/requests/${id}/status`, payload);
  return RequestZ.parse(data);
}

/**
 * Create request — matches backend requirement:
 * { requesterEmail, typeKey, title, payload }
 */
export async function createRequest(payload: {
  title: string;
  type: string; // e.g., "LEAVE" | "PROCUREMENT" | "IT_SUPPORT"
  details?: any; // optional free-form payload
}) {
  // ✅ Dynamically use logged-in user email if available
  const requesterEmail =
    getUserEmail() || "employee@demo.local"; // fallback for dev/demo

  const dto = {
    requesterEmail,
    typeKey: payload.type, // enum key from the dropdown
    title: payload.title,
    payload: payload.details ?? {},
  };

  try {
    const { data, status } = await api.post("/requests", dto);
    console.log("[createRequest] success:", status, data);
    try {
      return RequestZ.parse(data);
    } catch {
      return data;
    }
  } catch (err: any) {
    console.error(
      "[createRequest] error:",
      err?.response?.status,
      err?.response?.data || err?.message
    );
    throw err;
  }
}
