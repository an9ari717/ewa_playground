// src/routes/request-types.js
const express = require("express");
const router = express.Router();
// NOTE: we are NOT enforcing requireRole here for now to avoid 401 + logout
// const { requireRole } = require("../middleware/perm");

/**
 * All routes here are effectively "admin" routes but we're not enforcing
 * requireRole on the backend yet to avoid accidental 401 → logout.
 * req.db = Prisma client (injected from app.js)
 */

/* ============================================================
   GET /request-types
   (Existing functionality, moved here for clean separation)
   ============================================================ */
router.get("/", async (req, res) => {
  try {
    const types = await req.db.requestType.findMany({
      orderBy: { name: "asc" },
      include: {
        department: { select: { id: true, name: true } },
      },
    });

    res.json(types);
  } catch (err) {
    req.log?.error(err, "list request types failed");
    res.status(500).json({ error: "failed to list request types" });
  }
});

/* ============================================================
   GET /request-types/with-steps
   List all types + ordered approval steps
   ============================================================ */
router.get("/with-steps", async (req, res) => {
  try {
    const types = await req.db.requestType.findMany({
      orderBy: { name: "asc" },
      include: {
        department: { select: { id: true, name: true } },
        steps: { orderBy: { order: "asc" } },
      },
    });

    res.json(types);
  } catch (err) {
    req.log?.error(err, "list types with steps failed");
    res.status(500).json({ error: "failed to list types with steps" });
  }
});

/* ============================================================
   PATCH /request-types/:id
   Update department link
   ============================================================ */
router.patch("/:id", async (req, res) => {
  try {
    const { departmentId } = req.body;

    const updated = await req.db.requestType.update({
      where: { id: req.params.id },
      data: { departmentId: departmentId ?? null },
      include: {
        department: { select: { id: true, name: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    req.log?.error(err, "update request type failed");
    res.status(500).json({ error: "failed to update request type" });
  }
});

/* ============================================================
   POST /request-types/:id/steps
   Create a new approval step
   ============================================================ */
router.post("/:id/steps", async (req, res) => {
  try {
    const typeId = req.params.id;
    const { requiredRole, name } = req.body;

    if (!requiredRole) {
      return res.status(400).json({ error: "requiredRole is needed" });
    }

    // Determine next order number
    const last = await req.db.approvalStep.findFirst({
      where: { typeId },
      orderBy: { order: "desc" },
    });

    const nextOrder = (last?.order ?? 0) + 1;

    const step = await req.db.approvalStep.create({
      data: {
        typeId,
        requiredRole,
        order: nextOrder,
        name: name || `${requiredRole} Review`,
      },
    });

    res.status(201).json(step);
  } catch (err) {
    req.log?.error(err, "create approval step failed");
    res.status(500).json({ error: "failed to create step" });
  }
});

/* ============================================================
   PATCH /request-types/:id/steps/:stepId
   Reorder or rename a step
   ============================================================ */
router.patch("/:id/steps/:stepId", async (req, res) => {
  try {
    const { stepId } = req.params;
    const { order, name, requiredRole } = req.body;

    const updated = await req.db.approvalStep.update({
      where: { id: stepId },
      data: {
        ...(order !== undefined ? { order } : {}),
        ...(name ? { name } : {}),
        ...(requiredRole ? { requiredRole } : {}),
      },
    });

    res.json(updated);
  } catch (err) {
    req.log?.error(err, "update approval step failed");
    res.status(500).json({ error: "failed to update step" });
  }
});

/* ============================================================
   DELETE /request-types/:id/steps/:stepId
   Delete step (auto-shift ordering)
   ============================================================ */
router.delete("/:id/steps/:stepId", async (req, res) => {
  try {
    const { id: typeId, stepId } = req.params;

    const step = await req.db.approvalStep.findUnique({
      where: { id: stepId },
    });

    if (!step) return res.status(404).json({ error: "step not found" });

    const deletedOrder = step.order;

    // Delete step
    await req.db.approvalStep.delete({ where: { id: stepId } });

    // Shift all steps above it down by 1
    await req.db.approvalStep.updateMany({
      where: { typeId, order: { gt: deletedOrder } },
      data: { order: { decrement: 1 } },
    });

    res.json({ ok: true });
  } catch (err) {
    req.log?.error(err, "delete approval step failed");
    res.status(500).json({ error: "failed to delete step" });
  }
});

module.exports = router;
