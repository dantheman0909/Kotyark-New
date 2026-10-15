import { query } from '@/lib/db';
import { requireUser, errorResponse, httpError } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { revalidateFolder } from '@/lib/revalidate';
import { getFolderById, addRedirect } from '@/lib/documents';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/documents/bulk  JSON { ids: [docId...], folderId }  -> { ok, moved }
export async function POST(req) {
  try {
    const user = await requireUser('documents:write');
    const body = await req.json().catch(() => { throw httpError(400, 'Invalid JSON body'); });
    const { ids, folderId } = body;
    if (!Array.isArray(ids) || !ids.length || ids.length > 500 || !ids.every((i) => UUID_RE.test(String(i)))) {
      throw httpError(400, 'ids must be 1-500 document ids');
    }
    const target = await getFolderById(folderId);
    if (!target) throw httpError(404, 'Target folder not found');

    const before = await query(
      `SELECT d.id, d.slug, d.folder_id, f.slug AS folder_slug FROM documents d JOIN document_folders f ON f.id = d.folder_id
        WHERE d.id = ANY($1::uuid[])`, [ids]);
    const toMove = before.filter((d) => d.folder_id !== target.id);
    if (toMove.length) {
      await query('UPDATE documents SET folder_id = $1, updated_by = $2, updated_at = now() WHERE id = ANY($3::uuid[])',
        [target.id, user.id, toMove.map((d) => d.id)]);
      for (const d of toMove) await addRedirect(`/investors/${d.folder_slug}/${d.slug}`, `/investors/${target.slug}/${d.slug}`);
    }
    await audit(user, 'update', 'document', null, `Moved ${toMove.length} document(s) to ${target.name}`,
      { after: { ids: toMove.map((d) => d.id), folder: target.slug } });
    for (const s of new Set([target.slug, ...toMove.map((d) => d.folder_slug)])) revalidateFolder(s);
    return Response.json({ ok: true, moved: toMove.length });
  } catch (e) {
    if (e?.code === '23505') return errorResponse(httpError(409, 'A moved document duplicates an external link already in the target folder'));
    return errorResponse(e);
  }
}
