// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./layouts/AppShell";

// Pages
import Dashboard from "./pages/Dashboard";
import Archive from "./pages/Archive";
import RequestNew from "./pages/employee/RequestNew";
import MyRequests from "./pages/employee/MyRequests";
import ManagerInbox from "./pages/manager/Inbox";
import RequestDetails from "./pages/RequestDetails";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to /app/dashboard */}
        <Route path="/" element={<Navigate to="/app/dashboard" replace />} />

        {/* All app pages live under AppShell */}
        <Route path="/app" element={<AppShell />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="archive" element={<Archive />} />

          {/* Employee */}
          <Route path="employee/request" element={<RequestNew />} />
          <Route path="employee/requests" element={<MyRequests />} />

          {/* Manager */}
          <Route path="manager/inbox" element={<ManagerInbox />} />

          {/* Shared details */}
          <Route path="requests/:id" element={<RequestDetails />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<div style={{ padding: 24 }}>Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}
