// src/routes/users.js
const express = require('express');
const bcrypt = require('bcryptjs'); // same lib used in auth.js
const router = express.Router();

/**
 * Shape used by all user responses from this router
 */
function userSelect() {
  return {
    id: true,
    email: true,
    name: true,
    role: true,
    isActive: true,
    departmentId: true,
    department: {
      select: {
        id: true,
        name: true,
      },
    },
    createdAt: true,
    updatedAt: true,
  };
}

/**
 * GET /api/users
 * Lists all active users with their departments.
 * (Protected by requireRole('ADMIN') in app.js)
 */
router.get('/', async (req, res) => {
  try {
    const prisma = req.db;

    const users = await prisma.user.findMany({
  // include both active + inactive; UI will show status
  orderBy: { createdAt: 'asc' },
  select: userSelect(),
});


    res.json(users);
  } catch (err) {
    req.log?.error?.(err, 'list users failed');
    res.status(500).json({ error: 'failed to list users' });
  }
});

/**
 * POST /api/users
 * Admin creates a new user (with passwordHash so they can log in).
 */
router.post('/', async (req, res) => {
  try {
    const prisma = req.db;

    let { name, email, role, departmentId, isActive, password } = req.body;

    name = (name || '').trim();
    email = (email || '').trim().toLowerCase();
    role = String(role || 'EMPLOYEE').toUpperCase();

    if (!name || !email) {
      return res
        .status(400)
        .json({ error: 'name and email are required' });
    }

    if (!password || String(password).length < 4) {
      return res
        .status(400)
        .json({ error: 'password is required (min 4 characters)' });
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return res.status(409).json({ error: 'email already in use' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role,
        isActive: isActive !== false,
        departmentId: departmentId || null,
        passwordHash,
      },
      select: userSelect(),
    });

    res.status(201).json(user);
  } catch (err) {
    req.log?.error?.(err, 'create user failed');
    res.status(500).json({ error: 'failed to create user' });
  }
});

/**
 * PATCH /api/users/:id
 * Admin updates existing user (name, role, department, active, password).
 * Password is optional; if provided it will be reset.
 */
router.patch('/:id', async (req, res) => {
  try {
    const prisma = req.db;
    const { id } = req.params;

    const data = {};
    if (typeof req.body.name === 'string') {
      data.name = req.body.name.trim();
    }
    if (typeof req.body.role === 'string') {
      data.role = req.body.role.toUpperCase();
    }
    if (typeof req.body.departmentId === 'string') {
      data.departmentId = req.body.departmentId || null;
    }
    if (typeof req.body.isActive === 'boolean') {
      data.isActive = req.body.isActive;
    }

    if (req.body.password) {
      const hash = await bcrypt.hash(String(req.body.password), 10);
      data.passwordHash = hash;
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: userSelect(),
    });

    res.json(user);
  } catch (err) {
    req.log?.error?.(err, 'update user failed');
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'user not found' });
    }
    res.status(500).json({ error: 'failed to update user' });
  }
});

/**
 * DELETE /api/users/:id
 * Hard-delete a user IF they are not referenced by any requests/approvals.
 * Otherwise, we tell the admin to deactivate instead.
 */
router.delete('/:id', async (req, res) => {
  try {
    const prisma = req.db;
    const { id } = req.params;

    // Check if the user is referenced anywhere important
    const [requestCount, approvalCount, assigneeCount] = await Promise.all([
      prisma.request.count({ where: { requesterId: id } }),
      prisma.approval.count({ where: { approverId: id } }).catch(() => 0),
      prisma.requestAssignee
        .count({ where: { userId: id } })
        .catch(() => 0),
    ]);

    if (requestCount > 0 || approvalCount > 0 || assigneeCount > 0) {
      return res.status(400).json({
        error:
          'Cannot delete a user that is already used in requests/approvals. ' +
          'Set them as Inactive instead.',
      });
    }

    await prisma.user.delete({ where: { id } });

    res.json({ ok: true });
  } catch (err) {
    req.log?.error?.(err, 'delete user failed');
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'user not found' });
    }
    res.status(500).json({ error: 'failed to delete user' });
  }
});

module.exports = router;
