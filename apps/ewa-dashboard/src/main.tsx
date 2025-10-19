import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";

import Login from "./pages/Login";
import Inbox from "./pages/Inbox";
import Archive from "./pages/Archive";
import Dashboard from "./pages/Dashboard";
import NewRequest from "./pages/NewRequest"; // ✅ added
import AppShell from "./layouts/AppShell";

const client = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          {/* layout with sidebar */}
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/new-request" element={<NewRequest />} /> {/* ✅ added */}
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/archive" element={<Archive />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
