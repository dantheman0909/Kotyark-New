import { query } from '@/lib/db';
import { requireUser, errorResponse, httpError } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/audit?before=<id>&entity=&action=&user=<email>&from=YYYY-MM-DD&to=YYYY-MM-DD
// Keyset pagination on id (descending). `users` (distinct emails for the filter) is returned on the first page only.
export async function GET(req) {
  try {
    await requireUser('audit:read');
    const sp = new URL(req.url).searchParams;
    const where = [];
    const params = [];
    const add = (sql, v) => { params.push(v); where.push(sql.replace('?', `$${params.length}`)); };

    const before = sp.get('before');
    if (before) {
      if (!/^\d{1,18}$/.test(before)) throw httpError(400, 'Invalid cursor');
      add('id < ?::bigint', before);
    }
    if (sp.get('entity')) add('entity = ?', sp.get('entity').slice(0, 40));
    if (sp.get('action')) add('action = ?', sp.get('action').slice(0, 40));
    if (sp.get('user')) add('user_email = ?', sp.get('user').slice(0, 254));
    const from = sp.get('from'), to = sp.get('to');
    if (from) { if (!DATE_RE.test(from)) throw httpError(400, 'Invalid from date'); add(`created_at >= (?::date)::timestamp AT TIME ZONE 'Asia/Kolkata'`, from); }
    if (to) { if (!DATE_RE.test(to)) throw httpError(400, 'Invalid to date'); add(`created_at < ((?::date) + 1)::timestamp AT TIME ZONE 'Asia/Kolkata'`, to); }

    params.push(PAGE_SIZE + 1);
    const rows = await query(
      `SELECT id, user_id, user_email, action, entity, entity_id, summary, diff, ip, created_at
         FROM audit_log ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
        ORDER BY id DESC LIMIT $${params.length}`, params);

    const hasMore = rows.length > PAGE_SIZE;
    const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
    const out = { rows: page, nextCursor: hasMore ? String(page[page.length - 1].id) : null };
    if (!before) {
      out.users = (await query(
        `SELECT DISTINCT user_email FROM audit_log WHERE user_email IS NOT NULL ORDER BY user_email LIMIT 200`))
        .map((r) => r.user_email);
    }
    return Response.json(out, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return errorResponse(e); }
}
