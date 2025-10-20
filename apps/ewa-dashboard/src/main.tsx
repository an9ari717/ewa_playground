// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";

import RequireAuth from "./auth/RequireAuth";

// Pages & layout
import Login from "./pages/Login";
import AppShell from "./layouts/AppShell";
import Dashboard from "./pages/Dashboard";
import Inbox from "./pages/Inbox";
import Archive from "./pages/Archive";
import NewRequest from "./pages/NewRequest";

// (These can stay even if empty — but make sure the files exist)
import RequestNew from "./pages/employee/RequestNew";
import MyRequests from "./pages/employee/MyRequests";
import ManagerInbox from "./pages/manager/Inbox";
import RequestDetails from "./pages/RequestDetails";

const client = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          {/* Protected under /app */}
          <Route element={<RequireAuth />}>
            <Route path="/app" element={<AppShell />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="inbox" element={<Inbox />} />
              <Route path="archive" element={<Archive />} />
              <Route path="new-request" element={<NewRequest />} />
              <Route path="employee/request" element={<RequestNew />} />
              <Route path="employee/requests" element={<MyRequests />} />
              <Route path="manager/inbox" element={<ManagerInbox />} />
              <Route path="requests/:id" element={<RequestDetails />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
