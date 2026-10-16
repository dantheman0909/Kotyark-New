import { errorResponse, httpError, requireUser } from '@/lib/auth';
import { query, queryOne, tx } from '@/lib/db';
import { audit } from '@/lib/audit';
import { slugify } from '@/lib/slug';
import { SITE_URL } from '@/lib/site';
import { blocksToText } from '@/lib/blocks/schemas';
import { htmlToText } from '@/lib/sanitize';
import { PUBLISHED_NOTE } from '@/lib/pages';
import { revalidatePagePath } from '@/lib/revalidate';
import { pingIndexNow } from '@/lib/indexnow';
import { assertUuid, cleanBlocks, cleanSeo, loadPage, movePage, shapeFull, validationResponse, pageColumns } from '../_lib';

export const dynamic = 'force-dynamic';

// GET /api/pages/:id -> { page, siteUrl }   (full working copy incl. blocks, seo, previewToken)
export async function GET(_req, { params }) {
  try {
    await requireUser();
    const { id } = await params;
    assertUuid(id);
    const row = await queryOne(
      `SELECT ${pageColumns('p')},
              (p.status = 'published' AND EXISTS (
                 SELECT 1 FROM page_revisions r
                  WHERE r.id = (SELECT max(id) FROM page_revisions WHERE page_id = p.id AND note = $2)
                    AND (r.blocks IS DISTINCT FROM p.blocks OR r.seo IS DISTINCT FROM p.seo OR r.title <> p.title)
              )) AS has_unpublished_changes
         FROM pages p WHERE p.id = $1`, [id, PUBLISHED_NOTE]);
    if (!row) throw httpError(404, 'Page not found');
    return Response.json({ page: shapeFull(row), siteUrl: SITE_URL });
  } catch (e) { return errorResponse(e); }
}

// PUT /api/pages/:id  { title?, slug?, parentId?, blocks?, seo?, showInNav?, navOrder?, template? } -> { page }
// Saves the working copy. The live page only changes on publish.
export async function PUT(req, { params }) {
  try {
    const user = await requireUser('pages:write');
    const { id } = await params;
    assertUuid(id);
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') throw httpError(400, 'Invalid JSON body');
    const has = (k) => Object.prototype.hasOwnProperty.call(body, k);

    let blocks;
    if (has('blocks')) {
      const cleaned = cleanBlocks(body.blocks);
      if (cleaned.errors.length) return validationResponse(cleaned.errors);
      blocks = cleaned.blocks;
    }
    const seo = has('seo') ? cleanSeo(body.seo) : undefined;
    let title;
    if (has('title')) {
      title = String(body.title ?? '').trim();
      if (!title) throw httpError(400, 'Title is required');
      if (title.length > 200) throw httpError(400, 'Title is too long');
    }
    let template;
    if (has('template')) {
      template = String(body.template || 'default');
      if (!/^[a-z0-9_-]{1,40}$/.test(template)) throw httpError(400, 'Invalid template');
    }
    let navOrder;
    if (has('navOrder')) {
      navOrder = Math.trunc(Number(body.navOrder));
      if (!Number.isFinite(navOrder) || Math.abs(navOrder) > 100000) throw httpError(400, 'Invalid nav order');
    }

    const result = await tx(async (client) => {
      const existing = await loadPage(client, id, { lock: true });
      let moved = [];
      if (has('slug') || has('parentId')) {
        const newSlug = existing.path === '/' ? existing.slug : slugify(has('slug') ? body.slug : existing.slug);
        const newParent = has('parentId') ? (body.parentId || null) : existing.parent_id;
        moved = await movePage(client, existing, newSlug, newParent);
      }
      const sets = [];
      const vals = [];
      const set = (col, val) => { vals.push(val); sets.push(`${col} = $${vals.length}`); };
      if (title !== undefined) set('title', title);
      if (blocks !== undefined) { set('blocks', JSON.stringify(blocks)); set('search_text', blocksToText(blocks, htmlToText)); }
      if (seo !== undefined) set('seo', JSON.stringify(seo));
      if (has('showInNav')) set('show_in_nav', body.showInNav === true);
      if (navOrder !== undefined) set('nav_order', navOrder);
      if (template !== undefined) set('template', template);
      set('updated_by', user.id);
      vals.push(id);
      await client.query(`UPDATE pages SET ${sets.join(', ')}, updated_at = now() WHERE id = $${vals.length}`, vals);
      return { before: existing, after: await loadPage(client, id), moved };
    });

    const { before, after, moved } = result;
    await audit(user, 'update', 'page', id, `Saved draft of "${after.title}" (${after.path})`, {
      before: { title: before.title, path: before.path, parentId: before.parent_id, blocks: (before.blocks || []).length },
      after: { title: after.title, path: after.path, parentId: after.parent_id, blocks: (after.blocks || []).length },
      moved: moved.map(m => `${m.oldPath} -> ${m.newPath}`),
    });
    revalidatePagePath(after.path);
    for (const m of moved) { revalidatePagePath(m.oldPath); revalidatePagePath(m.newPath); }
    // A slug/parent change moves public URLs only for pages that were published (drafts have no public URL).
    pingIndexNow(moved.filter((m) => m.status === 'published').flatMap((m) => [m.oldPath, m.newPath]));
    return Response.json({ page: shapeFull(after), redirectsCreated: moved.filter(m => m.status === 'published').length });
  } catch (e) { return errorResponse(e); }
}

// DELETE /api/pages/:id  (owner only; refuses the home page and pages with sub-pages)
export async function DELETE(_req, { params }) {
  try {
    const user = await requireUser('pages:delete');
    const { id } = await params;
    assertUuid(id);
    const page = await tx(async (client) => {
      const existing = await loadPage(client, id, { lock: true });
      if (existing.path === '/') throw httpError(400, 'The home page cannot be deleted');
      const { rows: [{ n }] } = await client.query('SELECT count(*)::int AS n FROM pages WHERE parent_id = $1', [id]);
      if (n > 0) throw httpError(409, 'This page has sub-pages. Move or delete them first.');
      await client.query('DELETE FROM pages WHERE id = $1', [id]); // revisions and nav links cascade
      return existing;
    });
    await audit(user, 'delete', 'page', id, `Deleted page "${page.title}" (${page.path})`, { before: { title: page.title, path: page.path, status: page.status } });
    revalidatePagePath(page.path);
    if (page.status === 'published') pingIndexNow([page.path]); // was public
    return Response.json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
