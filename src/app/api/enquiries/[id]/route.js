import { revalidatePath } from 'next/cache';
import { errorResponse, httpError, requireUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { audit } from '@/lib/audit';
import { STATUSES } from '@/lib/enquiries';

export const dynamic = 'force-dynamic';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// PATCH /api/enquiries/:id { status?, note? } -> { enquiry }
export async function PATCH(req, { params }) {
  try {
    const user = await requireUser('enquiries:write');
    const { id } = await params;
    if (!UUID.test(id)) throw httpError(404, 'Enquiry not found');
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') throw httpError(400, 'Invalid JSON.');
    const hasStatus = body.status !== undefined;
    const hasNote = body.note !== undefined;
    if (!hasStatus && !hasNote) throw httpError(400, 'Nothing to change.');
    if (hasStatus && !STATUSES.includes(body.status)) throw httpError(400, 'Status must be new, handled or spam.');
    if (hasNote && (typeof body.note !== 'string' || body.note.length > 2000)) throw httpError(400, 'Note must be text of 2000 characters or fewer.');

    const before = await queryOne('SELECT status, note FROM enquiries WHERE id = $1', [id]);
    if (!before) throw httpError(404, 'Enquiry not found');
    const status = hasStatus ? body.status : before.status;
    const note = hasNote ? body.note.trim() : before.note;
    // handled_by/at are set when moving to handled; cleared when it leaves handled.
    const row = await queryOne(
      `UPDATE enquiries SET status = $2, note = $3,
         handled_by = CASE WHEN $2 = 'handled' AND status <> 'handled' THEN $4::uuid WHEN $2 <> 'handled' THEN NULL ELSE handled_by END,
         handled_at = CASE WHEN $2 = 'handled' AND status <> 'handled' THEN now() WHEN $2 <> 'handled' THEN NULL ELSE handled_at END
       WHERE id = $1
       RETURNING id, status, note, handled_at`,
      [id, status, note, user.id]);
    await audit(user, 'update', 'enquiry', id,
      before.status !== status ? `Enquiry marked ${status}` : 'Enquiry note updated',
      { before: { status: before.status, note: before.note }, after: { status, note } });
    revalidatePath('/admin/enquiries');
    revalidatePath('/admin');
    return Response.json({ enquiry: row });
  } catch (e) { return errorResponse(e); }
}

// DELETE /api/enquiries/:id  (owner only). Deleting is erasure, so the audit row keeps no personal data: id, subject, status only.
export async function DELETE(_req, { params }) {
  try {
    const user = await requireUser('enquiries:delete');
    const { id } = await params;
    if (!UUID.test(id)) throw httpError(404, 'Enquiry not found');
    const row = await queryOne('DELETE FROM enquiries WHERE id = $1 RETURNING subject, status', [id]);
    if (!row) throw httpError(404, 'Enquiry not found');
    await audit(user, 'delete', 'enquiry', id, `Deleted enquiry (${row.subject}, ${row.status})`, { before: row });
    revalidatePath('/admin/enquiries');
    revalidatePath('/admin');
    return Response.json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
