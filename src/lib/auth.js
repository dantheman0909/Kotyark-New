import { cookies } from 'next/headers';
import getDb from './db';

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'kotyark2024';

export { ADMIN_USER, ADMIN_PASS };

export async function validateSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;
    if (!token) return false;

    const db = getDb();
    const session = db.prepare(
      "SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')"
    ).get(token);

    return !!session;
  } catch {
    return false;
  }
}

export function createSession() {
  const { v4: uuidv4 } = require('uuid');
  const db = getDb();
  const token = uuidv4();
  const id = uuidv4();
  // Session expires in 24 hours
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  db.prepare(
    'INSERT INTO sessions (id, token, expires_at) VALUES (?, ?, ?)'
  ).run(id, token, expiresAt);

  return { token, expiresAt };
}

export function destroySession(token) {
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

// Clean up expired sessions periodically
export function cleanupSessions() {
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
}
