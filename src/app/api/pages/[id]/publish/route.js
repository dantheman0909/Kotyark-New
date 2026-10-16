import { errorResponse, httpError, requireUser } from '@/lib/auth';
import { tx } from '@/lib/db';
import { audit } from '@/lib/audit';
import { PUBLISHED_NOTE } from '@/lib/pages';
import { revalidatePagePath } from '@/lib/revalidate';
import { pingIndexNow } from '@/lib/indexnow';
import { assertUuid, cleanBlocks, loadPage, shapeFull, validationResponse } from '../../_lib';

export const dynamic = 'force-dynamic';

// POST /api/pages/:id/publish -> { page }
// Marks the page published and snapshots the working copy as the live version (page_revisions, note 'Published').
export async function POST(_req, { params }) {
  try {
    const user = await requireUser('pages:publish');
    const { id } = await params;
    assertUuid(id);
    const out = await tx(async (client) => {
      const page = await loadPage(client, id, { lock: true });
      if (!Array.isArray(page.blocks) || page.blocks.length === 0) throw httpError(400, 'Add at least one block before publishing.');
      const { errors } = cleanBlocks(page.blocks);
      if (errors.length) return { invalid: errors };
      await client.query(
        `UPDATE pages SET status = 'published', published_at = now(), updated_by = $2, updated_at = now(),
                live_title = title, live_search_text = search_text, live_seo = seo
          WHERE id = $1`, [id, user.id]);
      await client.query(
        `INSERT INTO page_revisions(page_id, title, blocks, seo, note, created_by) VALUES ($1,$2,$3,$4,$5,$6)`,
        [id, page.title, JSON.stringify(page.blocks), JSON.stringify(page.seo), PUBLISHED_NOTE, user.id]);
      await client.query('DELETE FROM redirects WHERE from_path = $1', [page.path]); // a real page now lives here
      return { page: await loadPage(client, id), was: page.status };
    });
    if (out.invalid) return validationResponse(out.invalid);
    await audit(user, 'publish', 'page', id, `Published "${out.page.title}" at ${out.page.path}`, { before: { status: out.was }, after: { status: 'published' } });
    revalidatePagePath(out.page.path);
    await pingIndexNow([out.page.path]); // now public
    return Response.json({ page: shapeFull(out.page) });
  } catch (e) { return errorResponse(e); }
}
