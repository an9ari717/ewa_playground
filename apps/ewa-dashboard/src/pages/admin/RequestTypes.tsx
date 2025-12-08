// src/pages/admin/RequestTypes.tsx
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  fetchRequestTypes,
  updateRequestTypeDepartment,
  type RequestTypeRow,
} from "../../services/requestTypes";
import {
  fetchDepartments,
  type Department,
} from "../../services/departments";

export default function AdminRequestTypes() {
  const qc = useQueryClient();

  // ---- Fetch request types ----
  const {
    data: requestTypes,
    isLoading: loadingTypes,
    isError: typesError,
    refetch,
    isFetching,
  } = useQuery<RequestTypeRow[]>({
    queryKey: ["request-types"],
    queryFn: fetchRequestTypes,
  });

  // ---- Fetch departments for dropdown ----
  const {
    data: departments,
    isLoading: loadingDepts,
    isError: deptsError,
  } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
  });

  // Nice label list for selects
  const deptOptions = useMemo(
    () =>
      (departments ?? []).map((d) => ({
        value: d.id,
        label: d.name,
      })),
    [departments]
  );

  // Mutation for changing department of a type
  const assignMutation = useMutation({
    mutationFn: updateRequestTypeDepartment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["request-types"] });
    },
  });

  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const busy = assignMutation.isPending || isFetching || loadingTypes;

  const handleChangeDept = (typeId: string, departmentId: string) => {
    if (!typeId || !departmentId) return;
    setSelectedTypeId(typeId);
    assignMutation.mutate({ id: typeId, departmentId });
  };

  const totalTypes = requestTypes?.length ?? 0;

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
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
            Request Types
          </h1>
          <p style={{ margin: 0, color: "var(--muted)", maxWidth: 520 }}>
            Map each request type (Leave, IT Support, Procurement) to a
            department so approvals go to the right inbox.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={busy}
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border: "1px solid var(--border)",
            backgroundColor: "var(--card)",
            fontSize: 13,
            cursor: busy ? "not-allowed" : "pointer",
            color: "var(--text)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            aria-hidden
            style={{
              display: "inline-block",
              transform: busy ? "rotate(90deg)" : "none",
              transition: "transform 0.15s ease-out",
            }}
          >
            ↻
          </span>
          {busy ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {(typesError || deptsError) && (
        <p style={{ color: "#f97373", marginBottom: 12 }}>
          Failed to load data. Please try again.
        </p>
      )}

      {loadingTypes || loadingDepts ? (
        <p style={{ color: "var(--text)" }}>
          Loading request types and departments…
        </p>
      ) : !requestTypes || requestTypes.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No request types found.</p>
      ) : (
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 12,
            overflow: "hidden",
            background: "var(--card)",
            boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
          }}
        >
          {/* Card header bar inside the card */}
          <div
            style={{
              padding: "10px 16px",
              borderBottom: "1px solid var(--border)",
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.02), rgba(37,99,235,0.04))",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 13,
            }}
          >
            <div style={{ color: "var(--muted)" }}>
              Configured request types
            </div>
            <div
              style={{
                padding: "2px 10px",
                borderRadius: 999,
                border: "1px solid var(--border)",
                backgroundColor: "var(--card)",
                fontSize: 12,
                color: "var(--muted)",
              }}
            >
              {totalTypes} type{totalTypes === 1 ? "" : "s"}
            </div>
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
              color: "var(--text)",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--table-header-bg, #f8fafc)",
                }}
              >
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 12px",
                    borderBottom: "1px solid var(--border)",
                    width: 110,
                    fontWeight: 500,
                    fontSize: 13,
                  }}
                >
                  Key
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 12px",
                    borderBottom: "1px solid var(--border)",
                    fontWeight: 500,
                    fontSize: 13,
                  }}
                >
                  Name
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 12px",
                    borderBottom: "1px solid var(--border)",
                    width: 120,
                    fontWeight: 500,
                    fontSize: 13,
                  }}
                >
                  Code
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 12px",
                    borderBottom: "1px solid var(--border)",
                    width: 200,
                    fontWeight: 500,
                    fontSize: 13,
                  }}
                >
                  Current department
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "8px 12px",
                    borderBottom: "1px solid var(--border)",
                    width: 240,
                    fontWeight: 500,
                    fontSize: 13,
                  }}
                >
                  Change department
                </th>
              </tr>
            </thead>
            <tbody>
              {requestTypes.map((t) => (
                <tr key={t.id}>
                  <td
                    style={{
                      padding: "10px 12px",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "2px 10px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: 0.4,
                        fontFamily: "monospace",
                        background:
                          "linear-gradient(135deg, rgba(15,23,42,0.03), rgba(15,23,42,0.06))",
                        color: "var(--text)",
                        border: "1px solid rgba(148,163,184,0.5)",
                      }}
                    >
                      {t.key}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      borderBottom: "1px solid var(--border)",
                      fontWeight: 500,
                    }}
                  >
                    {t.name}
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      borderBottom: "1px solid var(--border)",
                      color: "var(--muted)",
                    }}
                  >
                    {t.code || "—"}
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      borderBottom: "1px solid var(--border)",
                      color: "var(--muted)",
                    }}
                  >
                    {t.department?.name || "Not assigned"}
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      borderBottom: "1px solid var(--border)",
                      textAlign: "right",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <select
                        value={t.departmentId ?? ""}
                        onChange={(e) =>
                          handleChangeDept(t.id, e.target.value || "")
                        }
                        disabled={assignMutation.isPending}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 999,
                          border: "1px solid var(--border)",
                          minWidth: 170,
                          background: "var(--input-bg)",
                          color: "var(--text)",
                          fontSize: 13,
                        }}
                      >
                        <option value="">Select…</option>
                        {deptOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {assignMutation.isPending &&
                        selectedTypeId === t.id && (
                          <span
                            style={{
                              fontSize: 12,
                              color: "var(--muted)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Saving…
                          </span>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {assignMutation.isError && (
            <p style={{ color: "#f97373", margin: "8px 16px 12px" }}>
              Failed to update request type. Please try again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
