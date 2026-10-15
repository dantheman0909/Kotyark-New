// Sessions, current user, roles. Server-only.
import crypto from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { query, queryOne } from './db';

export const SESSION_COOKIE = 'kotyark_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h

export const ROLES = ['owner', 'editor', 'compliance'];

// Capability -> roles allowed. The single source of truth for authorization.
export const PERMISSIONS = {
  'pages:write':      ['owner', 'editor'],
  'pages:publish':    ['owner', 'editor'],
  'pages:delete':     ['owner'],
  'documents:write':  ['owner', 'compliance'],
  'documents:delete': ['owner', 'compliance'],
  'media:write':      ['owner', 'editor', 'compliance'],
  'nav:write':        ['owner', 'editor'],
  'redirects:write':  ['owner', 'editor'],
  'settings:write':   ['owner'],
  'users:manage':     ['owner'],
  'audit:read':       ['owner', 'compliance'],
};

export function can(user, capability) {
  if (!user || !user.active) return false;
  const allowed = PERMISSIONS[capability];
  if (!allowed) throw new Error(`Unknown capability: ${capability}`);
  return allowed.includes(user.role);
}

export class AuthError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

export async function clientIp() {
  const h = await headers();
  // Rightmost X-Forwarded-For entry: the one our own proxy appended. Earlier entries are client-supplied.
  const xff = (h.get('x-forwarded-for') || '').split(',').map(s => s.trim()).filter(Boolean);
  return xff[xff.length - 1] || h.get('x-real-ip') || null;
}

/** Create a session row and set the cookie. Call from a route handler / server action. */
export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const h = await headers();
  await query(
    `INSERT INTO sessions(token_hash, user_id, expires_at, ip, user_agent) VALUES ($1,$2,$3,$4,$5)`,
    [sha256(token), userId, expiresAt, await clientIp(), (h.get('user-agent') || '').slice(0, 300)]);
  await query(`UPDATE users SET last_login_at = now() WHERE id = $1`, [userId]);
  await query(`DELETE FROM sessions WHERE expires_at < now()`);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: 'lax', path: '/',
    secure: process.env.NODE_ENV === 'production', expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await query(`DELETE FROM sessions WHERE token_hash = $1`, [sha256(token)]);
  jar.delete(SESSION_COOKIE);
}

/** The logged-in, active user ({id,email,name,role,active}) or null. */
export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return queryOne(
    `SELECT u.id, u.email, u.name, u.role, u.active
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now() AND u.active`,
    [sha256(token)]);
}

/**
 * Require a logged-in user, optionally holding a capability.
 * Throws AuthError(401|403). Use with authErrorResponse() in route handlers.
 */
export async function requireUser(capability) {
  const user = await getCurrentUser();
  if (!user) throw new AuthError(401, 'Unauthorized');
  if (capability && !can(user, capability)) throw new AuthError(403, 'Forbidden');
  return user;
}

/** Map any thrown error to a JSON Response. Logs non-auth errors. */
export function errorResponse(err) {
  if (err instanceof AuthError) return Response.json({ error: err.message }, { status: err.status });
  if (err?.status && err?.expose) return Response.json({ error: err.message }, { status: err.status });
  console.error(err);
  return Response.json({ error: 'Internal server error' }, { status: 500 });
}

/** A 4xx error whose message is safe to show the client. */
export function httpError(status, message) {
  const e = new Error(message); e.status = status; e.expose = true; return e;
}
