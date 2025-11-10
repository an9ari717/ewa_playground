// src/lib/dto.ts
import { z } from "zod";

export const UserZ = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["EMPLOYEE", "MANAGER", "DIRECTOR", "ADMIN"]),
});

// Keep extra fields like payload/from/to/details instead of stripping them
export const RequestZ = z
  .object({
    id: z.string(),
    title: z.string(),
    type: z.string(),
    status: z.enum([
      "PENDING",
      "IN_REVIEW",
      "APPROVED",
      "REJECTED",
      "COMPLETED",
      "ARCHIVED",
    ]),
    currentStage: z.enum(["MANAGER", "DIRECTOR", "ADMIN"]).nullable(),
    createdAt: z.string(),

    // include email in case UI reads it
    createdBy: UserZ.pick({ id: true, name: true, email: true }).partial({ name: true }),

    // Optional helpers that may come from API at top-level
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),

    // Flexible containers used by different endpoints
    payload: z.record(z.string(), z.any()).optional(),
    details: z.record(z.string(), z.any()).optional(),
  })
  .passthrough();

export const HistoryItemZ = z.object({
  step: z.string(),
  by: z.string().nullable(),
  role: z.string().nullable(),
  date: z.string(),
  comment: z.string().nullable(),
});

export const PaginatedZ = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
  });

export type User = z.infer<typeof UserZ>;
export type RequestDTO = z.infer<typeof RequestZ>;
export type HistoryItem = z.infer<typeof HistoryItemZ>;
