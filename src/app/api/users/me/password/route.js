import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { query, queryOne } from '@/lib/db';
import { requireUser, errorResponse, httpError, SESSION_COOKIE } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { BCRYPT_COST, checkPassword, readJson } from '../../helpers';

// Any logged-in user changes their own password (requires the current one).
export async function POST(req) {
  try {
    const user = await requireUser();
    const body = await readJson(req);
    const current = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const next = checkPassword(body.newPassword);

    const row = await queryOne(`SELECT password_hash FROM users WHERE id = $1`, [user.id]);
    if (!row || !(await bcrypt.compare(current, row.password_hash))) {
      throw httpError(400, 'Current password is incorrect');
    }
    if (current === next) throw httpError(400, 'New password must differ from the current one');

    await query(`UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1`,
      [user.id, await bcrypt.hash(next, BCRYPT_COST)]);

    // Sign out every other session of this user; keep the current one.
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    const keep = token ? crypto.createHash('sha256').update(token).digest('hex') : '';
    await query(`DELETE FROM sessions WHERE user_id = $1 AND token_hash <> $2`, [user.id, keep]);

    await audit(user, 'update', 'user', user.id, `${user.email} changed their own password`);
    return Response.json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
