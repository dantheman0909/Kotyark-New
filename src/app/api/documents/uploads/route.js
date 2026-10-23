import { query, queryOne } from '@/lib/db';
import { requireUser, errorResponse, httpError } from '@/lib/auth';
import { MAX_UPLOAD_BYTES, PART_BYTES, FILE_TYPES, MAX_OPEN_UPLOADS } from '@/lib/documents';
import { pruneUploads } from '@/lib/uploads';

export const dynamic = 'force-dynamic';

const EXTS = new Set([...Object.values(FILE_TYPES).map((t) => t.ext), 'jpeg']);

// POST /api/documents/uploads { filename, size } -> { id, partBytes, parts }
// Init and the part PUT are intentionally not audited: they are transient and change no document. The document
// insert/update that completes the upload (and a cancel) are audited.
export async function POST(req) {
  try {
    const user = await requireUser('documents:write');
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') throw httpError(400, 'Invalid JSON body');
    const filename = String(body.filename || '').trim().slice(0, 300);
    const size = Number(body.size);
    if (!filename) throw httpError(400, 'filename is required');
    if (!Number.isInteger(size) || size < 1) throw httpError(400, 'size must be a positive integer');
    if (size > MAX_UPLOAD_BYTES) throw httpError(413, 'File is larger than 100 MB');
    const ext = filename.toLowerCase().split('.').pop();
    if (!filename.includes('.') || !EXTS.has(ext)) throw httpError(415, 'Unsupported file type. Allowed: PDF, DOCX, XLSX, PPTX, PNG, JPG');
    const open = await queryOne('SELECT count(*)::int AS n FROM upload_sessions WHERE user_id = $1', [user.id]);
    if (open.n >= MAX_OPEN_UPLOADS) throw httpError(429, 'Too many unfinished uploads. Finish or cancel some first.');
    pruneUploads();
    const parts = Math.ceil(size / PART_BYTES);
    const rows = await query('INSERT INTO upload_sessions(user_id, filename, size, parts) VALUES ($1,$2,$3,$4) RETURNING id', [user.id, filename, size, parts]);
    return Response.json({ id: rows[0].id, partBytes: PART_BYTES, parts }, { status: 201 });
  } catch (e) { return errorResponse(e); }
}
