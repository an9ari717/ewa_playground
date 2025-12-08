// src/middleware/actor.js
const { PrismaClient } = require("@prisma/client");
const { withAccelerate } = require("@prisma/extension-accelerate");

// Use Accelerate URL so lookups work over HTTPS:443
const prisma = new PrismaClient({
  datasourceUrl: process.env.PRISMA_ACCELERATE_URL,
}).$extends(withAccelerate());

/**
 * Resolve req.actor from:
 *  - x-user-id / x-user-email headers (sent by frontend)
 *  - ?by=<id|email|name> (for tools like Thunder Client)
 *
 * Role ALWAYS comes from the DB user, never from headers.
 */
async function actor(req, res, next) {
  // What the frontend is actually sending now
  const headerEmail = req.header("x-user-email") || null;
  const headerId = req.header("x-user-id") || null;

  // Also allow ?by=... and x-actor-id for dev/testing
  const rawId =
    req.query.by ||
    headerId ||
    req.header("x-actor-id") ||
    headerEmail || // last resort: use email as key
    null;

  // Build a very safe fallback: never trust header role for permissions
  const fallback = {
    id: null,
    email: headerEmail || rawId || null,
    name: headerEmail || rawId || null,
    role: "EMPLOYEE", // default, **never** ADMIN here
    user: null,
  };

  // If we truly have no identifier at all, just attach fallback
  if (!rawId) {
    req.actor = fallback;
    return next();
  }

  try {
    // Try to resolve from DB (authoritative source)
    const where = [];

    // If it looks like an email, search by email too
    if (typeof rawId === "string" && rawId.includes("@")) {
      where.push({ email: rawId });
    }

    // Always allow lookup by id
    where.push({ id: rawId });

    const user = await prisma.user.findFirst({
      where: { OR: where },
    });

    if (!user) {
      // Unknown id/email → still proceed, but with safe fallback
      req.actor = fallback;
      return next();
    }

    // ✅ Authoritative actor, from DB only
    req.actor = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,             // ROLE FROM DB, NOT HEADERS
      departmentId: user.departmentId || null,
      user,
    };

    return next();
  } catch (err) {
    console.error("[actor middleware] failed to resolve user:", err);
    req.actor = fallback;
    return next();
  }
}

module.exports = { actor };
