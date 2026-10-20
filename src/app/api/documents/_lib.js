// Shared helpers for the documents API routes (not a route itself).
import crypto from 'node:crypto';
import { httpError } from '@/lib/auth';
import { Readable } from 'node:stream';
import { afterCommit } from '@/lib/after-commit';
import { putObject, putObjectStream, getObject, deleteObject, objectExists } from '@/lib/storage';
import { claimUpload, releaseUpload, discardUpload, partKey } from '@/lib/uploads';
import { extractPdfTextInfo, reserveExtraction } from '@/lib/pdf-text';
import { detectMime, extForMime, isIsoDate, isHttpUrl, MULTIPART_MAX_BYTES, PDF_TEXT_MAX_BYTES } from '@/lib/documents';

export const TOO_BIG_TEXT_WARNING = 'Too large to index its text for site search (over 25 MB); the title and details are still searchable.';
export const TRUNCATED_TEXT_WARNING = 'Only the first 150 pages of this PDF are indexed for site search.';
export const NO_TEXT_WARNING = 'No searchable text found in this PDF (scanned image?). It will not appear in site search by its contents.';

const MULTIPART_TOO_BIG = 'File is larger than 10 MB for a direct upload; use the chunked upload for larger files';

/** Pass the body through, failing the moment more than `max` bytes have arrived (a lying or absent Content-Length cannot get past it). */
function capBody(body, max, tripped) {
  let n = 0;
  return body.pipeThrough(new TransformStream({
    transform(chunk, ctl) {
      n += chunk.byteLength;
      if (n > max) { tripped.hit = true; ctl.error(httpError(413, MULTIPART_TOO_BIG)); } else ctl.enqueue(chunk);
    },
  }));
}

/** Read a JSON or multipart body into { fields, file }. */
export async function readInput(req) {
  const ct = req.headers.get('content-type') || '';
  if (ct.includes('multipart/form-data')) {
    // The buffered path: file limit + 1 MB for the other fields, checked on the declared size AND on the actual stream.
    const limit = MULTIPART_MAX_BYTES + 1024 * 1024;
    const declared = req.headers.get('content-length');
    if (declared !== null && Number(declared) > limit) throw httpError(413, MULTIPART_TOO_BIG);
    if (!req.body) throw httpError(400, 'Empty body');
    const tripped = { hit: false };
    let fd;
    try { fd = await new Response(capBody(req.body, limit, tripped), { headers: { 'content-type': ct } }).formData(); }
    catch (e) { throw tripped.hit ? httpError(413, MULTIPART_TOO_BIG) : httpError(400, 'Invalid multipart body'); }
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
 * If the body named a completed chunked upload (`uploadId`), claim it atomically and return a file-like
 * { name, size, upload } for it (404 unless it is the caller's own session, 409 if another request is saving it).
 * Otherwise return `file` unchanged. After a failure call failUpload(); after the DB write succeeds call `ing.discard()`.
 */
export async function resolveUploadFile(fields, user, file) {
  if (!fields.uploadId) return file;
  if (file) throw httpError(400, 'Send either a file or an uploadId, not both');
  const up = await claimUpload(String(fields.uploadId), user);
  return { name: up.filename, size: up.size, upload: up };
}

/**
 * A completion failed. A permanent problem with the file itself (e.discardUpload) removes the session; anything else
 * (database error, transient storage error, a validation problem with the form) gives the claim back so the admin can
 * retry the save without re-uploading. Never throws.
 */
export async function failUpload(file, e) {
  if (!file?.upload) return;
  if (e?.discardUpload) await discardUpload(file.upload.id); else await releaseUpload(file.upload.id);
}

const permanent = (status, msg) => Object.assign(httpError(status, msg), { discardUpload: true });

async function* partChunks(up) {
  for (let n = 0; n < up.parts; n++) {
    const b = await getObject(partKey(up.id, n));
    if (!b) throw httpError(400, `Upload part ${n} is missing`);
    yield b;
  }
}

async function ingestUpload(up, slug) {
  const got = new Set(up.received);
  for (let n = 0; n < up.parts; n++) if (!got.has(n)) throw httpError(400, `Upload is incomplete: part ${n} was not received`);
  // Every part must exist before the final object is opened, so a gap fails fast instead of mid-stream.
  for (let n = 0; n < up.parts; n++) if (!(await objectExists(partKey(up.id, n)))) throw httpError(400, `Upload part ${n} is missing; send it again`);
  const mime = up.mime; // detected from part 0 when it was received
  if (!mime) throw httpError(400, 'Upload part 0 is missing; send it again');
  const key = `docs/${crypto.randomUUID()}/${slug}.${extForMime(mime)}`;
  let text = '';
  let tooBig = false;
  let truncated = false;
  let ticket = null;
  try {
    if (mime === 'application/pdf' && up.size <= PDF_TEXT_MAX_BYTES) {
      ticket = reserveExtraction(); // 503 before the (up to 25 MB) buffer exists if the queue is full
      // Text extraction needs the whole buffer: one allocation, parts copied in (no second copy from Buffer.concat).
      const whole = Buffer.allocUnsafe(up.size);
      let off = 0;
      for await (const b of partChunks(up)) {
        if (off + b.length > up.size) throw permanent(400, 'Upload size does not match the declared size');
        b.copy(whole, off); off += b.length;
      }
      if (off !== up.size) throw permanent(400, 'Upload size does not match the declared size');
      await putObject(key, whole);
      const info = await extractPdfTextInfo(whole, { ticket });
      ticket = null; // released by the extraction
      text = info.text; truncated = info.truncated;
    } else {
      let total = 0;
      const counted = async function* () { for await (const b of partChunks(up)) { total += b.length; yield b; } };
      await putObjectStream(key, Readable.from(counted()));
      if (total !== up.size) throw permanent(400, 'Upload size does not match the declared size');
      tooBig = mime === 'application/pdf';
    }
  } catch (e) {
    ticket?.release();
    await deleteObject(key).catch(() => {});
    throw e;
  }
  return {
    storage_key: key, mime, size: up.size, original_name: String(up.filename || '').slice(0, 300) || null, text, tooBig, truncated,
    discard: () => discardUpload(up.id), // call once the document row has been written
  };
}

/**
 * Validate (size, magic bytes, allow-list), store under docs/<uuid>/<slug>.<ext>, and extract PDF text.
 * Returns the column values for the document row plus `text` (extracted text).
 */
export async function ingestFile(file, slug) {
  if (file.upload) return ingestUpload(file.upload, slug);
  if (file.size > MULTIPART_MAX_BYTES) throw httpError(413, MULTIPART_TOO_BIG);
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = detectMime(buf, file.name);
  if (!mime) throw httpError(415, 'Unsupported file type. Allowed: PDF, DOCX, XLSX, PPTX, PNG, JPG');
  const key = `docs/${crypto.randomUUID()}/${slug}.${extForMime(mime)}`;
  const canIndex = mime === 'application/pdf' && buf.length <= PDF_TEXT_MAX_BYTES;
  const ticket = canIndex ? reserveExtraction() : null; // 503 before anything is stored if the queue is full
  let info = { text: '', truncated: false };
  try {
    await putObject(key, buf);
    if (canIndex) info = await extractPdfTextInfo(buf, { ticket });
  } catch (e) { ticket?.release(); await deleteObject(key).catch(() => {}); throw e; }
  const text = info.text;
  return { storage_key: key, mime, size: buf.length, original_name: String(file.name || '').slice(0, 300) || null, text, truncated: info.truncated, tooBig: mime === 'application/pdf' && !canIndex };
}

/** "Q3 Results - Board Meeting_2025.pdf" -> "Q3 Results - Board Meeting 2025" */
export function titleFromFilename(name) {
  return String(name || '').replace(/\.[A-Za-z0-9]{2,5}$/, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Untitled document';
}

export const DOC_RETURN = `id, folder_id, title, slug, description, storage_key, external_url, original_name, mime, size, fy,
  to_char(doc_date, 'YYYY-MM-DD') AS doc_date, status, sort_order, link_status, link_http_code, link_checked_at, created_at, updated_at`;

export { afterCommit };
