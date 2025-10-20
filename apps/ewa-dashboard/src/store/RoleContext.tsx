import React, { createContext, useContext, useState } from "react";
import type { UserRole } from "../lib/roles";

type RoleState = {
  role: UserRole;
  setRole: (r: UserRole) => void;
  email?: string;
  setEmail: (e?: string) => void;
  userId?: string;
  setUserId: (id?: string) => void;
};

const RoleContext = createContext<RoleState | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>("EMPLOYEE");
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  return (
    <RoleContext.Provider value={{ role, setRole, email, setEmail, userId, setUserId }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within <RoleProvider>");
  return ctx;
}
