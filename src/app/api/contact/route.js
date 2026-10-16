import crypto from 'node:crypto';
import { headers } from 'next/headers';
import { errorResponse, httpError, ipFromHeaders } from '@/lib/auth';
import { query } from '@/lib/db';
import { validateEnquiry } from '@/lib/enquiry-rules';

export const dynamic = 'force-dynamic';

const MAX_BODY = 20 * 1024;
const MIN_FILL_MS = 3000;
const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_KEYS = 10_000;

// In-memory per-IP limiter. Per process (fine for one Replit instance). A Map keeps insertion order, so when it
// reaches MAX_KEYS the oldest-inserted key is evicted; a key is re-inserted on every hit, so "oldest" = least recent.
const hits = new Map();
function limited(key) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) return true;
  recent.push(now);
  hits.delete(key);
  hits.set(key, recent);
  while (hits.size > MAX_KEYS) hits.delete(hits.keys().next().value);
  return false;
}

// Without ENQUIRY_PEPPER we store no hash at all (NULL): a hash of an IPv4 address is trivially reversible without a
// secret pepper, and a hard-coded one would be public in the source.
const hashIp = (ip) => {
  const pepper = process.env.ENQUIRY_PEPPER;
  if (!pepper || !ip) return null;
  return crypto.createHash('sha256').update(ip + pepper).digest('hex');
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
    if (limited(ip)) {
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
