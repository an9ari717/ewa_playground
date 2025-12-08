// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";

import RequireAuth from "./auth/RequireAuth";
import { useAuth } from "./store/auth";
import { ToastProvider } from "./components/Toast";
import ThemeProvider from "./components/ThemeProvider";

import Login from "./pages/Login";
import AppShell from "./layouts/AppShell";

// Core pages
import Dashboard from "./pages/Dashboard";
import Archive from "./pages/Archive";
import RequestDetails from "./pages/RequestDetails";
import Inbox from "./pages/Inbox"; // ✅ universal inbox

// Employee
import RequestNew from "./pages/employee/RequestNew";
import MyRequests from "./pages/employee/MyRequests";

// Manager / Director dashboards
import ManagerDashboard from "./pages/manager/Dashboard";
import DirectorDashboard from "./pages/director/Dashboard";

// Admin
import AdminDepartments from "./pages/admin/Departments";
import AdminUsers from "./pages/admin/Users";
import AdminRequestTypes from "./pages/admin/RequestTypes";
import AdminRequestTypeFlows from "./pages/admin/RequestTypeFlows";

// Settings
import SettingsPage from "./pages/Settings";

const client = new QueryClient();

/** Read theme from localStorage and apply to <html data-theme="..."> */
function ThemeBootstrap() {
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("ewa.theme");
      let mode: "light" | "dark" = "light";

      if (stored === "dark" || stored === "light") {
        mode = stored;
      } else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
        mode = "dark";
      }

      document.documentElement.setAttribute("data-theme", mode);
    } catch {
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  return null;
}

// Hydrate store from localStorage at startup
function AuthHydrator() {
  const hydrate = useAuth((s) => s.hydrate);
  React.useEffect(() => {
    hydrate();
  }, [hydrate]);
  return null;
}

// Optional: validate token on boot
function AuthValidator() {
  const bootstrap = useAuth((s) => s.bootstrap);
  const token = useAuth((s) => s.token);

  React.useEffect(() => {
    if (token) bootstrap(); // calls /auth/me
  }, [token, bootstrap]);

  return null;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <ThemeBootstrap />
        <AuthHydrator />
        <AuthValidator />
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />

              {/* Protected */}
              <Route element={<RequireAuth />}>
                <Route path="/app" element={<AppShell />}>
                  {/* Overview */}
                  <Route index element={<Dashboard />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="archive" element={<Archive />} />

                  {/* ✅ Shared universal Inbox for all roles */}
                  <Route path="inbox" element={<Inbox />} />

                  {/* Employee */}
                  <Route path="employee/request" element={<RequestNew />} />
                  <Route path="employee/requests" element={<MyRequests />} />

                  {/* Manager */}
                  <Route
                    path="manager/dashboard"
                    element={<ManagerDashboard />}
                  />

                  {/* Director */}
                  <Route
                    path="director/dashboard"
                    element={<DirectorDashboard />}
                  />

                  {/* Admin */}
                  <Route path="admin" element={<AdminDepartments />} />
                  <Route path="admin/users" element={<AdminUsers />} />
                  <Route
                    path="admin/request-types"
                    element={<AdminRequestTypes />}
                  />
                  <Route
                    path="admin/flows"
                    element={<AdminRequestTypeFlows />}
                  />

                  {/* Settings – visible for everyone */}
                  <Route path="settings" element={<SettingsPage />} />

                  {/* Shared request details */}
                  <Route path="requests/:id" element={<RequestDetails />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
