import { revalidatePath } from 'next/cache';
import { errorResponse, httpError, requireUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { audit } from '@/lib/audit';
import { assertUuid, POPUP_COLUMNS, shapePopup } from '@/lib/popups';

export const dynamic = 'force-dynamic';

// POST /api/popups/:id/unpublish -> { popup }
export async function POST(_req, { params }) {
  try {
    const user = await requireUser('popups:write');
    const { id } = await params;
    assertUuid(id);
    const cur = await queryOne('SELECT status FROM popups WHERE id = $1', [id]);
    if (!cur) throw httpError(404, 'Pop-up not found');
    const row = await queryOne(
      `UPDATE popups SET status='draft', updated_by=$2, updated_at=now() WHERE id=$1 RETURNING ${POPUP_COLUMNS}`, [id, user.id]);
    await audit(user, 'unpublish', 'popup', id, `Unpublished pop-up "${row.name}"`, { before: { status: cur.status }, after: { status: 'draft' } });
    revalidatePath('/admin/popups');
    revalidatePath('/', 'layout');
    return Response.json({ popup: shapePopup(row) });
  } catch (e) { return errorResponse(e); }
}
