// src/hooks/useRequests.ts
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { fetchRequests, fetchRequest, fetchHistory, mutateStatus } from "../services/requests";
import { qk } from "../lib/queryKeys";

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
    placeholderData: keepPreviousData, // ✅ v5 way to keep previous page data
  });
}

export function useRequest(id: string) {
  return useQuery({
    queryKey: qk.request(id),
    queryFn: () => fetchRequest(id),
    enabled: !!id,
  });
}

export function useRequestHistory(id: string) {
  return useQuery({
    queryKey: qk.history(id),
    queryFn: () => fetchHistory(id),
    enabled: !!id,
  });
}

export function useApproveReject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { approved: boolean; comment?: string }) =>
      mutateStatus(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.request(id) });
      qc.invalidateQueries({ queryKey: qk.requests("inbox") });
      qc.invalidateQueries({ queryKey: qk.requests("my") });
      qc.invalidateQueries({ queryKey: qk.requests("archive") });
      qc.invalidateQueries({ queryKey: qk.history(id) });
    },
  });
}
import { createRequest } from "../services/requests";

export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title: string; type: string; details?: any }) =>
      createRequest(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.requests("my") });
      qc.invalidateQueries({ queryKey: qk.requests("inbox") });
      qc.invalidateQueries({ queryKey: qk.requests("archive") });
    },
  });
}
