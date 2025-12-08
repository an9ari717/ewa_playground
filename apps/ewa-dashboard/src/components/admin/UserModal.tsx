// src/components/admin/UserModal.tsx
import React, { useState } from "react";
import type { Department, UserWithDepartment } from "../../services/departments";

type ModalMode = "create" | "edit";

interface UserModalProps {
  open: boolean;
  mode: ModalMode;
  departments: Department[];
  initialUser?: UserWithDepartment | null;
  onClose: () => void;
  onSubmit: (payload: {
    id?: string;
    name: string;
    email: string;
    role: string;
    departmentId: string | null;
    isActive: boolean;
    password?: string;
  }) => void;
  loading: boolean;
}

const defaultForm = {
  name: "",
  email: "",
  role: "EMPLOYEE",
  departmentId: "",
  isActive: true,
  password: "",
};

export default function UserModal({
  open,
  mode,
  departments,
  initialUser,
  onClose,
  onSubmit,
  loading,
}: UserModalProps) {
  const [form, setForm] = useState(defaultForm);
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (!open) {
      setForm(defaultForm);
      setShowPassword(false);
      return;
    }

    if (mode === "edit" && initialUser) {
      setForm({
        name: initialUser.name || "",
        email: initialUser.email || "",
        role: initialUser.role || "EMPLOYEE",
        departmentId: initialUser.departmentId || "",
        isActive: initialUser.isActive,
        password: "",
      });
    } else {
      setForm(defaultForm);
    }
  }, [open, mode, initialUser]);

  if (!open) return null;

  const title = mode === "create" ? "New User" : "Edit User";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;

    onSubmit({
      id: initialUser?.id,
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      departmentId: form.departmentId || null,
      isActive: form.isActive,
      password: form.password ? form.password : undefined,
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 40,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "var(--card, #ffffff)",
          borderRadius: 18,
          boxShadow: "0 25px 60px rgba(15,23,42,0.25)",
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 600,
                color: "var(--text, #0f172a)",
              }}
            >
              {title}
            </h2>
            <p
              style={{
                margin: 0,
                marginTop: 4,
                fontSize: 13,
                color: "var(--muted, #6b7280)",
              }}
            >
              {mode === "create"
                ? "Create a new account, assign a role and department."
                : "Update the user’s details, role, department, or reset their password."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              width: 30,
              height: 30,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 16,
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gap: 12 }}>
            {/* Name */}
            <div>
              <label
                htmlFor="user-name"
                style={{ display: "block", fontSize: 13, marginBottom: 4 }}
              >
                Name
              </label>
              <input
                id="user-name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Full name"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  fontSize: 14,
                }}
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="user-email"
                style={{ display: "block", fontSize: 13, marginBottom: 4 }}
              >
                Email
              </label>
              <input
                id="user-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="user@example.com"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  fontSize: 14,
                  backgroundColor:
                    mode === "edit" ? "rgba(248,250,252,0.9)" : "#ffffff",
                }}
                disabled={loading || mode === "edit"}
              />
            </div>

            {/* Role + Department */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <label
                  htmlFor="user-role"
                  style={{
                    display: "block",
                    fontSize: 13,
                    marginBottom: 4,
                  }}
                >
                  Role
                </label>
                <select
                  id="user-role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    fontSize: 14,
                    background: "#ffffff",
                  }}
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                  <option value="DIRECTOR">Director</option>
                  <option value="ADMIN">Admin</option>
                  <option value="HR_OFFICER">HR Officer</option>
                  <option value="IT_OFFICER">IT Officer</option>
                  <option value="FINANCE_OFFICER">Finance Officer</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="user-dept"
                  style={{
                    display: "block",
                    fontSize: 13,
                    marginBottom: 4,
                  }}
                >
                  Department
                </label>
                <select
                  id="user-dept"
                  name="departmentId"
                  value={form.departmentId}
                  onChange={handleChange}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    fontSize: 14,
                    background: "#ffffff",
                  }}
                >
                  <option value="">Unassigned</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active checkbox */}
            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                }}
              >
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  disabled={loading}
                />
                Active
              </label>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="user-password"
                style={{
                  display: "block",
                  fontSize: 13,
                  marginBottom: 4,
                }}
              >
                Password{" "}
                <span style={{ color: "#6b7280", fontWeight: 400 }}>
                  {mode === "edit"
                    ? "– leave blank to keep current password"
                    : ""}
                </span>
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <input
                  id="user-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder={mode === "create" ? "Temporary password" : ""}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    fontSize: 14,
                  }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  disabled={loading}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid #e5e7eb",
                    background: "#f9fafb",
                    fontSize: 12,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div
            style={{
              marginTop: 20,
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                fontSize: 14,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !form.name.trim() || !form.email.trim()}
              style={{
                padding: "8px 18px",
                borderRadius: 999,
                border: "none",
                background:
                  loading || !form.name.trim() || !form.email.trim()
                    ? "#94a3b8"
                    : "#0f172a",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 500,
                cursor:
                  loading || !form.name.trim() || !form.email.trim()
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
