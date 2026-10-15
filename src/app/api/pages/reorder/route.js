import { errorResponse, httpError, requireUser } from '@/lib/auth';
import { tx } from '@/lib/db';
import { audit } from '@/lib/audit';
import { revalidatePagePath } from '@/lib/revalidate';
import { assertUuid, loadPage, movePage } from '../_lib';

export const dynamic = 'force-dynamic';

// POST /api/pages/reorder { items: [{ id, parentId?, navOrder }] } -> { ok, moved }
// Sets nav_order; when parentId is given and differs, the page is re-parented (paths + 301s follow).
export async function POST(req) {
  try {
    const user = await requireUser('pages:write');
    const body = await req.json().catch(() => null);
    const items = body?.items;
    if (!Array.isArray(items) || items.length === 0 || items.length > 500) throw httpError(400, 'items must be a non-empty array (max 500)');
    items.forEach((i) => {
      assertUuid(i?.id);
      if (!Number.isFinite(Number(i.navOrder))) throw httpError(400, 'navOrder must be a number');
    });
    const moved = await tx(async (client) => {
      const all = [];
      for (const item of items) {
        const existing = await loadPage(client, item.id, { lock: true });
        if (Object.prototype.hasOwnProperty.call(item, 'parentId') && (item.parentId || null) !== (existing.parent_id || null)) {
          all.push(...await movePage(client, existing, existing.slug, item.parentId || null));
        }
        await client.query('UPDATE pages SET nav_order = $2, updated_by = $3 WHERE id = $1', [item.id, Math.trunc(Number(item.navOrder)), user.id]);
      }
      return all;
    });
    await audit(user, 'update', 'page', null, `Reordered ${items.length} page(s)`, { after: { items: items.map(i => ({ id: i.id, parentId: i.parentId ?? undefined, navOrder: i.navOrder })) } });
    revalidatePagePath('/');
    for (const m of moved) { revalidatePagePath(m.oldPath); revalidatePagePath(m.newPath); }
    return Response.json({ ok: true, moved: moved.length });
  } catch (e) { return errorResponse(e); }
}
