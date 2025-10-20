import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import RequestNew from "./pages/employee/RequestNew";
import MyRequests from "./pages/employee/MyRequests";
import ManagerInbox from "./pages/manager/Inbox";
import RequestDetails from "./pages/RequestDetails";

function TopNav() {
  return (
    <header className="px-4 py-3 border-b flex gap-3 items-center">
      <Link to="/" className="font-semibold">EWA Dashboard</Link>
      <nav className="flex gap-3 text-sm">
        <Link to="/employee/request">New Request</Link>
        <Link to="/employee/requests">My Requests</Link>
        <Link to="/manager/inbox">Manager Inbox</Link>
      </nav>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <TopNav />
      <main className="p-4">
        <Routes>
          <Route path="/" element={<div>Welcome to EWA Approvals</div>} />
          <Route path="/employee/request" element={<RequestNew />} />
          <Route path="/employee/requests" element={<MyRequests />} />
          <Route path="/manager/inbox" element={<ManagerInbox />} />
          <Route path="/requests/:id" element={<RequestDetails />} />
          <Route path="*" element={<div>Not Found</div>} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
