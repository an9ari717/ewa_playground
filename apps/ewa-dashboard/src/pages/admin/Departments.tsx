// src/pages/admin/Departments.tsx
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDepartments,
  createDepartment,
  deleteDepartment,
  type Department,
} from "../../services/departments";

export default function AdminDepartments() {
  const queryClient = useQueryClient();

  // ---- Fetch departments ----
  const { data, isLoading, isError, refetch, isFetching } = useQuery<
    Department[]
  >({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
  });

  // ---- Local state for create/edit form ----
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const isEditing = editingId !== null;

  // Create / update (backend does upsert by name)
  const createMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setName("");
      setDescription("");
      setEditingId(null);
      setModalOpen(false);
    },
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    createMutation.mutate({
      name: trimmedName,
      description: description.trim() || undefined,
    });
  }

  function handleNewDepartment() {
    setEditingId(null);
    setName("");
    setDescription("");
    setModalOpen(true);
  }

  function handleEdit(dept: Department) {
    setEditingId(dept.id);
    setName(dept.name);
    setDescription(dept.description ?? "");
    setModalOpen(true);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setName("");
    setDescription("");
    setModalOpen(false);
  }

  function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this department?")) {
      return;
    }
    deleteMutation.mutate(id);
  }

  const saving = createMutation.isPending || deleteMutation.isPending;
  const busy = saving || isFetching;

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
              marginBottom: 4,
              color: "var(--text)",
            }}
          >
            Departments
          </h1>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            View and manage departments for the approvals system.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={busy}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid var(--border)",
              backgroundColor: "var(--card)",
              fontSize: 13,
              cursor: busy ? "not-allowed" : "pointer",
              color: "var(--text)",
            }}
          >
            {busy ? "Refreshing..." : "Refresh"}
          </button>
          <button
            type="button"
            onClick={handleNewDepartment}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: "none",
              background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              boxShadow: "0 10px 25px rgba(37,99,235,0.35)",
            }}
          >
            + New Department
          </button>
        </div>
      </div>

      {/* Departments list */}
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: 18,
          backgroundColor: "var(--card)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 500,
              margin: 0,
              color: "var(--text)",
            }}
          >
            Existing Departments
          </h2>
          {isLoading && (
            <span style={{ fontSize: 13, color: "var(--muted)" }}>
              Loading...
            </span>
          )}
        </div>

        {isError && (
          <p style={{ color: "#f97373" }}>
            Failed to load departments.{" "}
            <button
              type="button"
              onClick={() => refetch()}
              style={{
                border: "none",
                background: "none",
                color: "#60a5fa",
                cursor: "pointer",
                textDecoration: "underline",
                padding: 0,
              }}
            >
              Try again
            </button>
          </p>
        )}

        {!isLoading && !isError && (!data || data.length === 0) && (
          <p style={{ color: "var(--muted)" }}>No departments found yet.</p>
        )}

        {!isLoading && !isError && data && data.length > 0 && (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
              color: "var(--text)",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  Name
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  Description
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px",
                    borderBottom: "1px solid var(--border)",
                    width: 160,
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((dept) => (
                <tr key={dept.id}>
                  <td
                    style={{
                      padding: "8px",
                      borderBottom: "1px solid var(--border)",
                      fontWeight: 500,
                    }}
                  >
                    {dept.name}
                  </td>
                  <td
                    style={{
                      padding: "8px",
                      borderBottom: "1px solid var(--border)",
                      color: "var(--muted)",
                    }}
                  >
                    {dept.description || "—"}
                  </td>
                  <td
                    style={{
                      padding: "8px",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => handleEdit(dept)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 999,
                          border: "1px solid var(--border)",
                          backgroundColor: "var(--card)",
                          fontSize: 13,
                          cursor: "pointer",
                          color: "var(--text)",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(dept.id)}
                        disabled={deleteMutation.isPending}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 999,
                          border: "1px solid #fecaca",
                          backgroundColor: "#fef2f2",
                          color: "#b91c1c",
                          fontSize: 13,
                          cursor: deleteMutation.isPending
                            ? "not-allowed"
                            : "pointer",
                        }}
                      >
                        {deleteMutation.isPending ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {deleteMutation.isError && (
          <p style={{ color: "#f97373", marginTop: 8 }}>
            Failed to delete department. It might still have users assigned.
          </p>
        )}
      </div>

      {/* Create / Edit modal */}
      {modalOpen && (
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
                  {isEditing ? "Edit Department" : "New Department"}
                </h2>
                <p
                  style={{
                    margin: 0,
                    marginTop: 4,
                    fontSize: 13,
                    color: "var(--muted, #6b7280)",
                  }}
                >
                  {isEditing
                    ? "Update the department’s name or description."
                    : "Create a new department for the approvals system."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                style={{
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  width: 30,
                  height: 30,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: saving ? "not-allowed" : "pointer",
                  fontSize: 16,
                  color: "var(--text)",
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label
                  htmlFor="dept-name"
                  style={{
                    display: "block",
                    fontSize: 14,
                    marginBottom: 4,
                    color: "var(--text)",
                  }}
                >
                  Name
                </label>
                <input
                  id="dept-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. HR, IT, Finance"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    fontSize: 14,
                    background: "var(--input-bg)",
                    color: "var(--text)",
                  }}
                  disabled={saving}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label
                  htmlFor="dept-desc"
                  style={{
                    display: "block",
                    fontSize: 14,
                    marginBottom: 4,
                    color: "var(--text)",
                  }}
                >
                  Description (optional)
                </label>
                <textarea
                  id="dept-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Short description of this department"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    resize: "vertical",
                    fontSize: 14,
                    background: "var(--input-bg)",
                    color: "var(--text)",
                  }}
                  disabled={saving}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  alignItems: "center",
                  marginTop: 16,
                }}
              >
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 999,
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--card)",
                    fontSize: 14,
                    cursor: saving ? "not-allowed" : "pointer",
                    color: "var(--text)",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 999,
                    border: "none",
                    fontWeight: 500,
                    cursor:
                      saving || !name.trim() ? "not-allowed" : "pointer",
                    backgroundColor:
                      saving || !name.trim() ? "#94a3b8" : "#0f172a",
                    color: "#ffffff",
                    fontSize: 14,
                  }}
                >
                  {createMutation.isPending
                    ? isEditing
                      ? "Updating..."
                      : "Saving..."
                    : isEditing
                    ? "Update Department"
                    : "Save Department"}
                </button>
              </div>

              {createMutation.isError && (
                <p style={{ color: "#f97373", fontSize: 13, marginTop: 8 }}>
                  Failed to save department.
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
