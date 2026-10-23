import { errorResponse, httpError, requireUser } from '@/lib/auth';
import { tx } from '@/lib/db';
import { audit } from '@/lib/audit';
import { blocksToText } from '@/lib/blocks/schemas';
import { htmlToText } from '@/lib/sanitize';
import { revalidatePagePath } from '@/lib/revalidate';
import { assertUuid, loadPage, shapeFull } from '../../../../_lib';

export const dynamic = 'force-dynamic';

// POST /api/pages/:id/revisions/:revId/restore -> { page }
// Copies the revision's title, blocks and SEO into the working copy (status/slug untouched).
// The previous working copy is snapshotted first ('Before restore') so the restore can be undone.
export async function POST(_req, { params }) {
  try {
    const user = await requireUser('pages:write');
    const { id, revId } = await params;
    assertUuid(id);
    if (!/^\d{1,18}$/.test(String(revId))) throw httpError(404, 'Revision not found');
    const out = await tx(async (client) => {
      const page = await loadPage(client, id, { lock: true });
      const { rows: [rev] } = await client.query('SELECT id, title, blocks, seo, created_at FROM page_revisions WHERE id = $1 AND page_id = $2', [revId, id]);
      if (!rev) throw httpError(404, 'Revision not found');
      await client.query(
        `INSERT INTO page_revisions(page_id, title, blocks, seo, note, created_by) VALUES ($1,$2,$3,$4,'Before restore',$5)`,
        [id, page.title, JSON.stringify(page.blocks), JSON.stringify(page.seo), user.id]);
      await client.query(
        `UPDATE pages SET title = $2, blocks = $3, seo = $4, search_text = $5, updated_by = $6, updated_at = now() WHERE id = $1`,
        [id, rev.title, JSON.stringify(rev.blocks), JSON.stringify(rev.seo), blocksToText(rev.blocks, htmlToText), user.id]);
      return { rev, page: await loadPage(client, id) };
    });
    await audit(user, 'restore', 'page', id, `Restored "${out.page.title}" from revision #${out.rev.id} (${new Date(out.rev.created_at).toISOString()})`, { after: { revisionId: out.rev.id } });
    revalidatePagePath(out.page.path);
    return Response.json({ page: shapeFull(out.page) });
  } catch (e) { return errorResponse(e); }
}
