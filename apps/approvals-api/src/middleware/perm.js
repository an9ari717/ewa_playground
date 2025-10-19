// src/middleware/perm.js
const { PrismaClient } = require('@prisma/client');
const { withAccelerate } = require('@prisma/extension-accelerate');

const prisma = new PrismaClient({
  datasourceUrl: process.env.PRISMA_ACCELERATE_URL,
}).$extends(withAccelerate());


/** Allow only specified roles (ADMIN always allowed) */
function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.actor?.role;
    if (!role) return res.status(401).json({ error: 'no actor' });
    if (role === 'ADMIN') return next();
    if (!roles.includes(role)) {
      return res.status(403).json({ error: `requires one of: ${roles.join(', ')}` });
    }
    next();
  };
}

/** Allow the requester (owner) OR any of the given roles (ADMIN always allowed).
 * If DB is unreachable, return 503 instead of crashing HTML.
 */
function requireOwnerOrRole(...roles) {
  return async (req, res, next) => {
    const role = req.actor?.role;
    if (!role) return res.status(401).json({ error: 'no actor' });

    // Privileged roles bypass DB lookup
    if (role === 'ADMIN' || roles.includes(role)) return next();

    // Otherwise must be the owner (requires DB lookup)
    const id = String(req.params.id || '');
    if (!id) return res.status(400).json({ error: 'missing id' });

    try {
      const reqRow = await prisma.request.findUnique({
        where: { id },
        select: { requesterId: true },
      });

      if (!reqRow) return res.status(404).json({ error: 'request not found' });
      if (req.actor?.id && req.actor.id === reqRow.requesterId) return next();

      return res.status(403).json({ error: 'forbidden (owner or privileged role required)' });
    } catch (e) {
      // Database temporarily unavailable -> clean 503
      return res.status(503).json({ error: 'database unavailable, try again' });
    }
  };
}

module.exports = { requireRole, requireOwnerOrRole };
