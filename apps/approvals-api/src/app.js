// src/app.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const pinoHttp = require('pino-http');
const pino = require('pino');
const { PrismaClient, RequestStatus } = require('@prisma/client');
const { withAccelerate } = require('@prisma/extension-accelerate');
const { issuePublicCode } = require('./services/codegen');

const { actor } = require('./middleware/actor');
const { requireRole } = require('./middleware/perm');

// Routers
const requestTypesRouter = require('./routes/request-types');
const requestDetailsRouter = require('./routes/request-details');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');

const app = express();
const prisma = new PrismaClient({
  datasourceUrl: process.env.PRISMA_ACCELERATE_URL,
}).$extends(withAccelerate());

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

// ---------- Core middleware ----------
app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(cors());
app.use(express.json());

// attach prisma/log to req
app.use((req, _res, next) => {
  req.db = prisma;
  req.log = req.log || logger;
  next();
});

// ---------- Auth routes ----------
app.use('/auth', authRouter);

// attach req.actor AFTER /auth
app.use(actor);

// ---------- ROUTERS ----------
app.use('/api/request-details', requestDetailsRouter);
app.use('/api/users', requireRole('ADMIN'), usersRouter);

// NEW cleaned request-types routing
app.use('/request-types', requestTypesRouter);

// ---------- RLS helper ----------
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

async function pickUserIdByRole(db, role, departmentId) {
  const where = {
    role,
    isActive: true,
    ...(departmentId ? { departmentId } : {}),
  };

  const u = await db.user.findFirst({
    where,
    orderBy: { id: 'asc' },
    select: { id: true },
  });

  return u?.id || null;
}

// ---------- Health ----------
app.get('/health', (req, res) => res.json({ ok: true, actor: req.actor }));

// ---------- Debug RLS ----------
app.get('/debug/assignees', async (req, res) => {
  try {
    const email = (req.actor && req.actor.email) || req.header('x-user-email');
    if (!email) {
      return res.status(400).json({
        ok: false,
        error: 'Provide ?by=<email> or x-user-email header',
      });
    }

    const rows = await withRLS(prisma, { email }, (db) =>
      db.requestAssignee.findMany({
        take: 20,
        orderBy: { id: 'desc' },
        select: {
          id: true,
          requestId: true,
          userId: true,
          stage: true,
          active: true,
        },
      })
    );

    res.json({ ok: true, email, rows });
  } catch (err) {
    req.log?.error?.(err);
    res.status(400).json({ ok: false, error: err.message });
  }
});

/* ======================================================================
   DEPARTMENTS — ADMIN
   ====================================================================== */
app.get('/departments', requireRole('ADMIN'), async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(departments);
  } catch (err) {
    req.log?.error?.(err);
    res.status(500).json({ error: 'failed to list departments' });
  }
});

app.post('/departments', requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    const dept = await prisma.department.upsert({
      where: { name: String(name).trim() },
      update: { description: description ?? null },
      create: {
        name: String(name).trim(),
        description: description ?? null,
      },
    });

    res.status(201).json(dept);
  } catch (err) {
    req.log?.error?.(err);
    res.status(500).json({ error: 'failed to save department' });
  }
});

app.delete('/departments/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const id = req.params.id;

    const inUse = await prisma.user.count({
      where: { departmentId: id },
    });

    if (inUse > 0) {
      return res.status(400).json({
        error: 'Cannot delete a department that still has users assigned.',
      });
    }

    await prisma.department.delete({
      where: { id },
    });

    res.json({ ok: true });
  } catch (err) {
    req.log?.error?.(err);
    res.status(500).json({ error: 'failed to delete department' });
  }
});

app.patch('/users/:id/department', requireRole('ADMIN'), async (req, res) => {
  try {
    const userId = req.params.id;
    const { departmentId } = req.body;

    if (!departmentId) {
      return res.status(400).json({ error: 'departmentId is required' });
    }

    const dept = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!dept) {
      return res.status(404).json({ error: 'department not found' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { departmentId: dept.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        departmentId: true,
      },
    });

    res.json(user);
  } catch (err) {
    req.log?.error?.(err);
    res.status(500).json({ error: 'failed to assign department to user' });
  }
});

/* ======================================================================
   ADMIN - USERS (create & update)
   ====================================================================== */

// Create a new user (Admin only)
app.post('/api/users', requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, email, role, departmentId, isActive } = req.body || {};

    const trimmedName = (name || '').toString().trim();
    const trimmedEmail = (email || '').toString().toLowerCase().trim();
    const roleUpper = (role || '').toString().toUpperCase().trim();

    if (!trimmedName || !trimmedEmail) {
      return res.status(400).json({ error: 'name and email are required' });
    }

    // allow the new HR_OFFICER role
    const allowedRoles = [
      'EMPLOYEE',
      'MANAGER',
      'DIRECTOR',
      'ADMIN',
      'HR_OFFICER',
    ];
    if (!allowedRoles.includes(roleUpper)) {
      return res.status(400).json({ error: 'invalid role' });
    }

    const existing = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      select: { id: true },
    });

    if (existing) {
      return res
        .status(409)
        .json({ error: 'A user with this email already exists.' });
    }

    let deptId = null;
    if (departmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: departmentId },
      });
      if (!dept) {
        return res.status(404).json({ error: 'department not found' });
      }
      deptId = dept.id;
    }

    const user = await prisma.user.create({
      data: {
        name: trimmedName,
        email: trimmedEmail,
        role: roleUpper,
        departmentId: deptId,
        isActive: typeof isActive === 'boolean' ? isActive : true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        departmentId: true,
      },
    });

    res.status(201).json(user);
  } catch (err) {
    req.log?.error?.(err);
    res.status(500).json({ error: 'failed to create user' });
  }
});

// Update basic user fields (role / name / isActive / department)
app.patch('/api/users/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, role, isActive, departmentId } = req.body || {};

    const data = {};
    const allowedRoles = [
      'EMPLOYEE',
      'MANAGER',
      'DIRECTOR',
      'ADMIN',
      'HR_OFFICER',
    ];

    if (name !== undefined) {
      const t = String(name).trim();
      if (!t) {
        return res.status(400).json({ error: 'name cannot be empty' });
      }
      data.name = t;
    }

    if (role !== undefined) {
      const roleUpper = String(role).toUpperCase().trim();
      if (!allowedRoles.includes(roleUpper)) {
        return res.status(400).json({ error: 'invalid role' });
      }
      data.role = roleUpper;
    }

    if (typeof isActive === 'boolean') {
      data.isActive = isActive;
    }

    if (departmentId !== undefined) {
      if (departmentId === null || departmentId === '') {
        data.departmentId = null;
      } else {
        const dept = await prisma.department.findUnique({
          where: { id: departmentId },
        });
        if (!dept) {
          return res.status(404).json({ error: 'department not found' });
        }
        data.departmentId = dept.id;
      }
    }

    if (Object.keys(data).length === 0) {
      return res
        .status(400)
        .json({ error: 'no updatable fields provided' });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        departmentId: true,
      },
    });

    res.json(updated);
  } catch (err) {
    req.log?.error?.(err);
    res.status(500).json({ error: 'failed to update user' });
  }
});

/* ======================================================================
   INBOX  (old RLS endpoint, still used in some places)
   ====================================================================== */
app.get('/inbox', async (req, res) => {
  try {
    const role = String(req.query.role || '').toUpperCase().trim();
    const userId = String(req.query.userId || '').trim();

    if (!role || !userId) {
      return res.status(400).json({ error: 'role and userId are required' });
    }

    const email =
      (req.actor && req.actor.email) || req.header('x-user-email');
    if (!email) {
      return res
        .status(401)
        .json({ error: 'Provide ?by=<email> or x-user-email header' });
    }

    const assignees = await withRLS(prisma, { email }, (db) =>
      db.requestAssignee.findMany({
        where: {
          active: true,
          stage: role,
          userId,
          request: {
            isActive: true,
            status: { in: ['PENDING', 'IN_REVIEW'] },
          },
        },
        orderBy: { id: 'asc' },
        include: {
          request: {
            include: {
              type: true,
              requester: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  role: true,
                },
              },
            },
          },
        },
      })
    );

    const items = assignees
      .map((a) => a.request)
      .filter(Boolean)
      .map((r) => ({
        id: r.id,
        publicCode: r.publicCode,
        title: r.title,
        status: r.status,
        createdAt: r.createdAt,
        type: r.type,
        requester: r.requester,
        payload: r.payload,
      }));

    res.json(items);
  } catch (err) {
    req.log?.error?.(err);
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

/* ======================================================================
   CREATE REQUEST  (legacy, using typeKey)
   ====================================================================== */
app.post('/requests', requireRole('EMPLOYEE'), async (req, res) => {
  try {
    const callerEmail =
      (req.actor && req.actor.email) || req.header('x-user-email');
    const callerId = (req.actor && req.actor.id) || req.header('x-user-id');
    const callerRole =
      (req.actor && req.actor.role) || req.header('x-user-role');

    const { typeKey, title, payload } = req.body;

    if (!callerEmail || !callerId) {
      return res.status(400).json({ error: 'missing caller identity' });
    }

    if (!typeKey || !title) {
      return res
        .status(400)
        .json({ error: 'typeKey and title are required' });
    }

    const requester = await prisma.user.findUnique({
      where: { email: callerEmail },
    });

    if (!requester) {
      return res.status(404).json({ error: 'requester not found' });
    }

    const type = await prisma.requestType.findUnique({
      where: { key: typeKey },
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    if (!type) {
      return res.status(404).json({ error: 'type not found' });
    }

    const publicCode = await issuePublicCode(prisma, type.id);

    const request = await prisma.request.create({
      data: {
        typeId: type.id,
        title,
        payload,
        requesterId: requester.id,
        publicCode,
        history: {
          create: {
            step: 'Created',
            by: callerEmail,
            role: callerRole || 'EMPLOYEE',
            comment: '',
          },
        },
      },
    });

    // Pre-create approvals for all steps
    for (const st of type.steps) {
      await prisma.approval.create({
        data: { requestId: request.id, stepId: st.id },
      });
    }

    // Assign first step approver:
    const firstStep = type.steps[0];
    if (firstStep) {
      await withRLS(prisma, { email: callerEmail }, async (db) => {
        // first step approver is in *requester’s department*
        const firstUserId = await pickUserIdByRole(
          db,
          firstStep.requiredRole,
          requester.departmentId || null
        );

        if (!firstUserId) {
          logger.warn(
            {
              role: firstStep.requiredRole,
              requestId: request.id,
              requesterDeptId: requester.departmentId,
            },
            'No active user for first step role in requester department'
          );
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

    res.json({ id: request.id, publicCode: request.publicCode });
  } catch (e) {
    req.log?.error?.(e);
    res.status(500).json({ error: 'failed to create request' });
  }
});

/* ======================================================================
   GET REQUEST
   ====================================================================== */
app.get('/requests/:id', async (req, res) => {
  try {
    const callerEmail =
      (req.actor && req.actor.email) || req.header('x-user-email');
    const callerId =
      (req.actor && req.actor.id) || req.header('x-user-id');
    const callerRole =
      (req.actor && req.actor.role) || req.header('x-user-role');

    if (!callerEmail || !callerId) {
      return res.status(400).json({
        error: 'Provide identity headers (x-user-email / x-user-id)',
      });
    }

    const includeArchived =
      String(req.query.includeArchived || 'false').toLowerCase() === 'true';

    const rawRequest = await prisma.request.findUnique({
      where: { id: req.params.id },
      include: {
        type: { include: { steps: { orderBy: { order: 'asc' } } } },
        approvals: { include: { step: true, approver: true } },
        history: { orderBy: { date: 'asc' } },
        requester: true,
      },
    });

    if (!rawRequest || (!includeArchived && !rawRequest.isActive)) {
      return res.status(404).json({ error: 'not found' });
    }

    function computePendingWith(reqData) {
      let pendingWith = null;
      if (reqData && reqData.approvals?.length) {
        const byOrder = [...reqData.type.steps].sort(
          (a, b) => a.order - b.order
        );
        const approvalsByStep = new Map(
          reqData.approvals.map((a) => [a.stepId, a])
        );
        const current = byOrder.find(
          (st) => approvalsByStep.get(st.id)?.approved === null
        );
        pendingWith = current ? current.requiredRole : null;
      }
      return pendingWith;
    }

    function toFrontendShape(dbReq) {
      return {
        id: dbReq.id,
        publicCode: dbReq.publicCode,
        title: dbReq.title,
        status: dbReq.status,
        payload: dbReq.payload,
        isActive: dbReq.isActive,
        createdAt: dbReq.createdAt,
        updatedAt: dbReq.updatedAt,
        type: dbReq.type?.key || null,
        typeCode: dbReq.type?.code || null,
        currentStage: computePendingWith(dbReq),
        createdBy: dbReq.requester
          ? {
              id: dbReq.requester.id,
              email: dbReq.requester.email,
              name: dbReq.requester.name,
              role: dbReq.requester.role,
            }
          : null,
        history: dbReq.history || [],
        approvals: dbReq.approvals || [],
        _raw: { requesterId: dbReq.requesterId, type: dbReq.type },
      };
    }

    const isOwner = rawRequest.requesterId === callerId;
    if (isOwner) {
      return res.json(toFrontendShape(rawRequest));
    }

    const requestViaRLS = await withRLS(prisma, { email: callerEmail }, (db) =>
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

    if (requestViaRLS && (includeArchived || requestViaRLS.isActive)) {
      return res.json(toFrontendShape(requestViaRLS));
    }

    const activeAssignment = await prisma.requestAssignee.findFirst({
      where: { requestId: req.params.id, userId: callerId, active: true },
      select: { stage: true, active: true },
    });

    if (activeAssignment && activeAssignment.active) {
      return res.json(toFrontendShape(rawRequest));
    }

    return res.status(403).json({
      error:
        'forbidden (owner, active assignee, or privileged role required)',
    });
  } catch (err) {
    req.log?.error?.(err);
    res.status(500).json({ error: 'failed to get request' });
  }
});

/* ======================================================================
   HISTORY
   ====================================================================== */
app.get('/requests/:id/history', async (req, res) => {
  try {
    const callerEmail =
      (req.actor && req.actor.email) || req.header('x-user-email');
    const callerId =
      (req.actor && req.actor.id) || req.header('x-user-id');

    if (!callerEmail || !callerId) {
      return res.status(400).json({
        error: 'Provide identity headers (x-user-email / x-user-id)',
      });
    }

    const baseReq = await prisma.request.findUnique({
      where: { id: req.params.id },
      include: { requester: true },
    });

    if (!baseReq) return res.status(404).json({ error: 'not found' });

    const isOwner = baseReq.requesterId === callerId;
    if (isOwner) {
      const rows = await prisma.historyEntry.findMany({
        where: { requestId: req.params.id },
        orderBy: { date: 'asc' },
      });
      return res.json(rows);
    }

    const rowsViaRLS = await withRLS(prisma, { email: callerEmail }, (db) =>
      db.historyEntry.findMany({
        where: { requestId: req.params.id },
        orderBy: { date: 'asc' },
      })
    );

    if (rowsViaRLS && rowsViaRLS.length > 0) return res.json(rowsViaRLS);

    const activeAssignment = await prisma.requestAssignee.findFirst({
      where: { requestId: req.params.id, userId: callerId, active: true },
      select: { stage: true, active: true },
    });

    if (activeAssignment && activeAssignment.active) {
      const rows = await prisma.historyEntry.findMany({
        where: { requestId: req.params.id },
        orderBy: { date: 'asc' },
      });
      return res.json(rows);
    }

    return res.status(403).json({
      error:
        'forbidden (owner, active assignee, or privileged role required)',
    });
  } catch (err) {
    req.log?.error?.(err);
    res.status(500).json({ error: 'failed to get history' });
  }
});

/* ======================================================================
   APPROVE / REJECT
   ====================================================================== */
app.patch('/requests/:id/status', async (req, res) => {
  try {
    const { approved, comment } = req.body;
    if (typeof approved !== 'boolean') {
      return res
        .status(400)
        .json({ error: '`approved` (boolean) is required' });
    }

    if (!req.actor) {
      return res
        .status(401)
        .json({ error: 'actor required, pass ?by=<email>' });
    }

    const result = await withRLS(
      prisma,
      { email: req.actor.email },
      async (db) => {
        const request = await db.request.findUnique({
          where: { id: req.params.id },
          include: {
            type: {
              include: {
                steps: { orderBy: { order: 'asc' } },
              },
            },
            approvals: { include: { step: true } },
            requester: {
              select: {
                id: true,
                departmentId: true,
              },
            },
          },
        });

        if (!request || !request.isActive) {
          throw Object.assign(new Error('request not found'), { status: 404 });
        }

        const ordered = request.type.steps;
        const approvals = request.approvals;

        const current = ordered.find((s) => {
          const a = approvals.find((x) => x.stepId === s.id);
          return a && a.approved === null;
        });

        if (!current) {
          throw Object.assign(
            new Error('no pending step (already completed?)'),
            { status: 400 }
          );
        }

        // role check: only the required role (or ADMIN) may act
        if (req.actor.role !== current.requiredRole && req.actor.role !== 'ADMIN') {
          throw Object.assign(
            new Error(`requires ${current.requiredRole}`),
            { status: 403 }
          );
        }

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

        await db.historyEntry.create({
          data: {
            requestId: request.id,
            step: approved
              ? `${current.name} Approved`
              : `${current.name} Rejected`,
            by: req.actor.email,
            role: req.actor.role,
            comment: comment ?? '',
          },
        });

        // deactivate current assignees
        await db.requestAssignee.updateMany({
          where: { requestId: request.id, active: true },
          data: { active: false },
        });

        // If REJECTED -> final, auto-archive
        if (!approved) {
          const newStatus = 'REJECTED';
          await db.request.update({
            where: { id: request.id },
            data: {
              status: newStatus,
              isActive: false,
              history: {
                create: {
                  step: 'Archived',
                  by: req.actor.email,
                  role: req.actor.role,
                  comment: 'Auto-archive on rejection',
                },
              },
            },
          });

          return {
            step: current.name,
            approved,
            status: newStatus,
            archived: true,
          };
        }

        // At this point, the current step was APPROVED.
        // Decide what happens next.

        const nextStep = await db.approvalStep.findFirst({
          where: { typeId: request.typeId, order: { gt: current.order } },
          orderBy: { order: 'asc' },
        });

        // Helper: find HR department (by name "HR")
        const hrDept = await db.department.findFirst({
          where: { name: 'HR' },
          select: { id: true },
        });
        const hrDeptId = hrDept?.id || null;
        const requesterDeptId = request.requester?.departmentId || null;
        const isLeave = request.type.key === 'LEAVE';

        // --------- LEAVE REQUEST SPECIAL LOGIC ---------
        if (isLeave) {
          // Case A: requester is in HR -> their manager approval is final
          if (requesterDeptId && hrDeptId && requesterDeptId === hrDeptId) {
            const newStatus = 'COMPLETED';
            await db.request.update({
              where: { id: request.id },
              data: { status: newStatus, isActive: false },
            });

            return {
              step: current.name,
              approved,
              status: newStatus,
              done: true,
            };
          }

          // Case B: non-HR requester and there *is* a next step:
          // next approver is nextStep.requiredRole in HR department
          if (nextStep && hrDeptId) {
            const nextUserId = await pickUserIdByRole(
              db,
              nextStep.requiredRole, // e.g. MANAGER or HR_OFFICER
              hrDeptId
            );

            if (!nextUserId) {
              throw Object.assign(
                new Error(
                  `No HR approver found for ${nextStep.requiredRole} in HR department`
                ),
                { status: 409 }
              );
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
            await db.request.update({
              where: { id: request.id },
              data: { status: newStatus },
            });

            return {
              step: current.name,
              approved,
              status: newStatus,
              nextRole: nextStep.requiredRole,
            };
          }

          // If for some reason there is no HR step, treat this as final:
          const newStatus = 'COMPLETED';
          await db.request.update({
            where: { id: request.id },
            data: { status: newStatus, isActive: false },
          });

          return {
            step: current.name,
            approved,
            status: newStatus,
            done: true,
          };
        }
        // --------- END LEAVE LOGIC ---------

        // Default behaviour for all other request types:
        if (nextStep) {
          const nextUserId = await pickUserIdByRole(
            db,
            nextStep.requiredRole,
            request.type?.departmentId || null
          );

          if (!nextUserId) {
            throw Object.assign(
              new Error(
                `No active user for role ${nextStep.requiredRole} in this department`
              ),
              { status: 409 }
            );
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
          await db.request.update({
            where: { id: request.id },
            data: { status: newStatus },
          });

          return {
            step: current.name,
            approved,
            status: newStatus,
            nextRole: nextStep.requiredRole,
          };
        }

        // No next step -> completed
        const newStatus = 'COMPLETED';
        await db.request.update({
          where: { id: request.id },
          data: { status: newStatus, isActive: false },
        });

        return {
          step: current.name,
          approved,
          status: newStatus,
          done: true,
        };
      }
    );

    res.json(result);
  } catch (e) {
    const status = e.status || 500;
    req.log?.error?.(e);
    res.status(status).json({ error: e.message });
  }
});

/* ======================================================================
   LIST REQUESTS  (box = my | inbox | archive)
   ====================================================================== */
app.get('/requests', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page ?? '1', 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(req.query.pageSize ?? '20', 10))
    );
    const skip = (page - 1) * pageSize;

    const boxParam = String(req.query.box || '').toLowerCase(); // "my" | "inbox" | "archive"
    const statusParam = req.query.status?.toString().trim();
    const typeKey = req.query.type?.toString().trim();

    let callerId =
      (req.actor && req.actor.id) || req.header('x-user-id') || null;
    const callerEmail =
      (req.actor && req.actor.email) || req.header('x-user-email') || null;
    let callerRole =
      (req.actor && req.actor.role) || req.header('x-user-role') || null;

    if (callerRole) {
      callerRole = String(callerRole).toUpperCase().trim();
    }

    // If we only have email, resolve id once
    if (!callerId && callerEmail) {
      const u = await prisma.user.findUnique({
        where: { email: callerEmail },
        select: { id: true },
      });
      callerId = u?.id ?? null;
    }

    if (!callerId) {
      return res
        .status(401)
        .json({ error: 'identity required (x-user-id / jwt)' });
    }

    // Base filter used in all branches
    const baseFilter = {
      ...(statusParam ? { status: statusParam } : {}),
      ...(typeKey ? { type: { key: typeKey } } : {}),
    };

    let where;

    /* -------------------- INBOX -------------------- */
    if (boxParam === 'inbox') {
      // Who sees what in inbox:
      // - ADMIN: all pending/in_review requests
      // - everyone else: only requests assigned to *them* (RequestAssignee)

      const pendingStatuses = [RequestStatus.PENDING];
      if (RequestStatus.IN_REVIEW) {
        pendingStatuses.push(RequestStatus.IN_REVIEW);
      }

      if (callerRole === 'ADMIN') {
        where = {
          ...baseFilter,
          isActive: true,
          status: { in: pendingStatuses },
        };
      } else {
        where = {
          ...baseFilter,
          isActive: true,
          status: { in: pendingStatuses },
          assignees: {
            some: {
              userId: callerId,
              active: true,
            },
          },
        };
      }
    }

    /* -------------------- ARCHIVE -------------------- */
    else if (boxParam === 'archive') {
      // Archived statuses (final states)
      const archivedStatuses = [];
      if (RequestStatus.APPROVED) archivedStatuses.push(RequestStatus.APPROVED);
      if (RequestStatus.REJECTED) archivedStatuses.push(RequestStatus.REJECTED);
      if (RequestStatus.COMPLETED) archivedStatuses.push(RequestStatus.COMPLETED);
      if (RequestStatus.ARCHIVED) archivedStatuses.push(RequestStatus.ARCHIVED);

      if (!callerRole) {
        return res
          .status(401)
          .json({ error: 'role required to view archive' });
      }

      // baseArchived: anything inactive OR in a final status
      const baseArchived = {
        ...baseFilter,
        OR: [
          { isActive: false },
          { status: { in: archivedStatuses } },
        ],
      };

      if (callerRole === 'ADMIN') {
        // Admin: see ALL archived
        where = baseArchived;
      } else if (callerRole === 'EMPLOYEE') {
        // Employee: ONLY their own archived requests
        where = {
          ...baseArchived,
          requesterId: callerId,
        };
      } else {
        // Manager / Director / HR_OFFICER: own + their department’s archived
        const actorUser = await prisma.user.findUnique({
          where: { id: callerId },
          select: {
            departmentId: true,
            department: { select: { name: true } },
          },
        });

        const deptId = actorUser?.departmentId || null;

        if (!deptId) {
          // no department -> safest: only own archived
          where = {
            ...baseArchived,
            requesterId: callerId,
          };
        } else {
          where = {
            ...baseArchived,
            OR: [
              { requesterId: callerId },
              { requester: { departmentId: deptId } },
            ],
          };
        }
      }
    }

    /* -------------------- MY (default) -------------------- */
    else {
      // box="my" or no box: active requests created by the caller
      where = {
        ...baseFilter,
        isActive: true,
        requesterId: callerId,
      };
    }

    const [total, data] = await Promise.all([
      prisma.request.count({ where }),
      prisma.request.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          type: true,
          requester: {
            select: { id: true, email: true, name: true, role: true },
          },
        },
      }),
    ]);

    res.json({
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      data,
    });
  } catch (e) {
    req.log?.error?.(e);
    res.status(500).json({ error: e.message });
  }
});

// EXPORT
module.exports = { app, logger };
