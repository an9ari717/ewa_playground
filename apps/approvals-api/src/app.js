// src/app.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const pinoHttp = require('pino-http');
const pino = require('pino');
const { PrismaClient } = require('@prisma/client');
const { withAccelerate } = require('@prisma/extension-accelerate');
const { actor } = require('./middleware/actor');
const { requireRole, requireOwnerOrRole } = require('./middleware/perm');

const app = express();
const prisma = new PrismaClient({
  datasourceUrl: process.env.PRISMA_ACCELERATE_URL, // prisma://...api_key=...
}).$extends(withAccelerate());
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(cors());
app.use(express.json());

// Attach req.actor if ?by=<email> present
app.use(actor);

/**
 * RLS helper:
 * Sets Supabase's request.jwt.claims for this transaction so our SQL RLS policies
 * (auth.jwt()->>'email') can resolve to the caller's email.
 */
async function withRLS(prismaClient, { email }, fn) {
  if (!email) throw new Error('Missing user email for RLS');
  return prismaClient.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `select set_config('request.jwt.claims', $1, true)`,
      JSON.stringify({ email })
    );
    return fn(tx);
  });
}

// Pick the first active user who matches a Role (MANAGER/DIRECTOR/ADMIN)
async function pickUserIdByRole(db, role) {
  const u = await db.user.findFirst({
    where: { role, isActive: true },
    orderBy: { id: 'asc' },
    select: { id: true },
  });
  return u?.id || null;
}

// Health
app.get('/health', (req, res) => res.json({ ok: true, actor: req.actor }));

// ===== Debug route: verify what the caller can see via RLS =====
app.get('/debug/assignees', async (req, res) => {
  try {
    // Prefer req.actor.email (from ?by=<email>), fall back to header for manual testing
    const email = (req.actor && req.actor.email) || req.header('x-user-email');
    if (!email) return res.status(400).json({ ok: false, error: 'Provide ?by=<email> or x-user-email header' });

    const rows = await withRLS(prisma, { email }, (db) =>
      db.requestAssignee.findMany({
        take: 20,
        orderBy: { id: 'desc' },
        select: { id: true, requestId: true, userId: true, stage: true, active: true },
      })
    );

    res.json({ ok: true, email, rows });
  } catch (err) {
    req.log?.error?.(err, 'debug/assignees failed');
    res.status(400).json({ ok: false, error: err.message });
  }
});

/* ======================================================================
   INBOX — role-scoped visibility (only see items assigned to you at your stage)
   ====================================================================== */
// GET /inbox?role=Manager&userId=<user_id>&by=<email>
app.get('/inbox', async (req, res) => {
  try {
    const role = String(req.query.role || '').toUpperCase().trim();
    const userId = String(req.query.userId || '').trim();
    if (!role || !userId) {
      return res.status(400).json({ error: 'role and userId are required' });
    }

    // RLS identity (from ?by=<email> or header)
    const email = (req.actor && req.actor.email) || req.header('x-user-email');
    if (!email) return res.status(401).json({ error: 'Provide ?by=<email> or x-user-email header' });

    const assignees = await withRLS(prisma, { email }, (db) =>
      db.requestAssignee.findMany({
        where: {
          active: true,               // current assignee only
          stage: role,                // must match role’s stage
          userId,                     // must be assigned to this user
          request: {
            isActive: true,           // request still in-flight
            status: { in: ['PENDING', 'IN_REVIEW'] }
          }
        },
        orderBy: { id: 'asc' },
        include: {
          request: true               // include request payload/title/status for UI
        }
      })
    );

    // 🔸 Return the flat RequestItem[] shape the frontend expects
    const items = assignees
      .map(a => a.request)
      .filter(Boolean)
      .map(r => ({
        id: r.id,
        title: r.title,
        status: r.status,
        createdAt: r.createdAt,
      }));

    res.json(items);
  } catch (err) {
    const status = err.status || 500;
    req.log?.error?.(err, 'inbox failed');
    res.status(status).json({ error: err.message });
  }
});

/* ======================================================================
   CREATE REQUEST — auto-assign FIRST reviewer under the REQUESTER identity
   ====================================================================== */
app.post('/requests', requireRole('EMPLOYEE'), async (req, res) => {
  try {
    const { requesterEmail, typeKey, title, payload } = req.body;
    if (!requesterEmail || !typeKey || !title) {
      return res.status(400).json({ error: 'requesterEmail, typeKey, title are required' });
    }

    const requester = await prisma.user.findUnique({ where: { email: requesterEmail } });
    if (!requester) return res.status(404).json({ error: 'requester not found' });

    const type = await prisma.requestType.findUnique({
      where: { key: typeKey },
      include: { steps: { orderBy: { order: 'asc' } } },
    });
    if (!type) return res.status(404).json({ error: 'type not found' });

    // 1) Create the request
    const request = await prisma.request.create({
      data: {
        typeId: type.id,
        title,
        payload,
        requesterId: requester.id,
        history: { create: { step: 'Created', by: requester.email, comment: '' } },
      },
    });

    // 2) Seed all approval steps
    for (const st of type.steps) {
      await prisma.approval.create({ data: { requestId: request.id, stepId: st.id } });
    }

    // 3) Auto-assign the FIRST reviewer using the requester's RLS identity
    const firstStep = type.steps[0];
    if (firstStep) {
      await withRLS(prisma, { email: requesterEmail }, async (db) => {
        const firstUserId = await pickUserIdByRole(db, firstStep.requiredRole);
        if (!firstUserId) {
          logger.warn({ role: firstStep.requiredRole }, 'No active user for first step role');
          return;
        }
        await db.requestAssignee.create({
          data: {
            requestId: request.id,
            userId: firstUserId,
            stage: firstStep.requiredRole,
            active: true,
          },
        });
      });
    }

    res.json({ id: request.id });
  } catch (e) {
    req.log?.error?.(e, 'failed to create request (auto-assign)');
    res.status(500).json({ error: 'failed to create request' });
  }
});

/* ======================================================================
   GET single request (RLS-aware) — optional includeArchived=true
   ====================================================================== */
app.get('/requests/:id', async (req, res) => {
  try {
    const email = (req.actor && req.actor.email) || req.header('x-user-email');
    if (!email) return res.status(400).json({ error: 'Provide ?by=<email> or x-user-email header' });

    const includeArchived = String(req.query.includeArchived || 'false').toLowerCase() === 'true';

    const request = await withRLS(prisma, { email }, (db) =>
      db.request.findUnique({
        where: { id: req.params.id },
        include: {
          type: { include: { steps: { orderBy: { order: 'asc' } } } },
          approvals: { include: { step: true, approver: true } },
          history: { orderBy: { date: 'asc' } },
          requester: true,
        },
      })
    );

    if (!request || (!includeArchived && !request.isActive)) {
      return res.status(404).json({ error: 'not found' });
    }

    // 🔸 Compute pendingWith = role of the first step whose approval is still null
    let pendingWith = null;
    if (request && request.approvals?.length) {
      const byOrder = [...request.type.steps].sort((a, b) => a.order - b.order);
      const approvalsByStep = new Map(
        request.approvals.map(a => [a.stepId, a])
      );
      const current = byOrder.find(st => (approvalsByStep.get(st.id)?.approved) === null);
      pendingWith = current ? current.requiredRole : null;
    }

    res.json({ ...request, pendingWith });
  } catch (err) {
    req.log?.error?.(err, 'get request failed');
    res.status(500).json({ error: 'failed to get request' });
  }
});

/* ======================================================================
   HISTORY — RLS-aware (owner or Manager/Director/Admin via middleware)
   ====================================================================== */
// GET /requests/:id/history?by=<email>
app.get('/requests/:id/history', requireOwnerOrRole('MANAGER', 'DIRECTOR', 'ADMIN'), async (req, res) => {
  try {
    const email = (req.actor && req.actor.email) || req.header('x-user-email');
    if (!email) return res.status(400).json({ error: 'Provide ?by=<email> or x-user-email header' });

    const rows = await withRLS(prisma, { email }, (db) =>
      db.historyEntry.findMany({
        where: { requestId: req.params.id },
        orderBy: { date: 'asc' },
      })
    );

    res.json(rows);
  } catch (err) {
    req.log?.error?.(err, 'get history failed');
    res.status(500).json({ error: 'failed to get history' });
  }
});

/* ======================================================================
   Approve/Reject current step (RLS + auto flip assignees)
   ====================================================================== */
app.patch('/requests/:id/status', async (req, res) => {
  try {
    const { approved, comment } = req.body;
    if (typeof approved !== 'boolean') {
      return res.status(400).json({ error: '`approved` (boolean) is required' });
    }
    if (!req.actor) return res.status(401).json({ error: 'actor required, pass ?by=<email>' });

    const result = await withRLS(prisma, { email: req.actor.email }, async (db) => {
      // Load request with steps + approvals
      const request = await db.request.findUnique({
        where: { id: req.params.id },
        include: {
          type: { include: { steps: { orderBy: { order: 'asc' } } } },
          approvals: { include: { step: true } },
        },
      });
      if (!request || !request.isActive) throw Object.assign(new Error('request not found'), { status: 404 });

      // Find current pending step
      const ordered = request.type.steps;
      const approvals = request.approvals;
      const current = ordered.find((s) => {
        const a = approvals.find((x) => x.stepId === s.id);
        return a && a.approved === null;
      });
      if (!current) throw Object.assign(new Error('no pending step (already completed?)'), { status: 400 });

      // Role check: must be current.requiredRole or ADMIN (app-level RBAC)
      if (req.actor.role !== current.requiredRole && req.actor.role !== 'ADMIN') {
        throw Object.assign(new Error(`requires ${current.requiredRole}`), { status: 403 });
      }

      // Mark approval for this step
      const curApproval = approvals.find((x) => x.stepId === current.id);
      await db.approval.update({
        where: { id: curApproval.id },
        data: {
          approved,
          comment: comment ?? null,
          approverId: req.actor.id,
          actedAt: new Date(),
        },
      });

      // Write to history (decision)
      await db.historyEntry.create({
        data: {
          requestId: request.id,
          step: approved ? `${current.name} Approved` : `${current.name} Rejected`,
          by: req.actor.email,
          role: req.actor.role,
          comment: comment ?? '',
        },
      });

      // Deactivate any current assignees
      await db.requestAssignee.updateMany({
        where: { requestId: request.id, active: true },
        data: { active: false },
      });

      if (!approved) {
        // ❌ Rejected: set status + archive + add "Archived" history entry
        const newStatus = 'REJECTED';
        await db.request.update({
          where: { id: request.id },
          data: {
            status: newStatus,
            isActive: false, // archive on rejection
            history: {
              create: {
                step: 'Archived',
                by: req.actor.email,
                role: req.actor.role,
                comment: 'Auto-archive on rejection'
              }
            }
          }
        });
        return { step: current.name, approved, status: newStatus, archived: true };
      }

      // ✅ Approved: find next step
      const nextStep = await db.approvalStep.findFirst({
        where: { typeId: request.typeId, order: { gt: current.order } },
        orderBy: { order: 'asc' },
      });

      if (nextStep) {
        // Assign next reviewer and continue
        const nextUserId = await pickUserIdByRole(db, nextStep.requiredRole);
        if (!nextUserId) {
          throw Object.assign(new Error(`No active user for role ${nextStep.requiredRole}`), { status: 409 });
        }

        await db.requestAssignee.create({
          data: {
            requestId: request.id,
            userId: nextUserId,
            stage: nextStep.requiredRole,
            active: true,
          },
        });

        const newStatus = 'IN_REVIEW';
        await db.request.update({ where: { id: request.id }, data: { status: newStatus } });
        return { step: current.name, approved, status: newStatus, nextRole: nextStep.requiredRole };
      } else {
        // No next step → complete and archive
        const newStatus = 'COMPLETED';
        await db.request.update({
          where: { id: request.id },
          data: { status: newStatus, isActive: false },
        });
        return { step: current.name, approved, status: newStatus, done: true };
      }
    });

    res.json(result);
  } catch (e) {
    const status = e.status || 500;
    req.log?.error?.(e, 'failed to update status');
    res.status(status).json({ error: e.message });
  }
});

// Archive
app.patch('/requests/:id/archive', requireRole('ADMIN'), async (req, res) => {
  await prisma.request.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ archived: true });
});

// ===== LIST requests (restored) =====
// GET /requests?mine=true&status=PENDING&type=LEAVE&page=1&pageSize=20&archived=false
app.get('/requests', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page ?? '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize ?? '20', 10)));
    const skip = (page - 1) * pageSize;

    const isArchived = (req.query.archived ?? 'false').toLowerCase() === 'true';
    const mine = (req.query.mine ?? 'false').toLowerCase() === 'true';
    const status = req.query.status?.toString().trim();
    const typeKey = req.query.type?.toString().trim();

    const where = {
      isActive: !isArchived,
      ...(status ? { status } : {}),
      ...(mine && req.actor ? { requesterId: req.actor.id } : {}),
      ...(typeKey ? { type: { key: typeKey } } : {}),
    };

    const [total, data] = await Promise.all([
      prisma.request.count({ where }),
      prisma.request.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          type: true,
          requester: { select: { id: true, email: true, name: true, role: true } },
        },
      }),
    ]);

    res.json({ page, pageSize, total, totalPages: Math.ceil(total / pageSize), data });
  } catch (e) {
    req.log?.error?.(e, 'failed to list requests');
    res.status(500).json({ error: e.message });
  }
});

module.exports = { app, logger };
