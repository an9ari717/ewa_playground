// src/lib/queryKeys.ts
export const qk = {
  me: ["me"] as const,
  requests: (
    box: "inbox" | "my" | "archive",
    role?: string,
    page = 1,
    pageSize = 10,
    status?: string
  ) => ["requests", { box, role, page, pageSize, status }] as const,
  request: (id: string) => ["request", id] as const,
  history: (id: string) => ["request-history", id] as const,
};
