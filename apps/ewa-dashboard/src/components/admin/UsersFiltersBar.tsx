// src/components/admin/UsersFiltersBar.tsx
import React from "react";
import type { Department } from "../../services/departments";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

interface UsersFiltersBarProps {
  search: string;
  onSearch: (value: string) => void;
  roleFilter: string;
  onRoleFilter: (value: string) => void;
  deptFilter: string;
  onDeptFilter: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilter: (value: StatusFilter) => void;
  departments: Department[];
}

export default function UsersFiltersBar({
  search,
  onSearch,
  roleFilter,
  onRoleFilter,
  deptFilter,
  onDeptFilter,
  statusFilter,
  onStatusFilter,
  departments,
}: UsersFiltersBarProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        marginBottom: 16,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <input
        type="text"
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        style={{
          flex: 1,
          minWidth: 220,
          padding: "8px 12px",
          borderRadius: 999,
          border: "1px solid #e2e8f0",
          fontSize: 14,
          background: "#f8fafc",
        }}
      />

      <select
        value={roleFilter}
        onChange={(e) => onRoleFilter(e.target.value)}
        style={{
          width: 140,
          padding: "8px 12px",
          borderRadius: 999,
          border: "1px solid #e2e8f0",
          fontSize: 14,
          background: "#ffffff",
        }}
      >
        <option value="ALL">All roles</option>
        <option value="EMPLOYEE">Employee</option>
        <option value="MANAGER">Manager</option>
        <option value="DIRECTOR">Director</option>
        <option value="ADMIN">Admin</option>
      </select>

      <select
        value={deptFilter}
        onChange={(e) => onDeptFilter(e.target.value)}
        style={{
          width: 160,
          padding: "8px 12px",
          borderRadius: 999,
          border: "1px solid #e2e8f0",
          fontSize: 14,
          background: "#ffffff",
        }}
      >
        <option value="ALL">All departments</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>

      <select
        value={statusFilter}
        onChange={(e) =>
          onStatusFilter(e.target.value as StatusFilter)
        }
        style={{
          width: 140,
          padding: "8px 12px",
          borderRadius: 999,
          border: "1px solid #e2e8f0",
          fontSize: 14,
          background: "#ffffff",
        }}
      >
        <option value="ALL">All statuses</option>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
      </select>
    </div>
  );
}
