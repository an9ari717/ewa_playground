// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";

import RequireAuth from "./auth/RequireAuth";
import { useAuth } from "./store/auth";
import { ToastProvider } from "./components/Toast";

import Login from "./pages/Login";
import AppShell from "./layouts/AppShell";

// Core pages
import Dashboard from "./pages/Dashboard";
import Archive from "./pages/Archive";
import RequestDetails from "./pages/RequestDetails";

// Employee
import RequestNew from "./pages/employee/RequestNew";
import MyRequests from "./pages/employee/MyRequests";

// Manager / Director
import ManagerInbox from "./pages/manager/Inbox";
import DirectorInbox from "./pages/director/Inbox";

// ✅ NEW: Manager/Director dashboards
import ManagerDashboard from "./pages/manager/Dashboard";
import DirectorDashboard from "./pages/director/Dashboard";

const client = new QueryClient();

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
                {/* Default to employee dashboard */}
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="archive" element={<Archive />} />

                {/* Employee */}
                <Route path="employee/request" element={<RequestNew />} />
                <Route path="employee/requests" element={<MyRequests />} />

                {/* Manager */}
                <Route path="manager/dashboard" element={<ManagerDashboard />} /> {/* ✅ NEW */}
                <Route path="manager/inbox" element={<ManagerInbox />} />

                {/* Director */}
                <Route path="director/dashboard" element={<DirectorDashboard />} /> {/* ✅ NEW */}
                <Route path="director/inbox" element={<DirectorInbox />} />

                {/* Shared */}
                <Route path="requests/:id" element={<RequestDetails />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
