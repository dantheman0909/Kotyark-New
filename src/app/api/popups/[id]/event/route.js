import { query } from '@/lib/db';
import { STATS_DAY_SQL, UUID_RE } from '@/lib/popups';

export const dynamic = 'force-dynamic';

const COLUMN = { view: 'views', click: 'clicks', dismiss: 'dismissals' };

const MAX_BODY_BYTES = 200;

// Read at most `max` bytes from the stream, whatever Content-Length claims (it can be absent or false).
// Returns the text, or null as soon as the body exceeds `max` (the stream is cancelled, not drained).
async function readCapped(req, max) {
  if (!req.body) return '';
  const reader = req.body.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) { await reader.cancel().catch(() => {}); return null; }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}

// POST /api/popups/:id/event { type: 'view'|'click'|'dismiss' } -> 204. Public, no auth.
// One upsert, only for PUBLISHED pop-ups; unknown ids/types and any failure are ignored silently
// (a stats beacon must never produce an error page or leak whether an id exists).
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const text = await readCapped(req, MAX_BODY_BYTES);
    if (text === null) return new Response(null, { status: 413 });
    if (!UUID_RE.test(id)) return new Response(null, { status: 204 });
    let type;
    try { type = JSON.parse(text)?.type; } catch { return new Response(null, { status: 204 }); }
    const col = COLUMN[type];
    if (!col) return new Response(null, { status: 204 });
    await query(
      `INSERT INTO popup_stats(popup_id, day, ${col})
       SELECT id, ${STATS_DAY_SQL}, 1 FROM popups WHERE id = $1 AND status = 'published'
       ON CONFLICT (popup_id, day) DO UPDATE SET ${col} = popup_stats.${col} + 1`, [id]);
  } catch (err) {
    console.error('[popups] event failed:', err.message);
  }
  return new Response(null, { status: 204 });
}
