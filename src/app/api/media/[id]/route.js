import { revalidatePath } from 'next/cache';
import { query, queryOne } from '@/lib/db';
import { requireUser, errorResponse, httpError } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { deleteObject } from '@/lib/storage';
import { MEDIA_COLUMNS, mediaShape } from '../image-meta';

export const dynamic = 'force-dynamic';

const isUuid = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s || '');

export async function PUT(req, { params }) {
  try {
    const user = await requireUser('media:write');
    const { id } = await params;
    if (!isUuid(id)) throw httpError(404, 'Not found');
    let body;
    try { body = await req.json(); } catch { throw httpError(400, 'Invalid JSON body'); }
    if (typeof body?.alt !== 'string') throw httpError(400, 'alt must be text');
    const alt = body.alt.trim().slice(0, 300);

    const before = await queryOne(`SELECT alt, filename FROM media WHERE id = $1`, [id]);
    if (!before) throw httpError(404, 'Not found');
    const row = await queryOne(`UPDATE media SET alt = $2 WHERE id = $1 RETURNING ${MEDIA_COLUMNS}`, [id, alt]);
    await audit(user, 'update', 'media', id, `Updated alt text of ${before.filename}`,
      { before: { alt: before.alt }, after: { alt } });
    revalidatePath('/', 'layout');
    return Response.json({ media: mediaShape(row) });
  } catch (e) { return errorResponse(e); }
}

// DELETE /api/media/:id            -> 409 with {usedBy} when referenced by a page or setting
// DELETE /api/media/:id?force=1    -> delete anyway
export async function DELETE(req, { params }) {
  try {
    const user = await requireUser('media:write');
    const { id } = await params;
    if (!isUuid(id)) throw httpError(404, 'Not found');
    const force = new URL(req.url).searchParams.get('force') === '1';

    const row = await queryOne(`SELECT storage_key, filename FROM media WHERE id = $1`, [id]);
    if (!row) throw httpError(404, 'Not found');

    if (!force) {
      const pages = await query(
        `SELECT title FROM pages WHERE position($1 in blocks::text) > 0 OR position($1 in seo::text) > 0 LIMIT 10`, [id]);
      const settings = await query(
        `SELECT key FROM site_settings WHERE position($1 in value::text) > 0`, [id]);
      if (pages.length || settings.length) {
        const usedBy = [...pages.map((p) => `Page: ${p.title}`), ...settings.map((s) => `Setting: ${s.key}`)];
        return Response.json({ error: `This image is in use (${usedBy.join(', ')}). Remove it there first, or delete anyway.`, usedBy }, { status: 409 });
      }
    }

    await query(`DELETE FROM media WHERE id = $1`, [id]);
    await deleteObject(row.storage_key).catch((e) => console.error('media object delete failed', e));
    await audit(user, 'delete', 'media', id, `Deleted image ${row.filename}`, { before: { filename: row.filename, force } });
    revalidatePath('/', 'layout');
    return Response.json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
