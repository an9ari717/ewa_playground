// src/services/auth.ts
export type Me = {
  id: string;
  name: string;
  email: string;
  role: "EMPLOYEE" | "MANAGER" | "DIRECTOR" | "ADMIN";
};

// temporary mock user so the app can render without backend /me
export async function fetchMe(): Promise<Me> {
  return Promise.resolve({
    id: "demo-user-1",
    name: "Demo Employee",
    email: "employee@demo.local",
    role: "EMPLOYEE",
  });
}
