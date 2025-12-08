// src/pages/admin/Users.tsx
import React, { useMemo, useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { Pill, type PillColor } from "../../components/ui/Pill";
import { AvatarCircle } from "../../components/ui/AvatarCircle";
import UserModal from "../../components/admin/UserModal";
import DataToolbar from "../../components/ui/DataToolbar";

import {
  fetchDepartments,
  fetchUsers,
  assignUserDepartment,
  createUser,
  updateUser,
  deleteUser,
  type Department,
  type UserWithDepartment,
  type CreateUserPayload,
} from "../../services/departments";

/* ---------------------------------------------------------
   Helper for role → pill color
   --------------------------------------------------------- */

function roleColor(role: string): PillColor {
  const r = role.toUpperCase();
  if (r === "EMPLOYEE") return "green";
  if (r === "MANAGER") return "blue";
  if (r === "DIRECTOR") return "purple";
  if (r === "ADMIN") return "red";
  if (r === "HR_OFFICER") return "purple"; // HR specialized role
  if (r === "IT_OFFICER") return "blue"; // IT specialized role
  if (r === "FINANCE_OFFICER") return "green"; // Finance/Procurement specialized role
  return "gray";
}

/* ---------------------------------------------------------
   Main AdminUsers page
   --------------------------------------------------------- */

export default function AdminUsers() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] =
    useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<UserWithDepartment | null>(null);

  const {
    data: users,
    isLoading: loadingUsers,
    isError: usersError,
  } = useQuery<UserWithDepartment[]>({
    queryKey: ["admin-users"],
    queryFn: fetchUsers,
  });

  const {
    data: departments,
    isLoading: loadingDepts,
    isError: deptsError,
  } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
  });

  const deptOptions = useMemo(
    () =>
      (departments ?? []).map((d) => ({
        value: d.id,
        label: d.name,
      })),
    [departments]
  );

  const assignMutation = useMutation({
    mutationFn: assignUserDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setModalOpen(false);
      setEditing(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setModalOpen(false);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const busyUserId =
    assignMutation.isPending && (assignMutation.variables as any)?.userId;
  const deletingUserId =
    deleteMutation.isPending && (deleteMutation.variables as any);

  // Reset to first page when filters/search change
  React.useEffect(() => {
    setPage(1);
  }, [search, roleFilter, deptFilter, statusFilter]);

  const filteredUsers = useMemo(() => {
    let list = users ?? [];

    if (search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s)
      );
    }

    if (roleFilter !== "ALL") {
      list = list.filter(
        (u) => u.role.toUpperCase() === roleFilter.toUpperCase()
      );
    }

    if (deptFilter !== "ALL") {
      list = list.filter((u) => (u.departmentId ?? "") === deptFilter);
    }

    if (statusFilter === "ACTIVE") {
      list = list.filter((u) => u.isActive);
    } else if (statusFilter === "INACTIVE") {
      list = list.filter((u) => !u.isActive);
    }

    return list;
  }, [users, search, roleFilter, deptFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pagedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  const handleNewUser = () => {
    setModalMode("create");
    setEditing(null);
    setModalOpen(true);
  };

  const handleEditUser = (u: UserWithDepartment) => {
    setModalMode("edit");
    setEditing(u);
    setModalOpen(true);
  };

  const handleModalSubmit = (payload: {
    id?: string;
    name: string;
    email: string;
    role: string;
    departmentId: string | null;
    isActive: boolean;
    password?: string;
  }) => {
    if (modalMode === "edit" && editing) {
      updateMutation.mutate({
        id: editing.id,
        name: payload.name,
        role: payload.role,
        departmentId: payload.departmentId,
        isActive: payload.isActive,
        password: payload.password,
      });
    } else {
      createMutation.mutate({
        name: payload.name,
        email: payload.email,
        role: payload.role,
        departmentId: payload.departmentId,
        isActive: payload.isActive,
        password: payload.password,
      });
    }
  };

  const loadingAny =
    loadingUsers || loadingDepts || assignMutation.isPending;

  const handleDeleteUser = (u: UserWithDepartment) => {
    const ok = window.confirm(
      `Delete user "${u.name}"? This is only allowed if they are not used in any requests.\n\nOtherwise you should mark them as inactive instead.`
    );
    if (!ok) return;

    deleteMutation.mutate(u.id);
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "center",
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
              marginBottom: 4,
              color: "var(--text, #0f172a)",
            }}
          >
            Users &amp; Departments
          </h1>
          <p
            style={{
              margin: 0,
              color: "var(--muted, #64748b)",
              fontSize: 14,
            }}
          >
            View all users in the system, assign them to departments, and
            manage their roles.
          </p>
        </div>

        <button
          type="button"
          onClick={handleNewUser}
          style={{
            padding: "8px 18px",
            borderRadius: 999,
            border: "none",
            background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
            color: "#ffffff",
            fontWeight: 500,
            fontSize: 14,
            cursor: "pointer",
            boxShadow: "0 10px 25px rgba(37,99,235,0.35)",
          }}
        >
          + New User
        </button>
      </div>

      {/* Search + filters row (now using reusable toolbar) */}
      <DataToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or email…"
      >
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            width: 180,
            padding: "8px 12px",
            borderRadius: 999,
            border: "1px solid var(--border, #e5e7eb)",
            fontSize: 14,
            background: "var(--card, #ffffff)",
            color: "var(--text, #0f172a)",
          }}
        >
          <option value="ALL">All roles</option>
          <option value="EMPLOYEE">Employee</option>
          <option value="MANAGER">Manager</option>
          <option value="DIRECTOR">Director</option>
          <option value="ADMIN">Admin</option>
          <option value="HR_OFFICER">HR Officer</option>
          <option value="IT_OFFICER">IT Officer</option>
          <option value="FINANCE_OFFICER">Finance Officer</option>
        </select>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          style={{
            width: 160,
            padding: "8px 12px",
            borderRadius: 999,
            border: "1px solid var(--border, #e5e7eb)",
            fontSize: 14,
            background: "var(--card, #ffffff)",
            color: "var(--text, #0f172a)",
          }}
        >
          <option value="ALL">All departments</option>
          {(departments ?? []).map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")
          }
          style={{
            width: 140,
            padding: "8px 12px",
            borderRadius: 999,
            border: "1px solid var(--border, #e5e7eb)",
            fontSize: 14,
            background: "var(--card, #ffffff)",
            color: "var(--text, #0f172a)",
          }}
        >
          <option value="ALL">Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </DataToolbar>

      {(usersError || deptsError) && (
        <p style={{ color: "#f97373", marginBottom: 12 }}>
          Failed to load data. Please try again.
        </p>
      )}

      {loadingUsers || loadingDepts ? (
        <p style={{ color: "var(--text)" }}>Loading users and departments…</p>
      ) : !filteredUsers || filteredUsers.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No users found.</p>
      ) : (
        <div
          style={{
            border: "1px solid var(--border, #e5e7eb)",
            borderRadius: 12,
            background: "var(--card, #ffffff)",
            boxShadow: "0 8px 30px rgba(15,23,42,0.08)",
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
              color: "var(--text, #0f172a)",
            }}
          >
            <thead
              style={{
                background: "var(--table-header, rgba(148,163,184,0.08))",
              }}
            >
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--border, #e5e7eb)",
                    fontWeight: 500,
                  }}
                >
                  Name
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--border, #e5e7eb)",
                    fontWeight: 500,
                  }}
                >
                  Email
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--border, #e5e7eb)",
                    fontWeight: 500,
                  }}
                >
                  Role
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--border, #e5e7eb)",
                    fontWeight: 500,
                  }}
                >
                  Department
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--border, #e5e7eb)",
                    fontWeight: 500,
                    width: 120,
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--border, #e5e7eb)",
                    fontWeight: 500,
                    width: 180,
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map((u) => (
                <tr key={u.id}>
                  <td
                    style={{
                      padding: "10px 14px",
                      borderBottom:
                        "1px solid var(--border-subtle, rgba(148,163,184,0.5))",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <AvatarCircle name={u.name || u.email} />
                      <span style={{ fontWeight: 500 }}>{u.name}</span>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      borderBottom:
                        "1px solid var(--border-subtle, rgba(148,163,184,0.5))",
                      color: "var(--muted, #6b7280)",
                    }}
                  >
                    {u.email}
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      borderBottom:
                        "1px solid var(--border-subtle, rgba(148,163,184,0.5))",
                    }}
                  >
                    <Pill color={roleColor(u.role)}>
                      {u.role.charAt(0).toUpperCase() +
                        u.role.slice(1).toLowerCase()}
                    </Pill>
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      borderBottom:
                        "1px solid var(--border-subtle, rgba(148,163,184,0.5))",
                    }}
                  >
                    <select
                      value={u.departmentId ?? ""}
                      onChange={(e) => {
                        const deptId = e.target.value;
                        if (!deptId) return;
                        assignMutation.mutate({
                          userId: u.id,
                          departmentId: deptId,
                        });
                      }}
                      disabled={assignMutation.isPending || loadingAny}
                      style={{
                        padding: "6px 8px",
                        borderRadius: 999,
                        border: "1px solid var(--border, #e5e7eb)",
                        minWidth: 140,
                        background: "var(--card, #ffffff)",
                        color: "var(--text, #0f172a)",
                      }}
                    >
                      <option value="">
                        {u.department?.name ?? "Unassigned"}
                      </option>
                      {deptOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {busyUserId === u.id && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 12,
                          color: "var(--muted, #6b7280)",
                        }}
                      >
                        Saving…
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      borderBottom:
                        "1px solid var(--border-subtle, rgba(148,163,184,0.5))",
                    }}
                  >
                    <Pill color={u.isActive ? "green" : "red"}>
                      {u.isActive ? "Active" : "Inactive"}
                    </Pill>
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      borderBottom:
                        "1px solid var(--border-subtle, rgba(148,163,184,0.5))",
                      textAlign: "right",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleEditUser(u)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 999,
                          border: "1px solid var(--border, #e5e7eb)",
                          background: "var(--card, #ffffff)",
                          fontSize: 13,
                          cursor: "pointer",
                          color: "var(--text, #0f172a)",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u)}
                        disabled={deleteMutation.isPending}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 999,
                          border: "1px solid #fecaca",
                          background: "#fef2f2",
                          fontSize: 13,
                          color: "#b91c1c",
                          cursor: deleteMutation.isPending
                            ? "not-allowed"
                            : "pointer",
                        }}
                      >
                        {deletingUserId === u.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 14px",
              borderTop: "1px solid var(--border, #e5e7eb)",
              background: "var(--card, #ffffff)",
              fontSize: 13,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ color: "var(--muted, #6b7280)" }}>
                Rows per page
              </span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const newSize = parseInt(e.target.value, 10) || 10;
                  setPageSize(newSize);
                  setPage(1);
                }}
                style={{
                  padding: "4px 8px",
                  borderRadius: 999,
                  border: "1px solid var(--border, #e5e7eb)",
                  background: "var(--card, #ffffff)",
                  color: "var(--text, #0f172a)",
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div style={{ color: "var(--muted, #6b7280)" }}>
              {filteredUsers.length === 0
                ? "No results"
                : `Showing ${startIndex + 1}–${Math.min(
                    startIndex + pageSize,
                    filteredUsers.length
                  )} of ${filteredUsers.length}`}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid var(--border, #e5e7eb)",
                  background: "var(--card, #ffffff)",
                  cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                  color: "var(--text, #0f172a)",
                }}
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() =>
                  setPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage >= totalPages}
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid var(--border, #e5e7eb)",
                  background: "var(--card, #ffffff)",
                  cursor:
                    currentPage >= totalPages ? "not-allowed" : "pointer",
                  color: "var(--text, #0f172a)",
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      <UserModal
        open={modalOpen}
        mode={modalMode}
        departments={departments ?? []}
        initialUser={editing}
        onClose={() => {
          if (createMutation.isPending || updateMutation.isPending) return;
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={handleModalSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
