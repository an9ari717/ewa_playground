// src/lib/crypto.js
'use strict';

const bcrypt = require('bcryptjs');

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

async function hashPassword(plain) {
  if (!plain || typeof plain !== 'string') throw new Error('Invalid password');
  const salt = await bcrypt.genSalt(ROUNDS);
  return bcrypt.hash(plain, salt);
}

async function verifyPassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

// Export in a very explicit CommonJS way
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
