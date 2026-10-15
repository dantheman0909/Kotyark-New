import crypto from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { query, queryOne } from '@/lib/db';
import { requireUser, errorResponse, httpError } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { putObject, deleteObject } from '@/lib/storage';
import { MAX_BYTES, detectMime, imageSize, safeFilename, mediaShape, MEDIA_COLUMNS as COLUMNS } from './image-meta';

export const dynamic = 'force-dynamic';

const shape = mediaShape;

// Any logged-in user may list (the picker is used by editors and compliance).
export async function GET() {
  try {
    await requireUser();
    const rows = await query(`SELECT ${COLUMNS} FROM media ORDER BY created_at DESC LIMIT 1000`);
    return Response.json({ media: rows.map(shape) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return errorResponse(e); }
}

export async function POST(req) {
  try {
    const user = await requireUser('media:write');
    let form;
    try { form = await req.formData(); } catch { throw httpError(400, 'Expected multipart form data'); }
    const file = form.get('file');
    if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') throw httpError(400, 'A file is required');
    if (file.size > MAX_BYTES) throw httpError(413, 'Image is larger than 10 MB');
    if (file.size === 0) throw httpError(400, 'File is empty');

    const alt = typeof form.get('alt') === 'string' ? form.get('alt').trim().slice(0, 300) : '';
    const buf = Buffer.from(await file.arrayBuffer());
    const mime = detectMime(buf);
    if (!mime) throw httpError(400, 'Unsupported file. Upload a PNG, JPG, WebP or GIF image (SVG is not allowed).');

    const dims = imageSize(buf, mime);
    const filename = safeFilename(file.name, mime);
    const id = crypto.randomUUID();
    const key = `media/${id}/${filename}`;

    await putObject(key, buf);
    let row;
    try {
      row = await queryOne(
        `INSERT INTO media(id, storage_key, filename, alt, mime, size, width, height, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING ${COLUMNS}`,
        [id, key, filename, alt, mime, buf.length, dims?.width ?? null, dims?.height ?? null, user.id]);
    } catch (err) {
      await deleteObject(key).catch(() => {});
      throw err;
    }
    await audit(user, 'upload', 'media', id, `Uploaded image ${filename}`,
      { after: { filename, mime, size: buf.length, width: dims?.width ?? null, height: dims?.height ?? null, alt } });
    revalidatePath('/', 'layout');
    return Response.json({ media: shape(row) }, { status: 201 });
  } catch (e) { return errorResponse(e); }
}
