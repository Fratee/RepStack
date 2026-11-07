// Authentication helper with scrypt password hashing & session token management
import crypto from 'node:crypto';
import { createSession, getSession, deleteSession } from './db.js';

const SESSION_EXPIRY_DAYS = 90; // Long-lived session so user stays logged in on PWA

export function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

export function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function verifyPassword(password, salt, storedHash) {
  const computedHash = crypto.scryptSync(password, salt, 64).toString('hex');
  const bufA = Buffer.from(computedHash, 'hex');
  const bufB = Buffer.from(storedHash, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function issueSession(userId) {
  const token = generateToken();
  const expiresAt = Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  createSession(token, userId, expiresAt);
  return { token, expiresAt };
}

export function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach((cookie) => {
    let [name, ...rest] = cookie.split('=');
    name = name?.trim();
    if (!name) return;
    const value = rest.join('=').trim();
    list[name] = decodeURIComponent(value);
  });
  return list;
}

export function extractToken(req) {
  // 1. Check Authorization header: Bearer <token>
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (authHeader && typeof authHeader === 'string') {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && /^bearer$/i.test(parts[0])) {
      return parts[1].trim();
    }
  }

  // 2. Check cookie: gym_token=<token>
  const cookies = parseCookies(req.headers['cookie']);
  if (cookies.gym_token) {
    return cookies.gym_token.trim();
  }

  return null;
}

export function authenticateRequest(req) {
  const token = extractToken(req);
  if (!token) return null;

  const session = getSession(token);
  if (!session) return null;

  return {
    token,
    user: {
      id: session.user_id,
      username: session.username,
      displayName: session.display_name,
    },
  };
}

export function revokeSession(token) {
  if (token) {
    deleteSession(token);
  }
}
