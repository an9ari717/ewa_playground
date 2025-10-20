import type { RequestItem } from "../../types/Requests";

const STORAGE_KEY = "ewa-requests";

// --- helpers ---
function load(): RequestItem[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(all: RequestItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

// --- API simulation ---

export async function createRequest(input: { type: string; description: string }) {
  const newReq: RequestItem = {
    id: `REQ-${Date.now()}`,
    type: input.type,
    status: "PENDING",
    updatedAt: new Date().toISOString(),
  };
  const all = load();
  all.push(newReq);
  save(all);
  return { id: newReq.id };
}

export async function getMyRequests(): Promise<RequestItem[]> {
  return load();
}

export async function getManagerInbox(): Promise<RequestItem[]> {
  // For now, show all pending
  return load().filter((r) => r.status === "PENDING");
}

export async function getRequestById(id: string): Promise<RequestItem | null> {
  const found = load().find((r) => r.id === id);
  return found || null;
}

export async function decideRequest(input: { id: string; approve: boolean; comment?: string }) {
  const all = load();
  const idx = all.findIndex((r) => r.id === input.id);
  if (idx >= 0) {
    all[idx].status = input.approve ? "APPROVED" : "REJECTED";
    all[idx].updatedAt = new Date().toISOString();
    save(all);
  }
  return { ok: true };
}
