import bcrypt from 'bcryptjs';
import { query, queryOne } from '@/lib/db';
import { requireUser, errorResponse, httpError } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { BCRYPT_COST, checkPassword, isUuid, readJson } from '../../helpers';

// Owner resets another user's password (temp password). Their sessions are revoked.
export async function POST(req, { params }) {
  try {
    const actor = await requireUser('users:manage');
    const { id } = await params;
    if (!isUuid(id)) throw httpError(404, 'User not found');
    const body = await readJson(req);
    const hash = await bcrypt.hash(checkPassword(body.password), BCRYPT_COST);

    const target = await queryOne(
      `UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1 RETURNING id, email`, [id, hash]);
    if (!target) throw httpError(404, 'User not found');
    if (target.id !== actor.id) await query(`DELETE FROM sessions WHERE user_id = $1`, [id]);
    await audit(actor, 'update', 'user', id, `Reset password for ${target.email}`);
    return Response.json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
