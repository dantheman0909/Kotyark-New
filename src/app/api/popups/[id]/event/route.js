import { query } from '@/lib/db';
import { STATS_DAY_SQL, UUID_RE } from '@/lib/popups';

export const dynamic = 'force-dynamic';

const COLUMN = { view: 'views', click: 'clicks', dismiss: 'dismissals' };

// POST /api/popups/:id/event { type: 'view'|'click'|'dismiss' } -> 204. Public, no auth.
// One upsert, only for PUBLISHED pop-ups; unknown ids/types and any failure are ignored silently
// (a stats beacon must never produce an error page or leak whether an id exists).
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const text = await req.text();
    if (!UUID_RE.test(id) || text.length > 200) return new Response(null, { status: 204 });
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
