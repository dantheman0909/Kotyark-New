import { ROLES, httpError } from '@/lib/auth';

export const USER_COLUMNS = 'id, email, name, role, active, last_login_at, created_at';
export const BCRYPT_COST = 12;
export const MIN_PASSWORD = 12;

export function checkPassword(pw) {
  if (typeof pw !== 'string' || pw.length < MIN_PASSWORD) {
    throw httpError(400, `Password must be at least ${MIN_PASSWORD} characters`);
  }
  if (pw.length > 200) throw httpError(400, 'Password is too long');
  return pw;
}

export function checkRole(role) {
  if (!ROLES.includes(role)) throw httpError(400, `Role must be one of: ${ROLES.join(', ')}`);
  return role;
}

export function checkEmail(email) {
  const e = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || e.length > 254) throw httpError(400, 'A valid email is required');
  return e;
}

export function checkName(name) {
  const n = typeof name === 'string' ? name.trim() : '';
  if (!n) throw httpError(400, 'Name is required');
  if (n.length > 120) throw httpError(400, 'Name is too long');
  return n;
}

export async function readJson(req) {
  try { return await req.json(); } catch { throw httpError(400, 'Invalid JSON body'); }
}

export const isUuid = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s || '');
