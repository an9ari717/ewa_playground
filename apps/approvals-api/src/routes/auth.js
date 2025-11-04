// src/routes/auth.js
const express = require('express');
const crypto = require('crypto');

const { hashPassword, verifyPassword } = require('../lib/crypto');
const { signJwt, verifyJwt } = require('../lib/jwt');

const router = express.Router();

/* ----------------------------- utils ----------------------------- */
const envBool = (v, def = false) => {
  if (v == null) return def;
  const s = String(v).toLowerCase().trim();
  return s === '1' || s === 'true' || s === 'yes' || s === 'on';
};

function timingSafeEqualStr(a, b) {
  const ba = Buffer.from(String(a ?? ''), 'utf8');
  const bb = Buffer.from(String(b ?? ''), 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function allowRole(role) {
  const allow = (process.env.SIGNUP_ALLOW_ROLES || 'EMPLOYEE')
    .split(',')
    .map((x) => x.trim().toUpperCase())
    .filter(Boolean);
  return allow.includes(String(role || '').toUpperCase());
}

/* ---------------------- schema/column diagnostics ---------------------- */
let _authColsCache = null;
async function getAuthColumnsState(db) {
  if (_authColsCache) return _authColsCache;
  // Prisma uses quoted "User"
  const rows = await db.$queryRawUnsafe(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User';
  `);
  const cols = new Set(rows.map((r) => r.column_name));
  const state = {
    hasPasswordHash: cols.has('passwordHash'),
    hasMustChangePassword: cols.has('mustChangePassword'),
    hasEmailVerifiedAt: cols.has('emailVerifiedAt'),
    hasLastLoginAt: cols.has('lastLoginAt'),
  };
  _authColsCache = state;
  return state;
}

/* ------------------------ /auth/check-access-code ------------------------ */
router.post('/check-access-code', async (req, res) => {
  try {
    const gateEnabled = envBool(process.env.SIGNUP_GATE_ENABLED, true);
    if (!gateEnabled) return res.json({ ok: true });

    const { accessCode } = req.body || {};
    const secret = process.env.SIGNUP_GATE_SECRET || '';
    if (!accessCode || !secret) {
      return res.status(403).json({ ok: false, message: 'Access denied' });
    }
    if (!timingSafeEqualStr(accessCode, secret)) {
      return res.status(403).json({ ok: false, message: 'Access denied' });
    }
    return res.json({ ok: true });
  } catch (err) {
    req.log?.error?.(err, 'check-access-code failed');
    res.status(500).json({ ok: false, message: 'Internal error' });
  }
});

/* -------------------------------- /auth/signup -------------------------------- */
router.post('/signup', async (req, res) => {
  const db = req.db;
  try {
    const cols = await getAuthColumnsState(db);
    if (!cols.hasPasswordHash) {
      return res.status(500).json({
        error: 'Auth column missing: passwordHash',
        hint:
          'Add auth columns to "User" table (passwordHash, mustChangePassword, emailVerifiedAt, lastLoginAt) before signup.',
      });
    }

    const gateEnabled = envBool(process.env.SIGNUP_GATE_ENABLED, true);
    const gateSecret = process.env.SIGNUP_GATE_SECRET || '';
    const { name, email, password, role = 'EMPLOYEE', accessCode } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }

    if (gateEnabled) {
      if (!accessCode || !gateSecret || !timingSafeEqualStr(accessCode, gateSecret)) {
        return res.status(403).json({ error: 'Signup not permitted' });
      }
    }

    if (!allowRole(role)) {
      return res.status(403).json({ error: 'Role not permitted for public signup' });
    }

    const normEmail = String(email).toLowerCase().trim();
    if (!normEmail.includes('@') || normEmail.length > 255) {
      return res.status(400).json({ error: 'invalid email' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'password must be at least 8 characters' });
    }

    const existing = await db.user.findUnique({ where: { email: normEmail } });
    if (existing) {
      return res.status(409).json({ error: 'email already exists' });
    }

    const passwordHash = await hashPassword(password);

    const data = {
      name: String(name).trim(),
      email: normEmail,
      role: String(role).toUpperCase(),
      passwordHash,
    };
    if (cols.hasMustChangePassword) data.mustChangePassword = false;
    if (cols.hasEmailVerifiedAt) data.emailVerifiedAt = new Date();

    const user = await db.user.create({
      data,
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    const token = signJwt({ id: user.id, email: user.email, role: user.role });
    return res.status(201).json({ token, user });
  } catch (err) {
    // Dev-friendly diagnostics
    req.log?.error?.(err, 'signup failed');

    if (err?.code === 'P2002') {
      return res.status(409).json({ error: 'email already exists' });
    }

    const isDev = String(process.env.NODE_ENV || 'development') !== 'production';
    if (isDev) {
      return res.status(500).json({
        error: 'failed to signup',
        code: err?.code || null,
        message: err?.message || null,
        meta: err?.meta || null,
      });
    }
    return res.status(500).json({ error: 'failed to signup' });
  }
});

/* -------------------------------- /auth/login -------------------------------- */
// Body: { email, password } -> { token, user }
router.post('/login', async (req, res) => {
  const db = req.db;
  const isDev = String(process.env.NODE_ENV || 'development') !== 'production';

  try {
    // 0) Column guard
    const colState = await getAuthColumnsState(db);
    if (!colState.hasPasswordHash) {
      return res.status(500).json({
        error: 'Auth column missing: passwordHash',
        hint: 'Add auth columns to "User" table before login.',
      });
    }

    // 1) Validate payload
    const { email, password } = req.body || {};
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const normEmail = email.toLowerCase().trim();

    // 2) Fetch user (include passwordHash for compare)
    const user = await db.user.findUnique({
      where: { email: normEmail },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        passwordHash: true,
      },
    });

    if (!user) {
      // dev-only reason
      return res.status(401).json({ error: 'invalid credentials', ...(isDev ? { reason: 'no_user' } : {}) });
    }
    if (!user.passwordHash) {
      return res.status(401).json({ error: 'invalid credentials', ...(isDev ? { reason: 'no_hash' } : {}) });
    }

    // 3) Verify password
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'invalid credentials', ...(isDev ? { reason: 'bad_password' } : {}) });
    }

    // 4) Status guard
    if (user.isActive === false) {
      return res.status(403).json({ error: 'account is disabled' });
    }

    // 5) Update lastLoginAt if column exists
    if (colState.hasLastLoginAt) {
      await db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    // 6) Issue token
    const token = signJwt({ id: user.id, email: user.email, role: user.role });
    const slim = { id: user.id, email: user.email, name: user.name, role: user.role, isActive: user.isActive };
    return res.json({ token, user: slim });
  } catch (err) {
    req.log?.error?.(err, 'login failed');
    // dev-only detail
    if (isDev) {
      return res.status(500).json({
        error: 'failed to login',
        code: err?.code || null,
        message: err?.message || null,
        meta: err?.meta || null,
      });
    }
    return res.status(500).json({ error: 'failed to login' });
  }
});


/* --------------------------------- /auth/me --------------------------------- */
router.get('/me', async (req, res) => {
  const db = req.db;
  try {
    const hdr = req.header('authorization') || '';
    const match = hdr.match(/^Bearer\s+(.+)$/i);
    if (!match) return res.status(401).json({ error: 'missing token' });

    const payload = verifyJwt(match[1]); // throws if invalid/expired
    const user = await db.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
    if (!user) return res.status(401).json({ error: 'invalid token' });

    res.json({ user });
  } catch (err) {
    req.log?.error?.(err, 'me failed');
    res.status(401).json({ error: 'invalid token' });
  }
});

/* ------------------------------- /auth/_selftest ------------------------------ */
router.get('/_selftest', async (req, res) => {
  const details = {
    gateEnabled: false,
    gateSecretSet: false,
    jwtSecretSet: false,
    bcryptOk: false,
    jwtOk: false,
    prismaOk: false,
    userCount: null,
    columns: {},
    errors: {
      bcrypt: null,
      jwt: null,
      requireCrypto: null,
      requireJwt: null,
    },
    versions: {},
    modules: {
      cryptoResolve: null,
      jwtResolve: null,
      cryptoKeys: null,
      jwtKeys: null,
      typeofs: {},
    },
  };

  try {
    details.gateEnabled = String(process.env.SIGNUP_GATE_ENABLED || 'true').toLowerCase() === 'true';
    details.gateSecretSet = !!(process.env.SIGNUP_GATE_SECRET && process.env.SIGNUP_GATE_SECRET.length > 0);
    details.jwtSecretSet = !!(process.env.JWT_SECRET && String(process.env.JWT_SECRET).length >= 16);

    try {
      details.versions.bcryptjs = require('bcryptjs/package.json').version;
    } catch {}
    try {
      details.versions.jsonwebtoken = require('jsonwebtoken/package.json').version;
    } catch {}

    try {
      details.modules.cryptoResolve = require.resolve('../lib/crypto');
      const mod = require('../lib/crypto');
      details.modules.cryptoKeys = Object.keys(mod);
      details.modules.typeofs.hashPassword = typeof mod.hashPassword;
      details.modules.typeofs.verifyPassword = typeof mod.verifyPassword;
    } catch (e) {
      details.errors.requireCrypto = String(e && e.message ? e.message : e);
    }

    try {
      details.modules.jwtResolve = require.resolve('../lib/jwt');
      const mod = require('../lib/jwt');
      details.modules.jwtKeys = Object.keys(mod);
      details.modules.typeofs.signJwt = typeof mod.signJwt;
      details.modules.typeofs.verifyJwt = typeof mod.verifyJwt;
    } catch (e) {
      details.errors.requireJwt = String(e && e.message ? e.message : e);
    }

    try {
      const { hashPassword, verifyPassword } = require('../lib/crypto');
      const sample = 'P@ssw0rd!';
      const h = await hashPassword(sample);
      details.bcryptOk = await verifyPassword(sample, h);
    } catch (e) {
      details.errors.bcrypt = String(e && e.message ? e.message : e);
      details.bcryptOk = false;
    }

    try {
      const { signJwt, verifyJwt } = require('../lib/jwt');
      const t = signJwt({ ping: 'pong' }, { expiresIn: '60s' });
      const p = verifyJwt(t);
      details.jwtOk = p && p.ping === 'pong';
    } catch (e) {
      details.errors.jwt = String(e && e.message ? e.message : e);
      details.jwtOk = false;
    }

    try {
      const db = req.db;
      details.userCount = await db.user.count();
      details.prismaOk = Number.isInteger(details.userCount);

      const rows = await db.$queryRawUnsafe(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'User';
      `);
      const cols = new Set(rows.map((r) => r.column_name));
      details.columns = {
        hasPasswordHash: cols.has('passwordHash'),
        hasMustChangePassword: cols.has('mustChangePassword'),
        hasEmailVerifiedAt: cols.has('emailVerifiedAt'),
        hasLastLoginAt: cols.has('lastLoginAt'),
      };
    } catch {
      details.prismaOk = false;
    }

    return res.json({
      ok:
        details.bcryptOk &&
        details.jwtOk &&
        details.prismaOk &&
        details.jwtSecretSet &&
        (!details.gateEnabled || details.gateSecretSet),
      details,
    });
  } catch (err) {
    req.log?.error?.(err, 'selftest failed');
    return res.status(500).json({ ok: false, error: 'selftest error' });
  }
});

module.exports = router;
