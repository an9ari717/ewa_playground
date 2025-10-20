// src/lib/dto.ts
import { z } from "zod";

export const UserZ = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["EMPLOYEE", "MANAGER", "DIRECTOR", "ADMIN"]),
});

export const RequestZ = z.object({
  id: z.string(),
  title: z.string(),
  type: z.string(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "ARCHIVED"]),
  currentStage: z.enum(["MANAGER", "DIRECTOR", "ADMIN"]).nullable(),
  createdAt: z.string(), // ISO date string
  createdBy: UserZ.pick({ id: true, name: true }),
});

export const HistoryItemZ = z.object({
  step: z.string(),
  by: z.string().nullable(),
  role: z.string().nullable(),
  date: z.string(), // ISO date string
  comment: z.string().nullable(),
});

export const PaginatedZ = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
  });

// handy TS types
export type User = z.infer<typeof UserZ>;
export type RequestDTO = z.infer<typeof RequestZ>;
export type HistoryItem = z.infer<typeof HistoryItemZ>;
