import crypto from 'node:crypto';
import { headers } from 'next/headers';
import { errorResponse, httpError, ipFromHeaders } from '@/lib/auth';
import { query, tx, getPool } from '@/lib/db';
import { validateEnquiry } from '@/lib/enquiry-rules';

export const dynamic = 'force-dynamic';

const MAX_BODY = 20 * 1024;
const MIN_FILL_MS = 3000;
const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

// Shared limiter in Postgres (rate_hits), so it holds across Autoscale instances and restarts. The key is a hash, never
// a raw IP: HMAC with ENQUIRY_PEPPER when set, else with a per-process random secret (made once at module load), so
// the stored key cannot be reversed by hashing the IPv4 space. The fallback means counts do not carry across instances
// or restarts; set ENQUIRY_PEPPER in the deployment for a limit that is truly shared.
// Only admitted requests are recorded, so the table grows by at most LIMIT rows per key per window, and each call
// deletes its own expired rows plus a small bounded batch of old ones (no separate prune job).
// Fails open: a database error or timeout is logged and the request is allowed, so an outage never blocks enquiries.
const PROCESS_SECRET = crypto.randomBytes(32);
const rateKey = (ip) => `contact:${crypto.createHmac('sha256', process.env.ENQUIRY_PEPPER || PROCESS_SECRET).update(`contact-rl:${ip}`).digest('hex')}`;
// Per-instance pre-filter (same LIMIT and WINDOW): bounded map, oldest keys evicted past MEM_MAX.
const MEM_MAX = 10_000;
const memHits = new Map();
function memLimited(key) {
  const now = Date.now();
  const recent = (memHits.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) { memHits.set(key, recent); return true; }
  recent.push(now);
  memHits.delete(key); memHits.set(key, recent);
  while (memHits.size > MEM_MAX) memHits.delete(memHits.keys().next().value);
  return false;
}
async function limited(ip) {
  try {
    const key = rateKey(ip);
    // First line: a small per-instance counter, so a burst is refused without touching the database at all.
    if (memLimited(key)) return true;
    // A saturated pool means the site is already under pressure: rely on the per-instance counter above rather than
    // queue up to 10 s for a connection. (With Max instances = 1 that counter is the whole limit anyway.)
    if (getPool().waitingCount > 2) return false;
    return await tx(async (c) => {
      // The server cancels these statements if the DB is slow (SET LOCAL ends with the transaction).
      await c.query(`SET LOCAL statement_timeout = '1500ms'`);
      // Serialize callers for the same key: under READ COMMITTED, parallel requests would otherwise not see each
      // other's uncommitted inserts and could all be admitted. Released at COMMIT/ROLLBACK; other keys are unaffected.
      await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [key]);
      await c.query(
        `DELETE FROM rate_hits WHERE ctid IN (
           SELECT ctid FROM rate_hits WHERE (key = $1 AND at < now() - make_interval(secs => $2)) OR at < now() - interval '20 minutes' LIMIT 200)`,
        [key, WINDOW_MS / 1000]);
      const { rows } = await c.query(
        `WITH recent AS (SELECT 1 FROM rate_hits WHERE key = $1 AND at > now() - make_interval(secs => $2) LIMIT $3),
              ins AS (INSERT INTO rate_hits(key) SELECT $1 WHERE (SELECT count(*) FROM recent) < $3 RETURNING 1)
         SELECT (SELECT count(*) FROM ins)::int AS admitted`,
        [key, WINDOW_MS / 1000, LIMIT]);
      return rows[0].admitted === 0;
    });
  } catch (e) {
    console.error(`[contact] rate limit unavailable, allowing: ${e.message}`);
    return false;
  }
}

// The IP is stored only as a keyed hash: HMAC-SHA256 with ENQUIRY_PEPPER.
// Without it we store no hash at all (NULL): an unkeyed hash of an IPv4 address is trivially reversible, and a
// hard-coded key would be public in the source. Changing the secret only stops old and new hashes from matching.
const hashIp = (ip) => {
  const key = process.env.ENQUIRY_PEPPER;
  if (!key || !ip) return null;
  return crypto.createHmac('sha256', key).update(ip).digest('hex');
};

// Read at most MAX_BODY bytes from the stream, whatever content-length claims (or omits, e.g. chunked).
async function readCapped(req) {
  if (!req.body) return '';
  const reader = req.body.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY) { await reader.cancel().catch(() => {}); throw httpError(413, 'Message too large.'); }
    chunks.push(value);
  }
  return new TextDecoder('utf-8').decode(Buffer.concat(chunks));
}

const cap = (s, n) => String(s || '').slice(0, n);

// POST /api/contact (public) { subject, name, email, phone?, company?, volume?, message, website (honeypot), renderedAt, elapsedMs (render-to-submit) }
export async function POST(req) {
  try {
    // Cheap rejections first (wrong type, oversize, malformed JSON): they do not consume the visitor's quota, so a
    // client bug or a probe cannot lock a real visitor out. Everything that parses as a JSON object counts, including
    // validation failures, so a script cannot probe validation unmetered.
    if (!/^application\/json\b/i.test(req.headers.get('content-type') || '')) throw httpError(415, 'Send JSON.');
    const declared = Number(req.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_BODY) throw httpError(413, 'Message too large.');
    const raw = await readCapped(req);
    let body;
    try { body = JSON.parse(raw); } catch { throw httpError(400, 'Invalid JSON.'); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw httpError(400, 'Invalid JSON.');

    const h = await headers();
    const ip = ipFromHeaders(h) || 'unknown';
    if (await limited(ip)) {
      return Response.json({ error: 'Too many messages. Please try again in a few minutes.' }, { status: 429, headers: { 'Retry-After': '600' } });
    }

    const filled = typeof body.website === 'string' ? body.website.trim() !== '' : body.website != null && body.website !== false;
    // elapsedMs is measured client-side with performance.now(), so clock skew cannot misclassify a real visitor.
    const elapsed = Number(body.elapsedMs);
    const tooFast = !Number.isFinite(elapsed) || elapsed < MIN_FILL_MS;
    const isSpam = filled || tooFast;

    const { values, errors } = validateEnquiry(body);
    const ua = cap(h.get('user-agent'), 300);
    const source = typeof body.path === 'string' && body.path.startsWith('/') ? body.path.slice(0, 200) : null;
    const insert = (v, status) => query(
      `INSERT INTO enquiries(subject, name, email, phone, company, volume, message, status, ip_hash, user_agent, source_path)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [v.subject, v.name, v.email, v.phone || null, v.company || null, v.volume || null, v.message, status, hashIp(ip), ua || null, source]);

    if (isSpam) {
      // Bots get the same 200 as a visitor but the row is kept as 'spam' (filed, not in the inbox's New list), so a
      // real visitor wrongly flagged (fast autofill) can still be recovered. Fields are capped; no validation needed.
      await insert({
        subject: cap(values.subject, 100), name: cap(values.name, 120), email: cap(values.email, 254), phone: cap(values.phone, 32),
        company: cap(values.company, 160), volume: cap(values.volume, 40), message: cap(values.message, 5000),
      }, 'spam');
      return Response.json({ ok: true });
    }
    if (Object.keys(errors).length) return Response.json({ error: 'Please check the highlighted fields.', fields: errors }, { status: 400 });
    await insert(values, 'new');
    return Response.json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
