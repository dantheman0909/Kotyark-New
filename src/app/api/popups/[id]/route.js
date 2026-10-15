import { revalidatePath } from 'next/cache';
import { errorResponse, httpError, requireUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { audit } from '@/lib/audit';
import { assertUuid, cleanPopup, POPUP_COLUMNS, shapePopup } from '@/lib/popups';

export const dynamic = 'force-dynamic';

async function load(id) {
  assertUuid(id);
  const row = await queryOne(`SELECT ${POPUP_COLUMNS} FROM popups WHERE id = $1`, [id]);
  if (!row) throw httpError(404, 'Pop-up not found');
  return row;
}

// GET /api/popups/:id -> { popup }
export async function GET(_req, { params }) {
  try {
    await requireUser('popups:write');
    const { id } = await params;
    return Response.json({ popup: shapePopup(await load(id)) });
  } catch (e) { return errorResponse(e); }
}

// PUT /api/popups/:id { name?, priority?, content?, design?, customCss?, rules? } -> { popup, warnings }
// Sections are merged over the stored values. Saving a PUBLISHED pop-up changes the live site immediately.
export async function PUT(req, { params }) {
  try {
    const user = await requireUser('popups:write');
    const { id } = await params;
    const before = shapePopup(await load(id));
    const body = await req.json().catch(() => null);
    const v = await cleanPopup(body, id, before);
    const row = await queryOne(
      `UPDATE popups SET name=$2, priority=$3, content=$4, design=$5, custom_css=$6, scoped_css=$7, rules=$8,
              updated_by=$9, updated_at=now() WHERE id=$1 RETURNING ${POPUP_COLUMNS}`,
      [id, v.name, v.priority, JSON.stringify(v.content), JSON.stringify(v.design), v.customCss, v.scopedCss, JSON.stringify(v.rules), user.id]);
    const changed = ['name', 'priority', 'content', 'design', 'rules'].filter((k) => JSON.stringify(before[k]) !== JSON.stringify(v[k]));
    if (before.customCss !== v.customCss) changed.push('customCss');
    await audit(user, 'update', 'popup', id, `Updated pop-up "${v.name}" (${changed.join(', ') || 'no changes'})`,
      { before: { name: before.name, status: before.status, changed }, after: { name: v.name, status: row.status } });
    revalidatePath('/admin/popups');
    if (row.status === 'published') revalidatePath('/', 'layout');
    return Response.json({ popup: shapePopup(row), warnings: v.warnings });
  } catch (e) { return errorResponse(e); }
}

// DELETE /api/popups/:id -> { ok: true }   (stats go with it)
export async function DELETE(_req, { params }) {
  try {
    const user = await requireUser('popups:write');
    const { id } = await params;
    const row = await load(id);
    await queryOne('DELETE FROM popups WHERE id = $1 RETURNING id', [id]);
    await audit(user, 'delete', 'popup', id, `Deleted pop-up "${row.name}"`, { before: { name: row.name, status: row.status } });
    revalidatePath('/admin/popups');
    if (row.status === 'published') revalidatePath('/', 'layout');
    return Response.json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
