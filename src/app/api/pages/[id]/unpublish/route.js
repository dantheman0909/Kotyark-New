import { errorResponse, requireUser } from '@/lib/auth';
import { tx } from '@/lib/db';
import { audit } from '@/lib/audit';
import { revalidatePagePath } from '@/lib/revalidate';
import { assertUuid, loadPage, shapeFull } from '../../_lib';

export const dynamic = 'force-dynamic';

// POST /api/pages/:id/unpublish -> { page }   (back to draft; the public URL stops resolving)
export async function POST(_req, { params }) {
  try {
    const user = await requireUser('pages:publish');
    const { id } = await params;
    assertUuid(id);
    const out = await tx(async (client) => {
      const before = await loadPage(client, id, { lock: true });
      await client.query(
        `UPDATE pages SET status = 'draft', published_at = NULL, updated_by = $2, updated_at = now(),
                live_title = '', live_search_text = '', live_seo = '{}'::jsonb WHERE id = $1`, [id, user.id]);
      return { before, after: await loadPage(client, id) };
    });
    await audit(user, 'unpublish', 'page', id, `Unpublished "${out.after.title}" (${out.after.path})`, { before: { status: out.before.status }, after: { status: 'draft' } });
    revalidatePagePath(out.after.path);
    return Response.json({ page: shapeFull(out.after) });
  } catch (e) { return errorResponse(e); }
}
