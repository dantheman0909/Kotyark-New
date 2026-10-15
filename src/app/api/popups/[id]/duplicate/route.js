import crypto from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { errorResponse, httpError, requireUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { audit } from '@/lib/audit';
import { assertUuid, POPUP_COLUMNS, shapePopup } from '@/lib/popups';
import { scopePopupCss } from '@/lib/popup-css';

export const dynamic = 'force-dynamic';

// POST /api/popups/:id/duplicate -> 201 { popup }   (a draft copy; the CSS is re-scoped to the new id)
export async function POST(_req, { params }) {
  try {
    const user = await requireUser('popups:write');
    const { id } = await params;
    assertUuid(id);
    const src = await queryOne(`SELECT ${POPUP_COLUMNS} FROM popups WHERE id = $1`, [id]);
    if (!src) throw httpError(404, 'Pop-up not found');
    const newId = crypto.randomUUID();
    const name = `${src.name} (copy)`.slice(0, 120);
    const scoped = scopePopupCss(src.custom_css, newId);
    const row = await queryOne(
      `INSERT INTO popups(id, name, status, priority, content, design, custom_css, scoped_css, rules, created_by, updated_by)
       VALUES ($1,$2,'draft',$3,$4,$5,$6,$7,$8,$9,$9) RETURNING ${POPUP_COLUMNS}`,
      [newId, name, src.priority, JSON.stringify(src.content), JSON.stringify(src.design), scoped.fatal ? '' : src.custom_css, scoped.css, JSON.stringify(src.rules), user.id]);
    await audit(user, 'create', 'popup', newId, `Duplicated pop-up "${src.name}"`, { after: { from: id, name } });
    revalidatePath('/admin/popups');
    return Response.json({ popup: shapePopup(row) }, { status: 201 });
  } catch (e) { return errorResponse(e); }
}
