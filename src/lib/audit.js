// Append-only audit trail. Every mutation calls this.
import { query } from './db';
import { clientIp } from './auth';

/**
 * @param {object} user  {id,email} or null (e.g. failed login)
 * @param {string} action create|update|delete|publish|unpublish|restore|upload|login|logout
 * @param {string} entity page|document|folder|media|nav|redirect|setting|user|session
 * @param {string|null} entityId
 * @param {string} summary human-readable one-liner
 * @param {object} [diff] {before, after} or any JSON
 */
export async function audit(user, action, entity, entityId, summary, diff = null) {
  let ip = null;
  try { ip = await clientIp(); } catch { /* outside a request */ }
  await query(
    `INSERT INTO audit_log(user_id, user_email, action, entity, entity_id, summary, diff, ip)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [user?.id ?? null, user?.email ?? null, action, entity, entityId == null ? null : String(entityId),
     summary, diff ? JSON.stringify(diff) : null, ip]);
}
