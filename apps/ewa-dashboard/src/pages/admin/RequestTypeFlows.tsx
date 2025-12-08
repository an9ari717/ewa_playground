// src/pages/admin/RequestTypeFlows.tsx
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  fetchRequestTypesWithSteps,
  type RequestTypeWithSteps,
  createStep,
  deleteStep,
} from "../../services/requestTypes";
import {
  fetchDepartments,
  type Department,
} from "../../services/departments";

import { Pill, type PillColor } from "../../components/ui/Pill";

// --- helpers --------------------------------------------------

function roleColor(role: string): PillColor {
  const r = role.toUpperCase();
  if (r === "MANAGER") return "blue";
  if (r === "DIRECTOR") return "purple";
  if (r === "ADMIN") return "red";
  if (r === "HR_OFFICER") return "green";
  if (r === "IT_OFFICER") return "blue";
  if (r === "FINANCE_OFFICER") return "green";
  return "gray";
}

function roleLabel(role: string): string {
  const r = role.toUpperCase();
  if (r === "MANAGER") return "Manager";
  if (r === "DIRECTOR") return "Director";
  if (r === "ADMIN") return "Admin";
  if (r === "HR_OFFICER") return "HR Officer";
  if (r === "IT_OFFICER") return "IT Officer";
  if (r === "FINANCE_OFFICER") return "Finance Officer";
  return r;
}

// --- TypeCard: inner white card with the steps ----------------

type TypeCardProps = {
  type: RequestTypeWithSteps;
  departments?: Department[];
};

function TypeCard({ type, departments }: TypeCardProps) {
  const queryClient = useQueryClient();

  const [newRole, setNewRole] = React.useState<string>("MANAGER");
  const [newName, setNewName] = React.useState<string>("");
  const [deptChoice, setDeptChoice] = React.useState<string>("requester"); // "requester" | departmentId

  const addStepMutation = useMutation({
    mutationFn: async () => {
      const trimmed = newName.trim();

      // Choose a friendly auto-name if admin leaves it empty
      let autoName = trimmed;
      if (!autoName) {
        let deptLabel = "Requester Dept";
        if (deptChoice !== "requester") {
          const d = departments?.find((x) => x.id === deptChoice);
          if (d) deptLabel = d.name;
        }
        autoName = `${deptLabel} • ${roleLabel(newRole)}`;
      }

      return createStep(type.id, {
        requiredRole: newRole,
        name: autoName,
        // NOTE: later we can add department information to the backend payload
      });
    },
    onSuccess: () => {
      setNewName("");
      queryClient.invalidateQueries({ queryKey: ["request-types-with-steps"] });
    },
  });

  const deleteStepMutation = useMutation({
    mutationFn: async (stepId: string) => {
      return deleteStep(type.id, stepId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["request-types-with-steps"] });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error ||
        "Failed to delete step. It may already be used by existing approvals.";
      window.alert(msg);
    },
  });

  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole || addStepMutation.isPending) return;
    addStepMutation.mutate();
  };

  const handleDeleteStep = (stepId: string) => {
    if (!window.confirm("Delete this step?")) return;
    deleteStepMutation.mutate(stepId);
  };

  const adding = addStepMutation.isPending;
  const deleting = deleteStepMutation.isPending;

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 18,
        padding: 18,
        background: "var(--card)",
        boxShadow: "0 10px 28px rgba(15,23,42,0.16)",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 18,
              margin: 0,
              color: "var(--text)",
            }}
          >
            {type.name}
          </h2>
          <div
            style={{
              fontSize: 13,
              color: "var(--muted)",
              marginTop: 4,
            }}
          >
            <span>Key: {type.key}</span>
            <span style={{ margin: "0 6px" }}>•</span>
            <span>Code: {type.code}</span>
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--muted)",
              marginTop: 4,
            }}
          >
            Department:{" "}
            <strong style={{ color: "var(--text)" }}>
              {type.department?.name || "Not assigned"}
            </strong>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 4,
            minWidth: 120,
          }}
        >
          <span
            style={{
              fontSize: 12,
              padding: "3px 11px",
              borderRadius: 999,
              border: "1px solid var(--border)",
              background: "var(--bg-soft, rgba(148,163,184,0.08))",
              color: "var(--muted)",
            }}
          >
            {type.steps.length === 0
              ? "No steps yet"
              : `${type.steps.length} step${
                  type.steps.length > 1 ? "s" : ""
                } in flow`}
          </span>
        </div>
      </div>

      {/* Steps list */}
      <div>
        <h3
          style={{
            margin: "10px 0 10px",
            fontSize: 15,
            color: "var(--text)",
          }}
        >
          Approval Steps
        </h3>

        {type.steps.length === 0 && (
          <div
            style={{
              fontSize: 13,
              color: "var(--muted)",
              marginBottom: 12,
              lineHeight: 1.5,
            }}
          >
            No steps defined yet. Start by adding the first approver below.
          </div>
        )}

        {type.steps.length > 0 && (
          <ol
            style={{
              listStyle: "none",
              paddingLeft: 0,
              margin: "0 0 14px",
            }}
          >
            {type.steps.map((s) => (
              <li
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 0",
                  borderBottom:
                    "1px dashed var(--border-soft, rgba(148,163,184,0.3))",
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--muted)",
                    flexShrink: 0,
                  }}
                >
                  {s.order}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 500,
                        color: "var(--text)",
                        fontSize: 14,
                      }}
                    >
                      {s.name}
                    </span>
                    <Pill color={roleColor(s.requiredRole)}>
                      {s.requiredRole}
                    </Pill>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteStep(s.id)}
                  disabled={deleting}
                  style={{
                    border: "1px solid #fecaca",
                    background: "#fef2f2",
                    color: "#b91c1c",
                    borderRadius: 999,
                    padding: "5px 11px",
                    fontSize: 12,
                    cursor: deleting ? "not-allowed" : "pointer",
                    flexShrink: 0,
                  }}
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </li>
            ))}
          </ol>
        )}

        {/* Add Step form: Department + Role */}
        <form
          onSubmit={handleAddStep}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
            marginTop: 12,
            paddingTop: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "var(--muted)",
              flexWrap: "wrap",
            }}
          >
            <span>Add step:</span>

            {/* Department dropdown */}
            <select
              value={deptChoice}
              onChange={(e) => setDeptChoice(e.target.value)}
              style={{
                borderRadius: 999,
                border: "1px solid var(--border)",
                padding: "7px 11px",
                fontSize: 13,
                background: "var(--card)",
                color: "var(--text)",
              }}
            >
              <option value="requester">Requester’s department</option>
              {departments?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Role dropdown */}
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              style={{
                borderRadius: 999,
                border: "1px solid var(--border)",
                padding: "7px 11px",
                fontSize: 13,
                background: "var(--card)",
                color: "var(--text)",
              }}
            >
              <option value="MANAGER">Manager</option>
              <option value="DIRECTOR">Director</option>
              <option value="ADMIN">Admin</option>
              <option value="HR_OFFICER">HR Officer</option>
              <option value="IT_OFFICER">IT Officer</option>
              <option value="FINANCE_OFFICER">Finance Officer</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="Step name (optional)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{
              flex: 1,
              minWidth: 220,
              borderRadius: 999,
              border: "1px solid var(--border)",
              padding: "7px 11px",
              fontSize: 13,
              background: "var(--input-bg)",
              color: "var(--text)",
            }}
          />

          <button
            type="submit"
            disabled={adding}
            style={{
              borderRadius: 999,
              border: "none",
              background: adding ? "#64748b" : "#0f172a",
              color: "#fff",
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 500,
              cursor: adding ? "not-allowed" : "pointer",
              boxShadow: "0 10px 22px rgba(15,23,42,0.35)",
            }}
          >
            {adding ? "Adding…" : "Add Step"}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- FlowModal: centered modal --------------------------------

type FlowModalProps = {
  type: RequestTypeWithSteps;
  departments?: Department[];
  onClose: () => void;
};

function FlowModal({ type, departments, onClose }: FlowModalProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        background: "rgba(15,23,42,0.55)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(560px, 100%)",
          maxHeight: "min(680px, 100%)",
          borderRadius: 24,
          background: "var(--page, var(--card, #020617))",
          padding: 24,
          boxShadow: "0 26px 70px rgba(15,23,42,0.9)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <h2
            style={{
              fontSize: 22,
              fontWeight: 600,
              margin: 0,
              color: "var(--text)",
            }}
          >
            {type.name} — Flow
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "5px 12px",
              borderRadius: 999,
              border: "1px solid var(--border)",
              background: "var(--card)",
              fontSize: 12,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "var(--text)",
            }}
          >
            <span style={{ fontSize: 16 }}>×</span>
            <span>Close</span>
          </button>
        </div>

        <p
          style={{
            margin: 0,
            color: "var(--muted)",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          View and adjust the approval steps for this request type. Changes will
          affect all new requests created for this type.
        </p>

        <div style={{ marginTop: 4 }}>
          <TypeCard type={type} departments={departments} />
        </div>
      </div>
    </div>
  );
}

// --- RequestTypesTable: the main list on the left --------------

type RequestTypesTableProps = {
  types: RequestTypeWithSteps[];
  onSelect: (id: string) => void;
};

function RequestTypesTable({ types, onSelect }: RequestTypesTableProps) {
  return (
    <div
      style={{
        border: "1px solid var(--border, #1f2937)",
        borderRadius: 12,
        background: "var(--card, #020617)",
        boxShadow: "0 8px 30px rgba(15,23,42,0.35)",
        overflow: "hidden",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 14,
          color: "var(--text, #e5e7eb)",
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
                borderBottom: "1px solid var(--border, #1f2937)",
                fontWeight: 500,
              }}
            >
              Request Type
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "10px 14px",
                borderBottom: "1px solid var(--border, #1f2937)",
                fontWeight: 500,
                width: 120,
              }}
            >
              Key / Code
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "10px 14px",
                borderBottom: "1px solid var(--border, #1f2937)",
                fontWeight: 500,
              }}
            >
              Department
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "10px 14px",
                borderBottom: "1px solid var(--border, #1f2937)",
                fontWeight: 500,
                width: 140,
              }}
            >
              Steps
            </th>
            <th
              style={{
                textAlign: "right",
                padding: "10px 14px",
                borderBottom: "1px solid var(--border, #1f2937)",
                fontWeight: 500,
                width: 140,
              }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {types.map((type) => (
            <tr key={type.id}>
              <td
                style={{
                  padding: "10px 14px",
                  borderBottom:
                    "1px solid var(--border-subtle, rgba(15,23,42,0.6))",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{type.name}</span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--muted, #9ca3af)",
                    }}
                  >
                    {type.steps.length === 0
                      ? "No flow defined yet"
                      : `${type.steps.length} step${
                          type.steps.length > 1 ? "s" : ""
                        } in flow`}
                  </span>
                </div>
              </td>
              <td
                style={{
                  padding: "10px 14px",
                  borderBottom:
                    "1px solid var(--border-subtle, rgba(15,23,42,0.6))",
                  fontSize: 13,
                  color: "var(--muted, #9ca3af)",
                }}
              >
                <div>{type.key}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  Code: {type.code || "—"}
                </div>
              </td>
              <td
                style={{
                  padding: "10px 14px",
                  borderBottom:
                    "1px solid var(--border-subtle, rgba(15,23,42,0.6))",
                  fontSize: 13,
                }}
              >
                {type.department?.name || (
                  <span style={{ color: "var(--muted, #9ca3af)" }}>
                    Not assigned
                  </span>
                )}
              </td>
              <td
                style={{
                  padding: "10px 14px",
                  borderBottom:
                    "1px solid var(--border-subtle, rgba(15,23,42,0.6))",
                  fontSize: 13,
                  color: "var(--muted, #9ca3af)",
                }}
              >
                {type.steps.length === 0
                  ? "—"
                  : type.steps
                      .map((s) => s.requiredRole)
                      .slice(0, 3)
                      .join(" → ")}
                {type.steps.length > 3 ? " …" : ""}
              </td>
              <td
                style={{
                  padding: "10px 14px",
                  borderBottom:
                    "1px solid var(--border-subtle, rgba(15,23,42,0.6))",
                  textAlign: "right",
                }}
              >
                <button
                  type="button"
                  onClick={() => onSelect(type.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: "1px solid var(--border, #1f2937)",
                    background: "var(--card, #020617)",
                    fontSize: 13,
                    cursor: "pointer",
                    color: "var(--text, #e5e7eb)",
                  }}
                >
                  View / Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Main page ------------------------------------------------

export default function RequestTypeFlows() {
  const { data, isLoading, isError } = useQuery<RequestTypeWithSteps[]>({
    queryKey: ["request-types-with-steps"],
    queryFn: fetchRequestTypesWithSteps,
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
  });

  const [selectedTypeId, setSelectedTypeId] = React.useState<string | null>(
    null
  );

  if (isLoading) {
    return (
      <div style={{ padding: 24, color: "var(--muted)" }}>
        Loading approval flows…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div style={{ padding: 24, color: "#f97373" }}>
        Failed to load flows.
      </div>
    );
  }

  const selectedType = selectedTypeId
    ? data.find((t) => t.id === selectedTypeId) || null
    : null;

  return (
    <div style={{ padding: 24 }}>
      <h1
        style={{
          fontSize: 24,
          marginBottom: 8,
          color: "var(--text)",
        }}
      >
        Approval Flows
      </h1>
      <p
        style={{
          marginBottom: 20,
          color: "var(--muted)",
          maxWidth: 620,
          fontSize: 14,
        }}
      >
        Each request type has its own approval flow. Click{" "}
        <strong>View / Edit</strong> to see or change the steps for that type.
      </p>

      <RequestTypesTable types={data} onSelect={setSelectedTypeId} />

      {selectedType && (
        <FlowModal
          type={selectedType}
          departments={departments}
          onClose={() => setSelectedTypeId(null)}
        />
      )}
    </div>
  );
}
