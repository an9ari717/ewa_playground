// apps/approvals-api/src/routes/request.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import { issuePublicCode } from "../services/codegen.js";

const prisma = new PrismaClient();
export const requestsRouter = express.Router();

/**
 * Helper: format a single request for the Details page
 */
function formatRequestForDetails(request) {
  if (!request) return null;
  return {
    id: request.id,
    title: request.title,
    status: request.status,
    payload: request.payload,
    isActive: request.isActive,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    currentStage: request.currentStage || "MANAGER",
    publicCode: request.publicCode || null,
    type: request.type?.name || request.type?.key || "Unknown",
    typeCode: request.type?.code || null,
    typeDepartmentId: request.type?.departmentId || null,
    department: request.type?.department
      ? {
          id: request.type.department.id,
          name: request.type.department.name,
        }
      : null,
    createdBy: request.requester,
    history: request.history || [],
  };
}

/**
 * Helper: assign a specific user to a request for a given stage.
 * - For MANAGER / DIRECTOR -> use requesterDeptId
 * - For ADMIN              -> use typeDeptId
 */
async function assignAssigneeForStage({
  requestId,
  stageRole,
  requesterDeptId,
  typeDeptId,
}) {
  if (!stageRole) return;

  let departmentId = null;

  // Manager / Director -> requester’s department
  if (stageRole === "MANAGER" || stageRole === "DIRECTOR") {
    departmentId = requesterDeptId || null;
  }

  // Admin & HR_OFFICER -> the department of the RequestType (e.g. HR, IT, Finance)
  else if (stageRole === "ADMIN" || stageRole === "HR_OFFICER") {
    departmentId = typeDeptId || null;
  }

  const whereUser = {
    role: stageRole,
    isActive: true,
  };

  if (departmentId) {
    whereUser.departmentId = departmentId;
  }

  console.log("[ASSIGN DEBUG]", {
    stageRole,
    requesterDeptId,
    typeDeptId,
    whereUser,
  });

  const approver = await prisma.user.findFirst({
    where: whereUser,
    orderBy: { createdAt: "asc" },
  });

  console.log("[ASSIGN SELECTED]", {
    approverId: approver?.id,
    approverEmail: approver?.email,
  });

  if (!approver) {
    console.warn(
      `[assignAssigneeForStage] No approver found for stage=${stageRole}, dept=${departmentId}`
    );
    return;
  }

  await prisma.requestAssignee.create({
    data: {
      requestId,
      userId: approver.id,
      stage: stageRole,
      active: true,
    },
  });
}

/**
 * --------------------------------------------------
 * POST /requests
 * Create a new request
 * --------------------------------------------------
 */
requestsRouter.post("/requests", async (req, res) => {
  try {
    const { type, title, payload, requesterEmail } = req.body;

    if (!type || !title || !requesterEmail) {
      return res.status(400).json({
        error:
          "Missing required fields. 'type', 'title', and 'requesterEmail' are required.",
      });
    }

    const requesterUser = await prisma.user.findUnique({
      where: { email: requesterEmail },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        departmentId: true,
      },
    });

    if (!requesterUser) {
      return res.status(400).json({ error: "Unknown requesterEmail." });
    }
    if (!requesterUser.isActive) {
      return res.status(403).json({ error: "Requester user is inactive." });
    }

    // Load request type
    const reqType = await prisma.requestType.findUnique({
      where: { key: type },
      select: {
        id: true,
        key: true,
        name: true,
        code: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
      },
    });

    if (!reqType) {
      return res.status(400).json({ error: `Unknown request type '${type}'.` });
    }

    if (!reqType.code) {
      return res.status(500).json({
        error: `RequestType '${type}' has no short code (code) set.`,
      });
    }

    if (!reqType.departmentId) {
      return res.status(500).json({
        error: `RequestType '${type}' is not linked to any department.`,
      });
    }

    const publicCode = await issuePublicCode(prisma, reqType.id);

    // Load configured approval steps for this type
    const steps = await prisma.approvalStep.findMany({
      where: { typeId: reqType.id },
      orderBy: { order: "asc" },
    });

    // Decide FIRST stage:
    // If there are configured steps -> first step's requiredRole
    // Otherwise fallback to MANAGER
    let firstStage = "MANAGER";
    if (steps.length > 0) {
      firstStage = steps[0].requiredRole;
    }

    console.log("[CREATE REQUEST DEBUG]", {
      typeKey: type,
      requesterEmail,
      requesterDeptId: requesterUser.departmentId,
      typeDeptId: reqType.departmentId,
      firstStage,
    });

    const newReq = await prisma.request.create({
      data: {
        typeId: reqType.id,
        title,
        payload,
        status: "PENDING",
        currentStage: firstStage,
        requesterId: requesterUser.id,
        isActive: true,
        publicCode,
        history: {
          create: {
            step: "Submitted",
            action: "SUBMITTED",
            by: requesterUser.email,
            role: requesterUser.role,
            comment: "Initial submission",
          },
        },
      },
      include: {
        requester: {
          select: { id: true, email: true, name: true, role: true },
        },
        type: {
          select: {
            id: true,
            key: true,
            name: true,
            code: true,
            departmentId: true,
            department: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Assign first approver (specific user)
    await assignAssigneeForStage({
      requestId: newReq.id,
      stageRole: firstStage,
      requesterDeptId: requesterUser.departmentId,
      typeDeptId: reqType.departmentId,
    });

    res.status(201).json(newReq);
  } catch (err) {
    console.error("[POST /requests] error:", err);
    if (err && err.code === "P2002") {
      return res
        .status(409)
        .json({ error: "Public code collision — please retry." });
    }
    res.status(500).json({ error: "Failed to create request." });
  }
});

/**
 * --------------------------------------------------
 * GET /requests
 * List requests (inbox / my / archive)
 * --------------------------------------------------
 */
requestsRouter.get("/requests", async (req, res) => {
  try {
    const actor = req.actor || null;
    if (!actor) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const box = (req.query.box || "my").toString();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSizeRaw = parseInt(req.query.pageSize, 10) || 10;
    const pageSize = Math.min(Math.max(pageSizeRaw, 1), 50);
    const skip = (page - 1) * pageSize;

    /** Base where-clause we’ll tweak per box */
    const where = {};

    if (box === "my") {
      // 👤 Only requests created by the logged-in user
      where.requesterId = actor.id;
    } else if (box === "inbox") {
      // 📥 Requests that are currently pending
      where.status = "PENDING";
      where.isActive = true;

      if (actor.role !== "ADMIN") {
        // 🔐 Normal users: only requests assigned to them via RequestAssignee
        where.assignees = {
          some: {
            userId: actor.id,
            active: true,
          },
        };
      }
      // 👀 ADMIN: no assignee filter -> see all pending requests
    } else if (box === "archive") {
      // 📦 Completed / rejected / archived
      where.OR = [
        { status: "APPROVED" },
        { status: "REJECTED" },
        { status: "COMPLETED" },
        { status: "ARCHIVED" },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.request.count({ where }),
      prisma.request.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          requester: {
            select: { id: true, name: true, email: true, role: true },
          },
          type: {
            select: {
              id: true,
              key: true,
              name: true,
              code: true,
              department: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    const results = items.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      type: r.type?.name || r.type?.key,
      typeCode: r.type?.code,
      department: r.type?.department?.name || null,
      createdBy: r.requester?.name || r.requester?.email || null,
      isActive: r.isActive,
    }));

    res.json({ page, pageSize, total, items: results });
  } catch (err) {
    console.error("[GET /requests] error:", err);
    res.status(500).json({ error: "Failed to load requests." });
  }
});

/**
 * --------------------------------------------------
 * GET /requests/:id
 * Retrieve single request
 * --------------------------------------------------
 */
requestsRouter.get("/requests/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const request = await prisma.request.findUnique({
      where: { id },
      include: {
        requester: {
          select: { id: true, email: true, name: true, role: true },
        },
        type: {
          select: {
            id: true,
            key: true,
            name: true,
            code: true,
            departmentId: true,
            department: { select: { id: true, name: true } },
          },
        },
        history: true,
      },
    });

    if (!request) return res.status(404).json({ error: "Not found" });

    const formatted = formatRequestForDetails(request);
    res.json(formatted);
  } catch (err) {
    console.error("[GET /requests/:id] error:", err);
    res.status(500).json({ error: "Failed to load request." });
  }
});

/**
 * --------------------------------------------------
 * PATCH /requests/:id/status
 * Approve / Reject based on { approved: boolean }
 * Follows configured ApprovalStep chain for the type
 * and reassigns using RequestAssignee
 * --------------------------------------------------
 */
requestsRouter.patch("/requests/:id/status", async (req, res) => {
  try {
    const actor = req.actor || null;
    if (!actor) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const { id } = req.params;
    const { approved, comment } = req.body || {};

    if (typeof approved !== "boolean") {
      return res
        .status(400)
        .json({ error: "Field 'approved' (boolean) is required." });
    }

    const request = await prisma.request.findUnique({
      where: { id },
      include: {
        requester: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            departmentId: true,
          },
        },
        type: {
          select: {
            id: true,
            key: true,
            name: true,
            code: true,
            departmentId: true,
            department: { select: { id: true, name: true } },
          },
        },
        history: true,
      },
    });

    if (!request) return res.status(404).json({ error: "Not found" });

    // Terminal states can't be changed
    if (
      ["APPROVED", "REJECTED", "COMPLETED", "ARCHIVED"].includes(
        request.status
      )
    ) {
      return res.status(400).json({ error: "Request is already final." });
    }

    // Load steps for this type
    const steps = await prisma.approvalStep.findMany({
      where: { typeId: request.typeId },
      orderBy: { order: "asc" },
    });

    const stage = request.currentStage || steps[0]?.requiredRole || "MANAGER";

    // Role ↔ stage guard
    if (stage === "MANAGER" && actor.role !== "MANAGER") {
      return res
        .status(403)
        .json({ error: "Only manager can act at this stage." });
    }
    if (stage === "DIRECTOR" && actor.role !== "DIRECTOR") {
      return res
        .status(403)
        .json({ error: "Only director can act at this stage." });
    }
    if (stage === "ADMIN" && actor.role !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "Only admin can act at this stage." });
    }

    let newStatus = request.status;
    let newStage = stage;
    let isActive = true;

    if (approved) {
      if (steps.length === 0) {
        // No configured steps -> just finalize
        newStage = "COMPLETED";
        newStatus = "APPROVED";
        isActive = false;
      } else {
        // Find current step index
        const index = steps.findIndex((s) => s.requiredRole === stage);

        if (index === -1 || index === steps.length - 1) {
          // Current stage is last (or unknown) -> finalize
          newStage = "COMPLETED";
          newStatus = "APPROVED";
          isActive = false;
        } else {
          // Move to next step in the configured flow
          const next = steps[index + 1];
          newStage = next.requiredRole;
          newStatus = "PENDING";
        }
      }
    } else {
      // REJECT
      newStage = "COMPLETED";
      newStatus = "REJECTED";
      isActive = false;
    }

    // Deactivate any existing assignees for this request
    await prisma.requestAssignee.updateMany({
      where: { requestId: request.id, active: true },
      data: { active: false },
    });

    // History label: Manager Review / Director Review / Admin Review
    let stepLabel = "Review";
    if (actor.role === "MANAGER") stepLabel = "Manager Review";
    else if (actor.role === "DIRECTOR") stepLabel = "Director Review";
    else if (actor.role === "ADMIN") stepLabel = "Admin Review";

    const updated = await prisma.request.update({
      where: { id: request.id },
      data: {
        status: newStatus,
        currentStage: newStage,
        isActive,
        history: {
          create: {
            step: stepLabel,
            action: approved ? "APPROVED" : "REJECTED",
            approved,
            by: actor.email,
            role: actor.role,
            comment: comment || (approved ? "Approved" : "Rejected"),
          },
        },
      },
      include: {
        requester: {
          select: { id: true, email: true, name: true, role: true },
        },
        type: {
          select: {
            id: true,
            key: true,
            name: true,
            code: true,
            departmentId: true,
            department: { select: { id: true, name: true } },
          },
        },
        history: true,
      },
    });

    // If still pending (i.e. moved to a next stage), assign new approver
    if (approved && newStatus === "PENDING") {
      await assignAssigneeForStage({
        requestId: request.id,
        stageRole: newStage,
        requesterDeptId: request.requester.departmentId,
        typeDeptId: request.type.departmentId,
      });
    }

    res.json(formatRequestForDetails(updated));
  } catch (err) {
    console.error("[PATCH /requests/:id/status] error:", err);
    res.status(500).json({ error: "Failed to update request status." });
  }
});

// (Legacy) old POST /approve & /reject routes are no longer needed by the frontend,
// but you can keep them or remove them later if you want.
