import bcrypt from 'bcryptjs';
import { query, queryOne } from '@/lib/db';
import { requireUser, errorResponse, httpError } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { USER_COLUMNS, BCRYPT_COST, checkEmail, checkName, checkRole, checkPassword, readJson } from './helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireUser('users:manage');
    const users = await query(`SELECT ${USER_COLUMNS} FROM users ORDER BY created_at ASC`);
    return Response.json({ users });
  } catch (e) { return errorResponse(e); }
}

export async function POST(req) {
  try {
    const actor = await requireUser('users:manage');
    const body = await readJson(req);
    const email = checkEmail(body.email);
    const name = checkName(body.name);
    const role = checkRole(body.role);
    const hash = await bcrypt.hash(checkPassword(body.password), BCRYPT_COST);

    if (await queryOne('SELECT id FROM users WHERE email = $1', [email])) {
      throw httpError(409, 'A user with that email already exists');
    }
    let created;
    try {
      created = await queryOne(
        `INSERT INTO users(email, name, role, password_hash) VALUES ($1,$2,$3,$4) RETURNING ${USER_COLUMNS}`,
        [email, name, role, hash]);
    } catch (err) {
      if (err.code === '23505') throw httpError(409, 'A user with that email already exists');
      throw err;
    }
    await audit(actor, 'create', 'user', created.id, `Created user ${email} (${role})`,
      { after: { email, name, role, active: true } });
    return Response.json({ user: created }, { status: 201 });
  } catch (e) { return errorResponse(e); }
}
