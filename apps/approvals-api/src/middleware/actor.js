// src/middleware/actor.js
const { PrismaClient } = require('@prisma/client');
const { withAccelerate } = require('@prisma/extension-accelerate');

// Use the Accelerate URL so lookups work over HTTPS:443
const prisma = new PrismaClient({
  datasourceUrl: process.env.PRISMA_ACCELERATE_URL,
}).$extends(withAccelerate());

/**
 * Dev/testing actor resolver:
 * - Query:  ?by=<id|email|name>&role=<Role>
 * - Headers: x-actor-id, x-actor-role
 * Fallbacks if DB is unreachable: still attach an actor from query/header.
 */
async function actor(req, res, next) {
  const rawId = req.query.by || req.header('x-actor-id') || null;
  const rawRole = (req.query.role || req.header('x-actor-role') || '').toUpperCase().trim();

  // default/fallback actor (no DB)
  const fallback = {
    id: null,
    email: rawId || null,
    name: rawId || null,
    role: rawRole || 'EMPLOYEE',
    user: null,
  };

  if (!rawId) {
    req.actor = fallback;
    return next();
  }

  try {
    // Try resolve from DB (best effort)
    const user =
      (await prisma.user.findUnique({ where: { id: rawId } })) ||
      (await prisma.user.findUnique({ where: { email: rawId } })) ||
      (await prisma.user.findFirst({ where: { name: rawId } }));

    if (!user) {
      req.actor = fallback; // unknown user, still proceed
      return next();
    }

    req.actor = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role, // authoritative from DB
      user,
    };
    return next();
  } catch (err) {
    // If Prisma can’t reach DB, don’t block the request
    req.actor = fallback;
    return next();
  }
}

module.exports = { actor };
