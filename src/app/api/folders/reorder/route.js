import { tx } from '@/lib/db';
import { requireUser, errorResponse, httpError } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { revalidateFolder } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

// POST /api/folders/reorder  JSON { ids: [folderId, ...] }  -> sort_order = position in the array
export async function POST(req) {
  try {
    const user = await requireUser('documents:write');
    const body = await req.json().catch(() => { throw httpError(400, 'Invalid JSON body'); });
    const ids = body.ids;
    if (!Array.isArray(ids) || !ids.length || ids.length > 500 || ids.some((i) => typeof i !== 'string')) {
      throw httpError(400, 'ids must be a non-empty array of folder ids');
    }
    await tx(async (c) => {
      for (let i = 0; i < ids.length; i++) {
        await c.query('UPDATE document_folders SET sort_order = $1, updated_at = now() WHERE id = $2', [i + 1, ids[i]]);
      }
    });
    await audit(user, 'update', 'folder', null, `Reordered ${ids.length} folders`, { after: { ids } });
    revalidateFolder(null);
    return Response.json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
