// apps/approvals-api/src/routes/request-details.js
import express from "express";

export const requestDetailsRouter = express.Router();

/**
 * Minimal request details endpoint the frontend expects.
 * URL: GET /requests/:id?role=...&userId=...&by=...
 */
requestDetailsRouter.get("/requests/:id", async (req, res) => {
  const { id } = req.params;
  const { role, userId, by } = req.query;

  // TODO: replace this stub with a real DB lookup if/when you have it.
  // For now, return a valid shape so the UI can render.
  const now = new Date().toISOString();

  res.json({
    id,
    typeId: "DEMO",
    title: `Request #${id}`,
    payload: { example: true, note: "Replace with real payload" },
    status: "PENDING",
    requesterId: userId || "unknown",
    requester: by ? { id: userId || "unknown", name: "Demo User", email: by } : null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    pendingWith: role || "MANAGER",
    history: [
      { step: "Created", by: by || "noreply@demo.local", role: "EMPLOYEE", date: now, comment: "Demo" }
    ],
  });
});
