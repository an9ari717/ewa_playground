// apps/approvals-api/src/routes/request-details.js
const express = require("express");
const router = express.Router();

// Health for quick check: GET /api/request-details/ping
router.get("/ping", (_req, res) => res.json({ ok: true }));

// Approve: POST /api/request-details/:id/approve
router.post("/:id/approve", async (req, res) => {
  // TODO: replace with real DB logic later
  res.json({ ok: true, id: req.params.id, action: "approve" });
});

// Reject: POST /api/request-details/:id/reject
router.post("/:id/reject", async (req, res) => {
  // TODO: replace with real DB logic later
  res.json({ ok: true, id: req.params.id, action: "reject" });
});

module.exports = router;
