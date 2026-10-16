import { query, queryOne, tx } from '@/lib/db';
import { getCurrentUser, can, requireUser, errorResponse, httpError } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { slugify } from '@/lib/slug';
import { autoDescription } from '@/lib/pdf-text';
import { deleteObject } from '@/lib/storage';
import { revalidateFolder } from '@/lib/revalidate';
import {
  getFolderById, getDocumentById, extForMime, documentFileUrl, documentLandingPath, addRedirect,
} from '@/lib/documents';
import { readInput, parseMetadata, ingestFile, DOC_RETURN, NO_TEXT_WARNING } from '../_lib';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const decorate = (d) => ({ ...d, url: documentFileUrl(d), landing_path: documentLandingPath(d.folder_slug, d) });

async function loadOr404(id) {
  if (!UUID_RE.test(id)) throw httpError(404, 'Document not found');
  const doc = await getDocumentById(id);
  if (!doc) throw httpError(404, 'Document not found');
  return doc;
}

export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    const doc = await loadOr404(id);
    const user = await getCurrentUser();
    const editor = user && can(user, 'documents:write');
    if (!editor && (doc.status !== 'published' || !doc.folder_visible)) throw httpError(404, 'Document not found');
    return Response.json({ document: decorate(doc) });
  } catch (e) { return errorResponse(e); }
}

// PUT /api/documents/:id
//   JSON or multipart. Any of title, description, fy, doc_date (''/null clears), status, sort_order,
//   folderId (move), externalUrl, slug (explicit only; records 301s).
//   multipart `file` = replace the file; URL/slug are kept and the old stored object is deleted.
export async function PUT(req, { params }) {
  let newKey = null;
  let ing_noText = false;
  try {
    const user = await requireUser('documents:write');
    const { id } = await params;
    const before = await loadOr404(id);
    const { fields, file } = await readInput(req);
    const meta = parseMetadata(fields);

    const set = {};
    for (const k of ['title', 'description', 'fy', 'doc_date', 'status', 'sort_order', 'external_url']) {
      if (k in meta) set[k] = meta[k];
    }

    let targetFolder = { id: before.folder_id, slug: before.folder_slug };
    if (meta.folder_id && meta.folder_id !== before.folder_id) {
      const f = await getFolderById(meta.folder_id);
      if (!f) throw httpError(404, 'Target folder not found');
      set.folder_id = f.id; targetFolder = f;
    }
    let newSlug = null;
    if (meta.slug && meta.slug !== before.slug) {
      newSlug = slugify(meta.slug);
      if (await queryOne('SELECT 1 FROM documents WHERE slug = $1 AND id <> $2', [newSlug, id])) throw httpError(409, 'That slug is already used by another document');
      set.slug = newSlug;
    }
    if ('external_url' in set && !set.external_url && !before.storage_key && !file) {
      throw httpError(400, 'A document needs a file or an external URL');
    }
    // A corrected legacy URL is no longer known-broken: reset until the next check.
    if (!file && !before.storage_key && 'external_url' in set && set.external_url && set.external_url !== before.external_url) {
      Object.assign(set, { link_status: 'unchecked', link_http_code: null });
    }
    if (file) {
      const ing = await ingestFile(file, newSlug || before.slug);
      newKey = ing.storage_key;
      ing_noText = ing.mime === 'application/pdf' && !ing.text.trim();
      Object.assign(set, { storage_key: ing.storage_key, mime: ing.mime, size: ing.size, original_name: ing.original_name, extracted_text: ing.text });
      if (!('description' in set) && !before.description) set.description = autoDescription(ing.text);
      // A stored file is served from App Storage: any legacy external URL no longer matters, so it is never "broken".
      Object.assign(set, { link_status: 'n/a', link_http_code: null, link_checked_at: new Date() });
    }
    const cols = Object.keys(set);
    if (!cols.length) return Response.json({ document: decorate(before) });

    const updated = await tx(async (c) => {
      const vals = cols.map((k) => set[k]);
      const r = await c.query(
        `UPDATE documents SET ${cols.map((k, i) => `${k} = $${i + 1}`).join(', ')}, updated_by = $${cols.length + 1}, updated_at = now()
          WHERE id = $${cols.length + 2} RETURNING ${DOC_RETURN}`,
        [...vals, user.id, id]);
      const row = r.rows[0];
      const oldPath = documentLandingPath(before.folder_slug, before);
      const newPath = documentLandingPath(targetFolder.slug, row);
      await addRedirect(oldPath, newPath, c); // no-op when the path is unchanged
      // The stable file URL is /files/<slug>.<ext>: a slug change must keep the old one working too.
      if (before.storage_key && row.storage_key && before.slug !== row.slug) {
        await addRedirect(`/files/${before.slug}.${extForMime(before.mime)}`, `/files/${row.slug}.${extForMime(row.mime)}`, c);
      }
      return row;
    });
    if (file && before.storage_key) await deleteObject(before.storage_key).catch((e) => console.warn('Old object delete failed:', e.message));

    const doc = { ...updated, folder_slug: targetFolder.slug };
    await audit(user, file ? 'upload' : 'update', 'document', id,
      file ? `Replaced file for "${doc.title}"` : `Updated document "${doc.title}"`,
      { before: { title: before.title, folder: before.folder_slug, status: before.status, fy: before.fy, doc_date: before.doc_date },
        after: { title: doc.title, folder: doc.folder_slug, status: doc.status, fy: doc.fy, doc_date: doc.doc_date, fileReplaced: Boolean(file) },
        ...(file ? { replacedFile: { storage_key: before.storage_key || null, original_name: before.original_name || null, size: before.size ?? null, external_url: before.external_url || null } } : {}) });
    revalidateFolder(before.folder_slug);
    if (targetFolder.slug !== before.folder_slug) revalidateFolder(targetFolder.slug);
    const warning = file && ing_noText ? NO_TEXT_WARNING : undefined;
    return Response.json({ document: decorate(doc), ...(warning ? { warning } : {}) });
  } catch (e) {
    if (newKey) await deleteObject(newKey).catch(() => {});
    if (e?.code === '23505') return errorResponse(httpError(409, 'A document with that link already exists in the folder'));
    return errorResponse(e);
  }
}

// DELETE /api/documents/:id  (removes the stored object too)
export async function DELETE(_req, { params }) {
  try {
    const user = await requireUser('documents:delete');
    const { id } = await params;
    const doc = await loadOr404(id);
    await query('DELETE FROM documents WHERE id = $1', [id]);
    if (doc.storage_key) await deleteObject(doc.storage_key).catch((e) => console.warn('Object delete failed:', e.message));
    await audit(user, 'delete', 'document', id, `Deleted document "${doc.title}"`,
      { before: { slug: doc.slug, folder: doc.folder_slug, storage_key: doc.storage_key, external_url: doc.external_url } });
    revalidateFolder(doc.folder_slug);
    return Response.json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
