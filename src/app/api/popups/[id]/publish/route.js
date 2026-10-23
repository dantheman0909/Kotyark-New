import { revalidatePath } from 'next/cache';
import { errorResponse, httpError, requireUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { audit } from '@/lib/audit';
import { assertPublishable, assertUuid, POPUP_COLUMNS, shapePopup } from '@/lib/popups';

export const dynamic = 'force-dynamic';

// POST /api/popups/:id/publish -> { popup }
export async function POST(_req, { params }) {
  try {
    const user = await requireUser('popups:write');
    const { id } = await params;
    assertUuid(id);
    const cur = await queryOne(`SELECT ${POPUP_COLUMNS} FROM popups WHERE id = $1`, [id]);
    if (!cur) throw httpError(404, 'Pop-up not found');
    assertPublishable(shapePopup(cur));
    const row = await queryOne(
      `UPDATE popups SET status='published', published_at=now(), updated_by=$2, updated_at=now() WHERE id=$1 RETURNING ${POPUP_COLUMNS}`,
      [id, user.id]);
    await audit(user, 'publish', 'popup', id, `Published pop-up "${row.name}"`, { before: { status: cur.status }, after: { status: 'published' } });
    revalidatePath('/admin/popups');
    revalidatePath('/', 'layout');
    return Response.json({ popup: shapePopup(row) });
  } catch (e) { return errorResponse(e); }
}
