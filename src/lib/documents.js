// Data access for investor document folders + documents. Server-only.
// Columns are always named explicitly; extracted_text is never selected here.
import { query, queryOne } from './db';

/** The legacy "Investor Relations" root folder is a container, never shown as a section. */
export const ROOT_FOLDER_SLUG = 'investors';

export const GROUP_BY = ['none', 'fy', 'year'];

// mime -> extension, and the allow-list for uploads.
export const FILE_TYPES = {
  'application/pdf': { ext: 'pdf', label: 'PDF' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'docx', label: 'DOCX' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: 'xlsx', label: 'XLSX' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { ext: 'pptx', label: 'PPTX' },
  'image/png': { ext: 'png', label: 'PNG' },
  'image/jpeg': { ext: 'jpg', label: 'JPG' },
};
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const FOLDER_COLS = `f.id, f.parent_id, f.slug, f.name, f.description, f.group_by, f.visible, f.sort_order,
  f.created_at, f.updated_at`;

const DOC_COLS = `d.id, d.folder_id, d.title, d.slug, d.description, d.storage_key, d.external_url, d.original_name,
  d.mime, d.size, d.fy, to_char(d.doc_date, 'YYYY-MM-DD') AS doc_date, d.status, d.sort_order,
  d.link_status, d.link_http_code, d.link_checked_at, d.created_at, d.updated_at`;

/**
 * Folders ordered for display. Public callers pass {visibleOnly:true}.
 * Each row carries `document_count` (published documents only unless includeDrafts).
 * `withIntro` adds intro_html (admin editor). The legacy root container is omitted unless includeRoot.
 */
export async function listFolders({ visibleOnly = false, withIntro = false, includeDrafts = false, includeRoot = false, withBroken = false } = {}) {
  const where = [];
  if (visibleOnly) where.push('f.visible = true');
  if (!includeRoot) where.push(`f.slug <> '${ROOT_FOLDER_SLUG}'`);
  return query(
    `SELECT ${FOLDER_COLS}${withIntro ? ', f.intro_html' : ''},
            (SELECT count(*)::int FROM documents d WHERE d.folder_id = f.id${includeDrafts ? '' : " AND d.status = 'published'"}) AS document_count${withBroken ? `,
            (SELECT count(*)::int FROM documents d WHERE d.folder_id = f.id AND d.link_status IN ('broken','error') AND d.storage_key IS NULL) AS broken_count` : ''}
       FROM document_folders f
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY f.sort_order, f.name`);
}

export async function getFolderBySlug(slug, { visibleOnly = false } = {}) {
  return queryOne(
    `SELECT ${FOLDER_COLS}, f.intro_html, f.seo
       FROM document_folders f
      WHERE f.slug = $1 ${visibleOnly ? 'AND f.visible = true' : ''}`, [slug]);
}

export async function getFolderById(id) {
  return queryOne(`SELECT ${FOLDER_COLS}, f.intro_html, f.seo FROM document_folders f WHERE f.id = $1`, [id]);
}

/** Documents in a folder, newest first within explicit sort_order. */
export async function listDocuments(folderId, { publishedOnly = true } = {}) {
  return query(
    `SELECT ${DOC_COLS}, f.slug AS folder_slug
       FROM documents d JOIN document_folders f ON f.id = d.folder_id
      WHERE d.folder_id = $1 ${publishedOnly ? "AND d.status = 'published'" : ''}
      ORDER BY d.sort_order, d.doc_date DESC NULLS LAST, d.created_at DESC`, [folderId]);
}

/** Admin: every document (bounded). */
export async function listAllDocuments({ publishedOnly = false, limit = 1000 } = {}) {
  return query(
    `SELECT ${DOC_COLS}, f.slug AS folder_slug
       FROM documents d JOIN document_folders f ON f.id = d.folder_id
      ${publishedOnly ? "WHERE d.status = 'published' AND f.visible = true" : ''}
      ORDER BY d.created_at DESC LIMIT $1`, [Math.min(Math.max(1, limit), 5000)]);
}

/** Admin: documents whose legacy link last probed broken/unreachable (stored files are never listed). */
export async function listLinkIssues(linkStatus = 'broken') {
  const statuses = linkStatus === 'error' ? ['error'] : ['broken', 'error'];
  return query(
    `SELECT ${DOC_COLS}, f.slug AS folder_slug, f.name AS folder_name
       FROM documents d JOIN document_folders f ON f.id = d.folder_id
      WHERE d.link_status = ANY($1) AND d.storage_key IS NULL
      ORDER BY f.sort_order, f.name, d.sort_order, d.title LIMIT 1000`, [statuses]);
}

export async function getDocumentBySlug(slug, { publishedOnly = true } = {}) {
  return queryOne(
    `SELECT ${DOC_COLS}, f.slug AS folder_slug, f.name AS folder_name, f.visible AS folder_visible
       FROM documents d JOIN document_folders f ON f.id = d.folder_id
      WHERE d.slug = $1 ${publishedOnly ? "AND d.status = 'published' AND f.visible = true" : ''}`, [slug]);
}

export async function getDocumentById(id) {
  return queryOne(
    `SELECT ${DOC_COLS}, d.created_by, f.slug AS folder_slug, f.visible AS folder_visible
       FROM documents d JOIN document_folders f ON f.id = d.folder_id WHERE d.id = $1`, [id]);
}

export function extForMime(mime) { return FILE_TYPES[mime]?.ext || 'pdf'; }
export function labelForMime(mime) { return FILE_TYPES[mime]?.label || 'FILE'; }

/** Public URL of the file: our stable /files route when stored, else the legacy external URL. */
export function documentFileUrl(doc) {
  if (doc.storage_key) return `/files/${doc.slug}.${extForMime(doc.mime)}`;
  return doc.external_url || null;
}

export function documentLandingPath(folderSlug, doc) {
  return `/investors/${folderSlug}/${doc.slug}`;
}

/** Indian financial year label for a YYYY-MM-DD date ('FY 2024-25'). */
export function fyOfDate(isoDate) {
  const m = /^(\d{4})-(\d{2})-\d{2}/.exec(String(isoDate || ''));
  if (!m) return null;
  const y = Number(m[1]);
  const start = Number(m[2]) >= 4 ? y : y - 1;
  return `FY ${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

/**
 * Group documents per the folder's group_by.
 * Returns [{ key, label, docs }]. 'none' -> a single group with label null.
 * Groups are ordered newest first; documents keep the order they arrived in.
 */
export function groupDocuments(docs, groupBy = 'none') {
  if (groupBy !== 'fy' && groupBy !== 'year') return [{ key: 'all', label: null, docs }];
  const buckets = new Map();
  for (const d of docs) {
    let label;
    if (groupBy === 'fy') label = (d.fy && d.fy.trim()) || fyOfDate(d.doc_date) || 'Other';
    else label = d.doc_date ? d.doc_date.slice(0, 4) : 'Undated';
    if (!buckets.has(label)) buckets.set(label, []);
    buckets.get(label).push(d);
  }
  const rank = (label) => {
    const n = /(\d{4})/.exec(label);
    return n ? Number(n[1]) : -1; // 'Other' / 'Undated' sink to the bottom
  };
  return [...buckets.entries()]
    .sort((a, b) => rank(b[0]) - rank(a[0]))
    .map(([label, list]) => ({ key: label, label, docs: list }));
}

/** 'YYYY-MM-DD' -> '14 Feb 2025' (UTC-safe). */
export function formatDocDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(m[3])} ${months[Number(m[2]) - 1]} ${m[1]}`;
}

/** True for a real calendar date in YYYY-MM-DD form. */
export function isIsoDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s))) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** http/https URL check for external document links. */
export function isHttpUrl(s) {
  try { const u = new URL(String(s)); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; }
}

/** Detect an allowed file type from magic bytes + the claimed filename. Returns mime or null. */
export function detectMime(buf, filename = '') {
  if (!buf || buf.length < 4) return null;
  if (buf.subarray(0, 4).toString('latin1') === '%PDF') return 'application/pdf';
  if (buf[0] === 0x89 && buf.subarray(1, 4).toString('latin1') === 'PNG') return 'image/png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04) { // zip container (OOXML)
    const ext = String(filename).toLowerCase().split('.').pop();
    return Object.keys(FILE_TYPES).find((m) => FILE_TYPES[m].ext === ext && ext !== 'pdf' && ext !== 'png' && ext !== 'jpg') || null;
  }
  return null;
}

/** Record a 301 from an old public path to its replacement (idempotent). Skips no-ops. */
export async function addRedirect(fromPath, toPath, client = null) {
  if (!fromPath || !toPath || fromPath === toPath) return;
  const run = (sql, params) => (client ? client.query(sql, params) : query(sql, params));
  await run('DELETE FROM redirects WHERE from_path = $1', [toPath]);            // moving back: no loops
  await run('UPDATE redirects SET to_path = $2 WHERE to_path = $1', [fromPath, toPath]); // collapse chains
  await run(`INSERT INTO redirects(from_path, to_path, code) VALUES ($1,$2,301)
             ON CONFLICT (from_path) DO UPDATE SET to_path = EXCLUDED.to_path, code = 301`, [fromPath, toPath]);
}
