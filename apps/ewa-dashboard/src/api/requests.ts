import { api } from "./client";
import type { Role } from "../auth/store";

export type RequestItem = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
};

export const listInbox = async (role: Role, userId: string, email?: string) => {
  const params: Record<string, string> = { role, userId };
  if (email) params.by = email; // some backends accept ?by=<email>
  return (await api.get<RequestItem[]>("/inbox", { params })).data;
};

export const approve = async (id: string, comment?: string) =>
  (
    await api.patch(`/requests/${encodeURIComponent(id)}/status`, {
      approved: true,
      comment,
    })
  ).data;

export const reject = async (id: string, comment?: string) =>
  (
    await api.patch(`/requests/${encodeURIComponent(id)}/status`, {
      approved: false,
      comment,
    })
  ).data;

/** Try a few likely endpoints for request details. */
export const getRequestById = async (
  id: string,
  role: Role,
  userId: string,
  email?: string
) => {
  const params: Record<string, string> = { role, userId };
  if (email) params.by = email;

  const tried: Array<{ path: string; status?: number }> = [];

  const tryGet = async (path: string) => {
    try {
      return (await api.get(path, { params })).data;
    } catch (err: any) {
      tried.push({
        path,
        status: err?.response?.status,
      });
      throw err;
    }
  };

  try {
    return await tryGet(`/requests/${encodeURIComponent(id)}`);
  } catch {}
  try {
    return await tryGet(`/inbox/${encodeURIComponent(id)}`);
  } catch {}
  try {
    return await tryGet(`/approvals/${encodeURIComponent(id)}`);
  } catch {}

  const e: any = new Error("details not found");
  e._debug = { tried, params };
  throw e;
};
