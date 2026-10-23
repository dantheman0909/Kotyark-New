// Chunked-upload sessions for documents. Server-only. Parts are stored under tmp/uploads/<id>/<n>.
import { query, queryOne } from './db';
import { httpError } from './auth';
import { deleteObject, listObjects, removeEmptyDirs } from './storage';
import { runAfter } from './after';

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const partKey = (id, n) => `tmp/uploads/${id}/${n}`;

const COLS = `id, user_id, filename, size::float8 AS size, parts, received, mime, created_at,
  (completing IS NOT NULL AND completing > now() - interval '15 minutes') AS busy`;

/** The caller's own session, or a 404 (also for a malformed id or another user's session). */
export async function loadUpload(id, user) {
  if (!UUID_RE.test(String(id))) throw httpError(404, 'Upload not found');
  const row = await queryOne(`SELECT ${COLS} FROM upload_sessions WHERE id = $1 AND user_id = $2`, [id, user.id]);
  if (!row) throw httpError(404, 'Upload not found');
  return row;
}

/** Like loadUpload, but 409 while a request is turning the parts into a document. */
export async function loadIdleUpload(id, user) {
  const up = await loadUpload(id, user);
  if (up.busy) throw httpError(409, 'This upload is being saved; try again in a moment');
  return up;
}

/** Atomically claim the session for completion (409 if another request holds a fresh claim). */
export async function claimUpload(id, user) {
  if (!UUID_RE.test(String(id))) throw httpError(404, 'Upload not found');
  const row = await queryOne(
    `UPDATE upload_sessions SET completing = now()
      WHERE id = $1 AND user_id = $2 AND (completing IS NULL OR completing < now() - interval '15 minutes')
      RETURNING ${COLS}`, [id, user.id]);
  if (row) return row;
  await loadUpload(id, user); // 404 if it does not exist / is not theirs
  throw httpError(409, 'This upload is already being saved');
}

/** Give the claim back so the complete can be retried without re-uploading. Never throws. */
export async function releaseUpload(id) {
  await query('UPDATE upload_sessions SET completing = NULL WHERE id = $1', [id]).catch(() => {});
}

const IDLE_SQL = "(completing IS NULL OR completing < now() - interval '15 minutes')";

/** Remove the session row first (so nothing new can find it), then its temp parts. Never throws. */
export async function discardUpload(id, { onlyIdle = false } = {}) {
  try {
    const rows = await query(`DELETE FROM upload_sessions WHERE id = $1${onlyIdle ? ` AND ${IDLE_SQL}` : ''} RETURNING parts`, [id]);
    for (const r of rows) for (let n = 0; n < r.parts; n++) await deleteObject(partKey(id, n)).catch(() => {});
  } catch (e) { console.warn('Upload discard failed:', e.message); }
}

/** Cancel in one statement: 409 if a request holds a fresh claim, 404 if it does not exist or is not theirs. */
export async function cancelUpload(id, user) {
  if (!UUID_RE.test(String(id))) throw httpError(404, 'Upload not found');
  const rows = await query(
    `DELETE FROM upload_sessions WHERE id = $1 AND user_id = $2 AND ${IDLE_SQL} RETURNING parts, filename, size::float8 AS size`, [id, user.id]);
  if (!rows.length) {
    await loadUpload(id, user); // 404 when absent
    throw httpError(409, 'This upload is being saved; try again in a moment');
  }
  for (let n = 0; n < rows[0].parts; n++) await deleteObject(partKey(id, n)).catch(() => {});
  return rows[0];
}

const SWEEP_MAX = 50;
/** Delete temp part objects that have no session (leftovers from races and crashes). Bounded. */
async function sweepOrphans() {
  const keys = await listObjects('tmp/uploads/', 500);
  const byId = new Map();
  for (const k of keys) {
    const id = k.split('/')[2];
    if (UUID_RE.test(id || '')) (byId.get(id) || byId.set(id, []).get(id)).push(k);
  }
  if (byId.size) {
    const live = new Set((await query('SELECT id FROM upload_sessions WHERE id = ANY($1::uuid[])', [[...byId.keys()]])).map((r) => r.id));
    let n = 0;
    for (const [id, ks] of byId) {
      if (live.has(id)) continue;
      for (const k of ks) { if (n++ >= SWEEP_MAX) return; await deleteObject(k).catch(() => {}); }
    }
  }
  await removeEmptyDirs('tmp/uploads');
}

/** Bounded cleanup (abandoned sessions older than 24 h that are not being saved, then orphaned parts), off the request path. */
export function pruneUploads() {
  runAfter(async () => {
    const old = await query(`SELECT id FROM upload_sessions WHERE created_at < now() - interval '24 hours' AND ${IDLE_SQL} LIMIT 10`);
    for (const o of old) await discardUpload(o.id, { onlyIdle: true });
    await sweepOrphans();
  });
}
