// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";

import RequireAuth from "./auth/RequireAuth";
import { useAuth } from "./store/auth";
import { ToastProvider } from "./components/Toast";

import Login from "./pages/Login";
import AppShell from "./layouts/AppShell";
import Dashboard from "./pages/Dashboard";
import Inbox from "./pages/Inbox";
import Archive from "./pages/Archive";
import NewRequest from "./pages/NewRequest";
import RequestNew from "./pages/employee/RequestNew";
import MyRequests from "./pages/employee/MyRequests";
import ManagerInbox from "./pages/manager/Inbox";
import DirectorInbox from "./pages/director/inbox";
import RequestDetails from "./pages/RequestDetails";

const client = new QueryClient();

// Only hydrate from localStorage at startup — no async bootstrap on load
function AuthHydrator() {
  const hydrate = useAuth((s) => s.hydrate);
  React.useEffect(() => {
    hydrate();
  }, [hydrate]);
  return null;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <AuthHydrator />
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />

            {/* Protected */}
            <Route element={<RequireAuth />}>
              <Route path="/app" element={<AppShell />}>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="inbox" element={<Inbox />} />
                <Route path="archive" element={<Archive />} />
                <Route path="new-request" element={<NewRequest />} />

                {/* Employee views */}
                <Route path="employee/request" element={<RequestNew />} />
                <Route path="employee/requests" element={<MyRequests />} />

                {/* Manager view */}
                <Route path="manager/inbox" element={<ManagerInbox />} />

                {/* Director view */}
                <Route path="director/inbox" element={<DirectorInbox />} />

                {/* Request details */}
                <Route path="requests/:id" element={<RequestDetails />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Login />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
