// src/services/requestTypes.ts
import { api } from "../lib/api";

/** Department reference used on request types */
export type DepartmentRef = {
  id: string;
  name: string;
};

/** Basic request type shape (what /request-types returns) */
export type RequestType = {
  id: string;
  key: string;        // e.g. "LEAVE"
  name: string;       // e.g. "Leave Request"
  code: string;       // e.g. "LV"
  departmentId: string | null;
  createdAt: string;
  updatedAt: string;
  department: DepartmentRef | null;
};

/** Alias kept for the Admin Request Types page */
export type RequestTypeRow = RequestType;

/** --- OLD endpoint for basic admin request types list --- */
export async function fetchRequestTypes(): Promise<RequestTypeRow[]> {
  const res = await api.get<RequestTypeRow[]>("/request-types");
  return res.data;
}

/** Payload for updating the department of a request type */
export type UpdateRequestTypeDepartmentInput = {
  id: string;
  departmentId: string | null | undefined;
};

/** PATCH /request-types/:id — assign/clear department */
export async function updateRequestTypeDepartment(
  input: UpdateRequestTypeDepartmentInput
): Promise<RequestTypeRow> {
  const { id, departmentId } = input;

  const res = await api.patch<RequestTypeRow>(`/request-types/${id}`, {
    departmentId: departmentId ?? null,
  });

  return res.data;
}

/* ============================================================
   APPROVAL STEPS TYPES
   ============================================================ */
export type ApprovalStep = {
  id: string;
  typeId: string;
  order: number;
  requiredRole: string; // "MANAGER" | "DIRECTOR" | "ADMIN"
  name: string;
  createdAt: string;
  updatedAt: string;
};

/** Request type + its department + ordered steps (from /request-types/with-steps) */
export type RequestTypeWithSteps = RequestType & {
  steps: ApprovalStep[];
};

/* ============================================================
   GET all types WITH steps (main screen)
   ============================================================ */
export async function fetchRequestTypesWithSteps(): Promise<RequestTypeWithSteps[]> {
  const res = await api.get<RequestTypeWithSteps[]>("/request-types/with-steps");
  return res.data;
}

/* ============================================================
   GET steps for one type
   GET /request-types/:id/steps
   ============================================================ */
export async function fetchStepsForType(typeId: string): Promise<ApprovalStep[]> {
  const res = await api.get<ApprovalStep[]>(`/request-types/${typeId}/steps`);
  return res.data;
}

/* ============================================================
   CREATE a step
   POST /request-types/:id/steps
   ============================================================ */
export type CreateStepInput = {
  requiredRole: string; // MANAGER | DIRECTOR | ADMIN
  name?: string;
};

export async function createStep(
  typeId: string,
  input: CreateStepInput
): Promise<ApprovalStep> {
  const res = await api.post<ApprovalStep>(`/request-types/${typeId}/steps`, input);
  return res.data;
}

/* ============================================================
   UPDATE a step
   PATCH /request-types/:id/steps/:stepId
   ============================================================ */
export type UpdateStepInput = {
  order?: number;
  name?: string;
  requiredRole?: string;
};

export async function updateStep(
  typeId: string,
  stepId: string,
  input: UpdateStepInput
): Promise<ApprovalStep> {
  const res = await api.patch<ApprovalStep>(
    `/request-types/${typeId}/steps/${stepId}`,
    input
  );
  return res.data;
}

/* ============================================================
   DELETE a step
   DELETE /request-types/:id/steps/:stepId
   ============================================================ */
export async function deleteStep(
  typeId: string,
  stepId: string
): Promise<{ ok: boolean }> {
  const res = await api.delete<{ ok: boolean }>(
    `/request-types/${typeId}/steps/${stepId}`
  );
  return res.data;
}
