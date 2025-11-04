// src/lib/jwt.js
'use strict';

const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signJwt(payload, options = {}) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN, ...options });
}

function verifyJwt(token) {
  return jwt.verify(token, SECRET);
}

// Export explicitly
exports.signJwt = signJwt;
exports.verifyJwt = verifyJwt;
