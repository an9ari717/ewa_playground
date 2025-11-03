// src/hooks/useRequests.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { qk } from "../lib/queryKeys";
import { api } from "../lib/api";
import {
  fetchRequests,
  fetchRequest,
  fetchHistory,
  createRequest,
} from "../services/requests";
import { useAuth } from "../store/auth";

// ---------- Lists (inbox / my / archive) ----------
export function useRequests(
  box: "inbox" | "my" | "archive",
  role?: string,
  page = 1,
  pageSize = 10,
  status?: string
) {
  return useQuery({
    queryKey: qk.requests(box, role, page, pageSize, status),
    queryFn: () => fetchRequests({ box, role, page, pageSize, status }),
    placeholderData: keepPreviousData,
  });
}

// ---------- Single request ----------
export function useRequest(id: string) {
  return useQuery({
    queryKey: qk.request(id),
    queryFn: () => fetchRequest(id),
    enabled: !!id,
  });
}

// ---------- History ----------
export function useRequestHistory(id: string) {
  return useQuery({
    queryKey: qk.history(id),
    queryFn: () => fetchHistory(id),
    enabled: !!id,
  });
}

// ---------- Approve / Reject ----------
export function useApproveReject(id: string) {
  const qc = useQueryClient();
  const { me } = useAuth();

  return useMutation({
    mutationFn: async (payload: { approved: boolean; comment?: string }) => {
      if (!id) throw new Error("Missing request id");

      // Fallback so backend recognizes the actor even if headers fail
      const by = me?.email ? `?by=${encodeURIComponent(me.email)}` : "";

      const { data } = await api.patch(`/requests/${id}/status${by}`, {
        approved: payload.approved,
        comment: payload.comment ?? null,
      });
      return data;
    },
    onSuccess: () => {
      // Detail + history
      qc.invalidateQueries({ queryKey: qk.request(id) });
      qc.invalidateQueries({ queryKey: qk.history(id) });

      // 🔁 Broadly invalidate ALL request list queries (any box/role/page)
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === "requests",
      });
    },
  });
}

// ---------- Create request ----------
export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title: string; type: string; details?: any }) =>
      createRequest(payload),
    onSuccess: () => {
      // Broadly refresh lists after creating
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === "requests",
      });
    },
  });
}
