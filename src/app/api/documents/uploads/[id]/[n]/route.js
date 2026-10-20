import { query } from '@/lib/db';
import { requireUser, errorResponse, httpError } from '@/lib/auth';
import { putObject, deleteObject } from '@/lib/storage';
import { PART_BYTES, detectMime } from '@/lib/documents';
import { loadIdleUpload, partKey } from '@/lib/uploads';

export const dynamic = 'force-dynamic';

// Read the request body, refusing anything over PART_BYTES (same pattern as /api/contact).
async function readCapped(req) {
  if (!req.body) return Buffer.alloc(0);
  const reader = req.body.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > PART_BYTES) { await reader.cancel().catch(() => {}); throw httpError(413, 'Part is larger than 8 MB'); }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

// PUT /api/documents/uploads/:id/:n  raw bytes of part n (0-based). Re-sending a part is safe.
export async function PUT(req, { params }) {
  try {
    const user = await requireUser('documents:write');
    const { id, n: nRaw } = await params;
    const up = await loadIdleUpload(id, user);
    if (!/^\d{1,6}$/.test(nRaw) || Number(nRaw) >= up.parts) throw httpError(400, 'Invalid part number');
    const n = Number(nRaw);
    const declared = Number(req.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > PART_BYTES) throw httpError(413, 'Part is larger than 8 MB');
    const expected = n < up.parts - 1 ? PART_BYTES : up.size - PART_BYTES * (up.parts - 1);
    const buf = await readCapped(req);
    if (buf.length !== expected) throw httpError(400, `Part ${n} must be ${expected} bytes (got ${buf.length})`);
    // Fail a bad file type on the first part, before the remaining parts are sent.
    const mime = n === 0 ? detectMime(buf, up.filename) : null;
    if (n === 0 && !mime) throw httpError(415, 'Unsupported file type. Allowed: PDF, DOCX, XLSX, PPTX, PNG, JPG');
    await putObject(partKey(up.id, n), buf);
    const r = await query(
      'UPDATE upload_sessions SET received = array(SELECT DISTINCT unnest(received || $2::int)), mime = COALESCE($4, mime) WHERE id = $1 AND user_id = $3 RETURNING cardinality(received) AS got',
      [up.id, n, user.id, mime]);
    if (!r.length) { await deleteObject(partKey(up.id, n)).catch(() => {}); throw httpError(404, 'Upload not found'); } // cancelled while this part was in flight
    return Response.json({ ok: true, received: r[0].got, parts: up.parts });
  } catch (e) { return errorResponse(e); }
}
