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
import { getUserEmail } from "../lib/session";

// ---------- Lists (inbox / my / archive) ----------
export function useRequests(
  box: "inbox" | "my" | "archive",
  role?: string,
  page = 1,
  pageSize = 10,
  status?: string
) {
  const me = useAuth((s) => s.me);

  // ✅ LocalStorage fallback in case Zustand hasn't hydrated yet
  let localMe: any;
  try {
    const raw = localStorage.getItem("ewa.user");
    if (raw) localMe = JSON.parse(raw);
  } catch {}

  const effectiveRole = (role ?? me?.role ?? localMe?.role) || undefined;
  const userId = me?.id ?? localMe?.id ?? undefined;
  const emailFallback = getUserEmail() || localMe?.email || undefined;

  // Enable if:
  // - not inbox → always true
  // - inbox → role + either userId or email
  const enabled =
    box === "inbox" ? !!effectiveRole && (!!userId || !!emailFallback) : true;

  // Build query key safely (max 5 args per helper)
  const identityKey = userId || emailFallback || "anon";

  return useQuery({
    queryKey: [
      ...qk.requests(box, effectiveRole, page, pageSize, status),
      identityKey, // append manually instead of passing to qk
    ],
    queryFn: () =>
      fetchRequests({
        box,
        role: effectiveRole,
        userId,
        page,
        pageSize,
        status,
      }),
    placeholderData: keepPreviousData,
    enabled,
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
  const me = useAuth((s) => s.me);

  return useMutation({
    mutationFn: async (payload: { approved: boolean; comment?: string }) => {
      if (!id) throw new Error("Missing request id");

      // fallback identity in query param
      const by = me?.email ? `?by=${encodeURIComponent(me.email)}` : "";

      const { data } = await api.patch(`/requests/${id}/status${by}`, {
        approved: payload.approved,
        comment: payload.comment ?? null,
      });
      return data;
    },
    onSuccess: () => {
      // Invalidate detail + history
      qc.invalidateQueries({ queryKey: qk.request(id) });
      qc.invalidateQueries({ queryKey: qk.history(id) });

      // Invalidate all lists (inbox/my/archive)
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
    mutationFn: (payload: {
      title: string;
      type: string;
      details?: any;
      from?: string;
      to?: string;
    }) => createRequest(payload),
    onSuccess: () => {
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === "requests",
      });
    },
  });
}
