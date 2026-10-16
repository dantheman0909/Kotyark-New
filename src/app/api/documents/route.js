import { query } from '@/lib/db';
import { getCurrentUser, can, requireUser, errorResponse, httpError } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { uniqueSlug } from '@/lib/slug';
import { autoDescription } from '@/lib/pdf-text';
import { deleteObject } from '@/lib/storage';
import { revalidateFolder } from '@/lib/revalidate';
import { pingIndexNow, publicDocPaths } from '@/lib/indexnow';
import {
  getFolderById, listDocuments, listAllDocuments, listLinkIssues, documentFileUrl, documentLandingPath,
} from '@/lib/documents';
import { readInput, parseMetadata, ingestFile, titleFromFilename, DOC_RETURN, NO_TEXT_WARNING } from './_lib';

export const dynamic = 'force-dynamic';

const decorate = (d) => ({ ...d, url: documentFileUrl(d), landing_path: documentLandingPath(d.folder_slug, d) });

// GET /api/documents[?folderId=...] -> { documents: [...] }  (never includes extracted_text)
// Unauthenticated callers only ever see published documents in visible folders.
export async function GET(req) {
  try {
    const sp = new URL(req.url).searchParams;
    const folderId = sp.get('folderId');
    const linkStatus = sp.get('linkStatus');
    const user = await getCurrentUser();
    const editor = Boolean(user && can(user, 'documents:write'));
    let docs;
    // ?linkStatus=broken|error: documents:write only (ignored for everyone else). Lets the admin panel reload the
    // persisted broken set without re-probing every URL.
    if (editor && (linkStatus === 'broken' || linkStatus === 'error')) {
      docs = await listLinkIssues(); // both values return the same attention set (LINK_ATTENTION_SQL)
    } else if (folderId) {
      const folder = await getFolderById(folderId);
      if (!folder || (!folder.visible && !editor)) return Response.json({ documents: [] });
      docs = await listDocuments(folderId, { publishedOnly: !editor });
    } else {
      docs = await listAllDocuments({ publishedOnly: !editor });
    }
    return Response.json({ documents: docs.map(decorate) });
  } catch (e) { return errorResponse(e); }
}

// POST /api/documents  multipart/form-data
//   file? | externalUrl?  (one required), folderId (required), title?, fy?, doc_date?, status?, sort_order?, description?
// -> 201 { document }.  JSON body accepted for external links only.
export async function POST(req) {
  let storedKey = null;
  try {
    const user = await requireUser('documents:write');
    const { fields, file } = await readInput(req);
    const meta = parseMetadata(fields);
    if (!meta.folder_id) throw httpError(400, 'folderId is required');
    const folder = await getFolderById(meta.folder_id);
    if (!folder) throw httpError(404, 'Folder not found');
    if (!file && !meta.external_url) throw httpError(400, 'Provide a file or an externalUrl');

    const title = meta.title || (file ? titleFromFilename(file.name) : titleFromFilename(decodeURIComponent(new URL(meta.external_url).pathname.split('/').pop() || '')));
    const slug = await uniqueSlug(meta.slug || title, async (s) => (await query('SELECT 1 FROM documents WHERE slug = $1', [s])).length > 0);

    let stored = { storage_key: null, mime: 'application/pdf', size: 0, original_name: null, text: '' };
    if (file) { stored = await ingestFile(file, slug); storedKey = stored.storage_key; }
    const description = meta.description || autoDescription(stored.text);

    let sortOrder = meta.sort_order;
    if (sortOrder === undefined) sortOrder = 0;

    const rows = await query(
      `INSERT INTO documents(folder_id, title, slug, description, storage_key, external_url, original_name, mime, size,
                             fy, doc_date, extracted_text, status, sort_order, link_status, link_checked_at, created_by, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$17)
       RETURNING ${DOC_RETURN}`,
      [folder.id, title, slug, description, stored.storage_key, meta.external_url ?? null, stored.original_name, stored.mime,
        stored.size, meta.fy ?? null, meta.doc_date ?? null, stored.text, meta.status || 'published', sortOrder,
        stored.storage_key || !meta.external_url ? 'n/a' : 'unchecked', stored.storage_key ? new Date() : null, user.id]);
    const doc = { ...rows[0], folder_slug: folder.slug };
    await audit(user, 'upload', 'document', doc.id, `Added document "${title}" to ${folder.name}`,
      { after: { slug, folder: folder.slug, storage_key: doc.storage_key, external_url: doc.external_url } });
    revalidateFolder(folder.slug);
    pingIndexNow(publicDocPaths(doc, folder.slug, folder.visible)); // only when published AND in a visible folder
    const warning = file && stored.mime === 'application/pdf' && !String(stored.text || '').trim() ? NO_TEXT_WARNING : undefined;
    return Response.json({ document: decorate(doc), ...(warning ? { warning } : {}) }, { status: 201 });
  } catch (e) {
    if (storedKey) await deleteObject(storedKey).catch(() => {});
    if (e?.code === '23505') return errorResponse(httpError(409, 'A document with that link already exists in this folder'));
    return errorResponse(e);
  }
}
