// src/services/adminUsers.ts
import { api } from "../lib/api";

export interface UserWithDepartment {
  id: string;
  email: string;
  name: string;
  role: "EMPLOYEE" | "MANAGER" | "DIRECTOR" | "ADMIN";
  isActive: boolean;
  departmentId: string | null;
  department: {
    id: string;
    name: string;
  } | null;
}

// GET list of users (admin only)
export async function fetchUsers(): Promise<UserWithDepartment[]> {
  const res = await api.get<UserWithDepartment[]>("/api/users");
  return res.data;
}

// PATCH /users/:id/department  (admin only)
export async function assignUserDepartment(params: {
  userId: string;
  departmentId: string;
}): Promise<UserWithDepartment> {
  const res = await api.patch<UserWithDepartment>(
    `/users/${params.userId}/department`,
    { departmentId: params.departmentId }
  );
  return res.data;
}
