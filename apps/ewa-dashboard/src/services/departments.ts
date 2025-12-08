// src/services/departments.ts
import { api } from "../lib/api";

/* ============================================================
   Types
   ============================================================ */

export interface Department {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithDepartment {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  departmentId: string | null;
  department: Department | null;
}

/** Role type is optional, but handy for the admin forms */
export type UserRole = "EMPLOYEE" | "MANAGER" | "DIRECTOR" | "ADMIN";

export interface CreateUserPayload {
  name: string;
  email: string;
  role: UserRole | string;
  departmentId?: string | null;
  isActive?: boolean;
  /** Optional – if backend supports admin-set password */
  password?: string;
}

export interface UpdateUserPayload {
  id: string;
  name?: string;
  role?: UserRole | string;
  departmentId?: string | null;
  isActive?: boolean;
  /** Optional – for reset/change password use cases */
  password?: string;
}

/* ============================================================
   Department CRUD
   ============================================================ */

export async function fetchDepartments(): Promise<Department[]> {
  const res = await api.get<Department[]>("/departments");
  return res.data;
}

// Used for both create + update (backend does upsert by name)
export async function createDepartment(payload: {
  name: string;
  description?: string | null;
}): Promise<Department> {
  const res = await api.post<Department>("/departments", payload);
  return res.data;
}

export async function deleteDepartment(id: string): Promise<void> {
  await api.delete(`/departments/${id}`);
}

/* ============================================================
   Users (admin)
   ============================================================ */

export async function fetchUsers(): Promise<UserWithDepartment[]> {
  // Note: user list is behind /api/users (usersRouter)
  const res = await api.get<UserWithDepartment[]>("/api/users", {
    params: { _ts: Date.now() },
  });
  return res.data;
}

/**
 * Admin: create a new user (name, email, role, department, etc.)
 * Backend endpoint: POST /api/users
 */
export async function createUser(
  payload: CreateUserPayload
): Promise<UserWithDepartment> {
  const res = await api.post<UserWithDepartment>("/api/users", payload);
  return res.data;
}

/**
 * Admin: update an existing user (role, department, active flag, etc.)
 * Backend endpoint: PATCH /api/users/:id
 */
export async function updateUser(
  payload: UpdateUserPayload
): Promise<UserWithDepartment> {
  const { id, ...data } = payload;
  const res = await api.patch<UserWithDepartment>(`/api/users/${id}`, data);
  return res.data;
}

/**
 * Admin: delete user (only works if backend says user is not referenced)
 * Backend endpoint: DELETE /api/users/:id
 */
export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/api/users/${id}`);
}

/**
 * Admin: assign / change department for a user
 * Note: department assignment route is at /users/:id/department (no /api prefix)
 */
export async function assignUserDepartment(payload: {
  userId: string;
  departmentId: string;
}): Promise<UserWithDepartment> {
  const { userId, departmentId } = payload;

  const res = await api.patch<UserWithDepartment>(
    `/users/${userId}/department`,
    { departmentId }
  );

  return res.data;
}
