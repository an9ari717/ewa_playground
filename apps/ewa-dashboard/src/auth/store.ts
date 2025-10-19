import { create } from "zustand";

export type Role = "EMPLOYEE" | "MANAGER" | "DIRECTOR" | "ADMIN";

type AuthState = {
  role: Role | null;
  userId: string | null;
  email: string | null;
  setRole: (r: Role | null) => void;
  setUserId: (id: string | null) => void;
  setEmail: (e: string | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  role: "MANAGER",
  userId: null,
  email: null,
  setRole: (role) => set({ role }),
  setUserId: (userId) => set({ userId }),
  setEmail: (email) => set({ email }),
}));
