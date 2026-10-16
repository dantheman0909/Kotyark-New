import crypto from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { errorResponse, requireUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { audit } from '@/lib/audit';
import { cleanPopup, POPUP_COLUMNS, shapePopup, STATS_DAY_SQL } from '@/lib/popups';

export const dynamic = 'force-dynamic';

// GET /api/popups -> { popups: [{ ...shape, stats: { views, clicks, dismissals } }] }  (30-day stats, India calendar days)
export async function GET() {
  try {
    await requireUser('popups:write');
    const rows = await query(
      `SELECT ${POPUP_COLUMNS.split(',').map((c) => 'p.' + c.trim()).join(', ')},
              COALESCE(s.views, 0)::int AS views, COALESCE(s.clicks, 0)::int AS clicks, COALESCE(s.dismissals, 0)::int AS dismissals
         FROM popups p
         LEFT JOIN (SELECT popup_id, sum(views) AS views, sum(clicks) AS clicks, sum(dismissals) AS dismissals
                      FROM popup_stats WHERE day >= ${STATS_DAY_SQL} - 29 GROUP BY popup_id) s ON s.popup_id = p.id
        ORDER BY (p.status = 'published') DESC, p.priority DESC, p.updated_at DESC`);
    return Response.json({
      popups: rows.map((r) => ({ ...shapePopup(r), stats: { views: r.views, clicks: r.clicks, dismissals: r.dismissals } })),
    });
  } catch (e) { return errorResponse(e); }
}

// POST /api/popups { name, priority?, content?, design?, customCss?, rules? } -> 201 { popup, warnings }
export async function POST(req) {
  try {
    const user = await requireUser('popups:write');
    const body = await req.json().catch(() => null);
    const id = crypto.randomUUID();
    const v = await cleanPopup(body, id);
    const row = await queryOne(
      `INSERT INTO popups(id, name, status, priority, content, design, custom_css, scoped_css, rules, created_by, updated_by)
       VALUES ($1,$2,'draft',$3,$4,$5,$6,$7,$8,$9,$9) RETURNING ${POPUP_COLUMNS}`,
      [id, v.name, v.priority, JSON.stringify(v.content), JSON.stringify(v.design), v.customCss, v.scopedCss, JSON.stringify(v.rules), user.id]);
    await audit(user, 'create', 'popup', id, `Created pop-up "${v.name}"`, { after: { name: v.name, layout: v.design.layout, trigger: v.rules.trigger } });
    revalidatePath('/admin/popups');
    return Response.json({ popup: shapePopup(row), warnings: v.warnings }, { status: 201 });
  } catch (e) { return errorResponse(e); }
}
