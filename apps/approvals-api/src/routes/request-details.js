// apps/approvals-api/src/routes/request-details.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

// small helper: map role -> nice step label
function stepLabelForRole(role) {
  const R = String(role || "").toUpperCase();
  if (R === "MANAGER") return "Manager Review";
  if (R === "DIRECTOR") return "Director Review";
  if (R === "ADMIN") return "Admin Review";
  return "Review";
}

// common handler for approve / reject
async function handleDecision(req, res, approved) {
  try {
    const actor = req.actor || null; // set by actor middleware
    if (!actor) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const role = String(actor.role || "").toUpperCase();
    const { id } = req.params;
    const comment = (req.body?.comment || "").toString().trim() || null;

    // load request
    const request = await prisma.request.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        currentStage: true,
        isActive: true,
      },
    });

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    const statusNow = String(request.status || "").toUpperCase();

    // already finished?
    if (["APPROVED", "REJECTED", "ARCHIVED", "COMPLETED"].includes(statusNow)) {
      return res.status(400).json({ error: "Request is already finalized." });
    }

    // only manager/director/admin can act (for now)
    if (!["MANAGER", "DIRECTOR", "ADMIN"].includes(role)) {
      return res.status(403).json({ error: "You are not allowed to take action on this request." });
    }

    // ----- compute next status / stage -----
    let nextStatus = statusNow;
    let nextStage = request.currentStage || "MANAGER";
    let setInactive = false;

    if (approved) {
      // simple flow: MANAGER -> DIRECTOR -> COMPLETED
      if (role === "MANAGER") {
        nextStage = "DIRECTOR";
        nextStatus = "PENDING";
      } else if (role === "DIRECTOR" || role === "ADMIN") {
        nextStage = "COMPLETED";
        nextStatus = "APPROVED";
        setInactive = true;
      }
    } else {
      // any approver rejecting finishes the request
      nextStage = "COMPLETED";
      nextStatus = "REJECTED";
      setInactive = true;
    }

    const data = {
      status: nextStatus,
      currentStage: nextStage,
      ...(setInactive ? { isActive: false } : {}),
      history: {
        create: {
          step: stepLabelForRole(role),
          action: approved ? "APPROVED" : "REJECTED",
          approved,
          by: actor.email,
          role,
          note: comment,
        },
      },
    };

    const updated = await prisma.request.update({
      where: { id },
      data,
    });

    return res.json({
      ok: true,
      id: updated.id,
      status: updated.status,
      currentStage: updated.currentStage,
      finalized: setInactive,
    });
  } catch (err) {
    console.error("[request-details decision] error:", err);
    return res.status(500).json({ error: "Failed to apply decision." });
  }
}

// Health for quick check: GET /api/request-details/ping
router.get("/ping", (_req, res) => res.json({ ok: true }));

// Approve: POST /api/request-details/:id/approve
router.post("/:id/approve", async (req, res) => {
  await handleDecision(req, res, true);
});

// Reject: POST /api/request-details/:id/reject
router.post("/:id/reject", async (req, res) => {
  await handleDecision(req, res, false);
});

module.exports = router;
