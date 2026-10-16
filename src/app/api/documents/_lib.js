// Shared helpers for the documents API routes (not a route itself).
import crypto from 'node:crypto';
import { httpError } from '@/lib/auth';
import { putObject } from '@/lib/storage';
import { extractPdfText } from '@/lib/pdf-text';
import { detectMime, extForMime, isIsoDate, isHttpUrl, MAX_UPLOAD_BYTES } from '@/lib/documents';

export const NO_TEXT_WARNING = 'No searchable text found in this PDF (scanned image?). It will not appear in site search by its contents.';

/** Read a JSON or multipart body into { fields, file }. */
export async function readInput(req) {
  const ct = req.headers.get('content-type') || '';
  if (ct.includes('multipart/form-data')) {
    // Reject on the declared size before buffering the whole body (file limit + 1 MB for the other fields).
    if (Number(req.headers.get('content-length')) > MAX_UPLOAD_BYTES + 1024 * 1024) throw httpError(413, 'File is larger than 25 MB');
    const fd = await req.formData();
    const fields = {};
    let file = null;
    for (const [k, v] of fd.entries()) {
      if (k === 'file' && typeof v !== 'string') file = v;
      else if (typeof v === 'string') fields[k] = v;
    }
    return { fields, file: file && file.size > 0 ? file : null };
  }
  const fields = await req.json().catch(() => { throw httpError(400, 'Invalid JSON body'); });
  return { fields: fields && typeof fields === 'object' ? fields : {}, file: null };
}

const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const blankToNull = (v) => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim());

/**
 * Validate the metadata fields that were actually supplied. Returns a partial object keyed by column.
 * Accepts camelCase or snake_case for folderId / externalUrl / docDate.
 */
export function parseMetadata(f) {
  const out = {};
  if (has(f, 'title')) {
    const t = String(f.title || '').trim();
    if (!t || t.length > 300) throw httpError(400, 'title must be 1-300 characters');
    out.title = t;
  }
  if (has(f, 'description')) out.description = String(f.description || '').trim().slice(0, 2000);
  if (has(f, 'fy')) {
    const fy = blankToNull(f.fy);
    if (fy && fy.length > 20) throw httpError(400, 'fy is too long');
    out.fy = fy;
  }
  const dd = has(f, 'doc_date') ? 'doc_date' : has(f, 'docDate') ? 'docDate' : null;
  if (dd) {
    const d = blankToNull(f[dd]);
    if (d && !isIsoDate(d)) throw httpError(400, 'doc_date must be YYYY-MM-DD');
    out.doc_date = d;
  }
  if (has(f, 'status')) {
    if (!['draft', 'published'].includes(f.status)) throw httpError(400, 'status must be draft or published');
    out.status = f.status;
  }
  if (has(f, 'sort_order')) {
    const n = Number(f.sort_order);
    if (!Number.isInteger(n)) throw httpError(400, 'sort_order must be an integer');
    out.sort_order = n;
  }
  const fk = has(f, 'folderId') ? 'folderId' : has(f, 'folder_id') ? 'folder_id' : null;
  if (fk) out.folder_id = blankToNull(f[fk]);
  const ek = has(f, 'externalUrl') ? 'externalUrl' : has(f, 'external_url') ? 'external_url' : null;
  if (ek) {
    const u = blankToNull(f[ek]);
    if (u && !isHttpUrl(u)) throw httpError(400, 'externalUrl must be an http or https URL');
    out.external_url = u;
  }
  if (has(f, 'slug')) out.slug = blankToNull(f.slug);
  return out;
}

/**
 * Validate (size, magic bytes, allow-list), store under docs/<uuid>/<slug>.<ext>, and extract PDF text.
 * Returns the column values for the document row plus `text` (extracted text).
 */
export async function ingestFile(file, slug) {
  if (file.size > MAX_UPLOAD_BYTES) throw httpError(413, 'File is larger than 25 MB');
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = detectMime(buf, file.name);
  if (!mime) throw httpError(415, 'Unsupported file type. Allowed: PDF, DOCX, XLSX, PPTX, PNG, JPG');
  const key = `docs/${crypto.randomUUID()}/${slug}.${extForMime(mime)}`;
  await putObject(key, buf);
  const text = mime === 'application/pdf' ? await extractPdfText(buf) : '';
  return { storage_key: key, mime, size: buf.length, original_name: String(file.name || '').slice(0, 300) || null, text };
}

/** "Q3 Results - Board Meeting_2025.pdf" -> "Q3 Results - Board Meeting 2025" */
export function titleFromFilename(name) {
  return String(name || '').replace(/\.[A-Za-z0-9]{2,5}$/, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Untitled document';
}

export const DOC_RETURN = `id, folder_id, title, slug, description, storage_key, external_url, original_name, mime, size, fy,
  to_char(doc_date, 'YYYY-MM-DD') AS doc_date, status, sort_order, link_status, link_http_code, link_checked_at, created_at, updated_at`;
