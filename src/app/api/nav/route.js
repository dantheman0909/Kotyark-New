import { revalidatePath } from 'next/cache';
import { errorResponse, httpError, requireUser } from '@/lib/auth';
import { query, tx } from '@/lib/db';
import { audit } from '@/lib/audit';
import { revalidatePagePath } from '@/lib/revalidate';
import { UUID_RE } from '@/lib/pages';

export const dynamic = 'force-dynamic';

const MENUS = ['header', 'footer'];
const MAX_TOP = 50;
const MAX_CHILDREN = 30;

function menuOf(req) {
  const menu = new URL(req.url).searchParams.get('menu') || 'header';
  if (!MENUS.includes(menu)) throw httpError(400, 'menu must be "header" or "footer"');
  return menu;
}

// GET /api/nav?menu=header|footer -> { menu, items: [{ id, label, pageId, url, pagePath, pageTitle, pageStatus, children: [...] }] }
// Editor view: includes links to unpublished pages (the public site skips those).
export async function GET(req) {
  try {
    await requireUser();
    const menu = menuOf(req);
    const rows = await query(
      `SELECT n.id, n.label, n.page_id, n.url, n.parent_id, p.path AS page_path, p.title AS page_title, p.status AS page_status
         FROM nav_items n LEFT JOIN pages p ON p.id = n.page_id
        WHERE n.menu = $1 ORDER BY n.sort_order, n.label`, [menu]);
    const shape = r => ({ id: r.id, label: r.label, pageId: r.page_id, url: r.url, pagePath: r.page_path, pageTitle: r.page_title, pageStatus: r.page_status, children: [] });
    const byId = new Map(rows.map(r => [r.id, shape(r)]));
    const items = [];
    for (const r of rows) {
      const item = byId.get(r.id);
      if (r.parent_id && byId.has(r.parent_id)) byId.get(r.parent_id).children.push(item);
      else if (!r.parent_id) items.push(item);
    }
    return Response.json({ menu, items });
  } catch (e) { return errorResponse(e); }
}

function cleanItem(raw, depth) {
  const label = String(raw?.label ?? '').trim();
  if (!label) throw httpError(400, 'Every menu item needs a label');
  if (label.length > 100) throw httpError(400, `Label too long: "${label.slice(0, 20)}..."`);
  const pageId = raw?.pageId || null;
  const url = String(raw?.url ?? '').trim();
  if (pageId) {
    if (!UUID_RE.test(pageId)) throw httpError(400, `Invalid page for "${label}"`);
  } else if (!url) {
    // A top-level heading with sub-items may have no link (stored as url = '').
    if (!(depth === 0 && Array.isArray(raw?.children) && raw.children.length)) throw httpError(400, `"${label}" needs a page or a URL`);
  } else if (url && !(/^\/(?!\/)/.test(url) || /^https:\/\//i.test(url)) || /\s/.test(url)) {
    throw httpError(400, `URL for "${label}" must be a relative /path or an https:// URL`);
  }
  const children = Array.isArray(raw?.children) ? raw.children : [];
  if (depth > 0 && children.length) throw httpError(400, 'Menus support one level of sub-items');
  if (children.length > MAX_CHILDREN) throw httpError(400, `At most ${MAX_CHILDREN} sub-items per item`);
  return { label, pageId, url: pageId ? null : url, children: children.map(c => cleanItem(c, depth + 1)) };
}

// PUT /api/nav?menu=header|footer  { items: [{ label, pageId | url, children: [{ label, pageId | url }] }] } -> { ok, count }
// Replaces the whole menu in one transaction.
export async function PUT(req) {
  try {
    const user = await requireUser('nav:write');
    const menu = menuOf(req);
    const body = await req.json().catch(() => null);
    if (!Array.isArray(body?.items)) throw httpError(400, 'items must be an array');
    if (body.items.length > MAX_TOP) throw httpError(400, `At most ${MAX_TOP} top-level items`);
    const items = body.items.map(i => cleanItem(i, 0));

    const pageIds = [...new Set(items.flatMap(i => [i.pageId, ...i.children.map(c => c.pageId)]).filter(Boolean))];
    if (pageIds.length) {
      const found = await query('SELECT id FROM pages WHERE id = ANY($1::uuid[])', [pageIds]);
      if (found.length !== pageIds.length) throw httpError(400, 'A menu item links to a page that no longer exists');
    }

    let count = 0;
    await tx(async (client) => {
      await client.query('DELETE FROM nav_items WHERE menu = $1', [menu]);
      let order = 0;
      for (const item of items) {
        const { rows: [{ id }] } = await client.query(
          `INSERT INTO nav_items(menu, label, page_id, url, sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
          [menu, item.label, item.pageId, item.url, order++]);
        count++;
        let childOrder = 0;
        for (const child of item.children) {
          await client.query(
            `INSERT INTO nav_items(menu, label, page_id, url, parent_id, sort_order) VALUES ($1,$2,$3,$4,$5,$6)`,
            [menu, child.label, child.pageId, child.url, id, childOrder++]);
          count++;
        }
      }
    });
    await audit(user, 'update', 'nav', menu, `Saved ${menu} menu (${count} item(s))`, { after: { items } });
    revalidatePagePath('/');
    revalidatePath('/', 'layout'); // the header/footer render in the root layout of every page
    return Response.json({ ok: true, count });
  } catch (e) { return errorResponse(e); }
}
