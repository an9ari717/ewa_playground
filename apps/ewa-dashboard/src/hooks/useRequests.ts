// src/hooks/useRequests.ts
import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../store/auth";
import {
  fetchRequests,
  fetchRequest,
  fetchHistory,
  mutateStatus,
  type RequestsResult,
} from "../services/requests";

/**
 * Shared hook for:
 * - "my"      → requests created by current user
 * - "inbox"   → requests assigned TO current user via RequestAssignee
 * - "archive" → completed / rejected / archived
 *
 * NOTE:
 * 🔥 inbox is controlled by the BACKEND using req.actor + RequestAssignee
 *    so we DO NOT send role or userId here anymore.
 */
export function useRequests(
  box: "inbox" | "my" | "archive",
  _roleOverride?: string, // not needed anymore for filtering
  page = 1,
  pageSize = 10,
  status?: string
) {
  const me = useAuth((s) => s.me);

  const { data, isLoading, isError, isFetching, refetch } =
    useQuery<RequestsResult>({
      queryKey: ["requests", box, me?.id, page, pageSize, status],
      queryFn: () =>
        fetchRequests({
          box,
          page,
          pageSize,
          status,
        }),
      enabled: !!me,
      staleTime: 5_000,
    });

  const items = useMemo(() => data?.items ?? [], [data]);

  return {
    data: data ?? { items: [], page, pageSize, total: 0 },
    items,
    isLoading,
    isError,
    isFetching,
    refetch,
  };
}

/* ----------------------------------------------------
 * RequestDetails helpers
 * ---------------------------------------------------- */

export function useRequest(id: string | undefined) {
  return useQuery({
    queryKey: ["request", id],
    enabled: !!id,
    queryFn: () => fetchRequest(id as string),
  });
}

export function useRequestHistory(id: string | undefined) {
  return useQuery({
    queryKey: ["request-history", id],
    enabled: !!id,
    queryFn: () => fetchHistory(id as string),
  });
}

/**
 * Approve / Reject mutation
 */
export function useApproveReject(id: string | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: { approved: boolean; comment?: string }) => {
      if (!id) throw new Error("Missing request id");
      return mutateStatus(id, payload);
    },
    onSuccess: () => {
      if (!id) return;
      qc.invalidateQueries({ queryKey: ["request", id] });
      qc.invalidateQueries({ queryKey: ["request-history", id] });
      qc.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}
