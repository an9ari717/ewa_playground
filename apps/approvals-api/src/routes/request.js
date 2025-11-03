// apps/approvals-api/src/routes/requests.js
import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const requestsRouter = express.Router();

/**
 * Create a new request
 * POST /requests
 *
 * Expected body:
 * {
 *   "type": "LEAVE",
 *   "title": "Annual Leave (3 days)",
 *   "payload": {
 *     "from": "2025-10-20",
 *     "to": "2025-10-22",
 *     "reason": "family"
 *   },
 *   "requesterEmail": "employee@demo.local"
 * }
 */
requestsRouter.post("/requests", async (req, res) => {
  try {
    const { type, title, payload, requesterEmail } = req.body;

    // basic validation
    if (!type || !title || !requesterEmail) {
      return res.status(400).json({
        error:
          "Missing required fields. 'type', 'title', and 'requesterEmail' are required.",
      });
    }

    // find the requester user
    const requesterUser = await prisma.user.findUnique({
      where: { email: requesterEmail },
    });

    if (!requesterUser) {
      return res.status(400).json({
        error: "Unknown requesterEmail.",
      });
    }

    // create the request
    const newReq = await prisma.request.create({
      data: {
        type,                // if your Prisma model uses `typeId` instead of `type`, we will update this
        title,
        payload,             // JSON column in Prisma schema
        status: "PENDING",   // first status
        currentStage: "MANAGER", // who's supposed to act first
        requesterId: requesterUser.id,
        isActive: true,
      },
      include: {
        requester: true, // so frontend can show who submitted it
      },
    });

    // OPTIONAL: create first assignee record if you have a RequestAssignee model
    // await prisma.requestAssignee.create({
    //   data: {
    //     requestId: newReq.id,
    //     userId: someManagerUserId,
    //     stage: "MANAGER",
    //     active: true,
    //   },
    // });

    return res.status(201).json(newReq);
  } catch (err) {
    console.error("[POST /requests] error:", err);
    return res.status(500).json({ error: "Failed to create request." });
  }
});
