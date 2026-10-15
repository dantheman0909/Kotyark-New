import { tx } from '@/lib/db';
import { requireUser, errorResponse, httpError } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { USER_COLUMNS, checkName, checkRole, isUuid, readJson } from '../helpers';

export async function PUT(req, { params }) {
  try {
    const actor = await requireUser('users:manage');
    const { id } = await params;
    if (!isUuid(id)) throw httpError(404, 'User not found');
    const body = await readJson(req);

    const result = await tx(async (c) => {
      // Lock all active owners so two concurrent demotions cannot both pass the last-owner check.
      await c.query(`SELECT id FROM users WHERE role = 'owner' AND active FOR UPDATE`);
      const { rows: [before] } = await c.query(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1 FOR UPDATE`, [id]);
      if (!before) throw httpError(404, 'User not found');

      const name = body.name !== undefined ? checkName(body.name) : before.name;
      const role = body.role !== undefined ? checkRole(body.role) : before.role;
      const active = body.active !== undefined ? body.active === true : before.active;
      if (body.active !== undefined && typeof body.active !== 'boolean') throw httpError(400, 'active must be a boolean');

      if (before.id === actor.id && (!active || role !== before.role)) {
        throw httpError(400, 'You cannot deactivate or change the role of your own account');
      }
      const losesOwner = before.role === 'owner' && before.active && (role !== 'owner' || !active);
      if (losesOwner) {
        const { rows: [{ n }] } = await c.query(
          `SELECT count(*)::int AS n FROM users WHERE role = 'owner' AND active AND id <> $1`, [id]);
        if (n === 0) throw httpError(400, 'There must always be at least one active owner');
      }

      const { rows: [after] } = await c.query(
        `UPDATE users SET name = $2, role = $3, active = $4, updated_at = now()
          WHERE id = $1 RETURNING ${USER_COLUMNS}`, [id, name, role, active]);
      if (!active) await c.query(`DELETE FROM sessions WHERE user_id = $1`, [id]);
      return { before, after };
    });

    const pick = (u) => ({ name: u.name, role: u.role, active: u.active });
    await audit(actor, 'update', 'user', id, `Updated user ${result.after.email}`,
      { before: pick(result.before), after: pick(result.after) });
    return Response.json({ user: result.after });
  } catch (e) { return errorResponse(e); }
}
