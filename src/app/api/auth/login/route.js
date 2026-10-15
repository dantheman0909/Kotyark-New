import bcrypt from 'bcryptjs';
import { query, queryOne } from '@/lib/db';
import { createSession, clientIp, errorResponse } from '@/lib/auth';
import { audit } from '@/lib/audit';

const MAX_EMAIL_FAILURES = 5;
const MAX_IP_FAILURES = 20;

// Valid bcrypt hash of a throwaway string, so unknown emails cost the same as known ones.
const DUMMY_HASH = '$2b$12$Yz/9x.TVJW1XcSucu.283uqMpZjeF0DRTPa113nzrio6isZs5cy32';

export async function POST(req) {
  try {
    let body;
    try { body = await req.json(); } catch { body = null; }
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase().slice(0, 254) : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    if (!email || !password || password.length > 200) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const ip = await clientIp();

    const [byEmail, byIp] = await Promise.all([
      queryOne(
        `SELECT count(*)::int AS n FROM login_attempts
          WHERE email = $1 AND NOT success AND created_at > now() - interval '15 minutes'`, [email]),
      ip ? queryOne(
        `SELECT count(*)::int AS n FROM login_attempts
          WHERE ip = $1 AND NOT success AND created_at > now() - interval '15 minutes'`, [ip]) : { n: 0 },
    ]);
    const blocked = byEmail.n >= MAX_EMAIL_FAILURES || byIp.n >= MAX_IP_FAILURES;

    const record = (success) => query(
      `INSERT INTO login_attempts(email, ip, success) VALUES ($1,$2,$3)`, [email, ip, success]);

    if (blocked) {
      await record(false);
      return Response.json({ error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '900' } });
    }

    const user = await queryOne(
      `SELECT id, email, name, role, active, password_hash FROM users WHERE email = $1`, [email]);
    const ok = await bcrypt.compare(password, user?.password_hash || DUMMY_HASH);

    if (!user || !ok || !user.active) {
      await record(false);
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    await record(true);
    await createSession(user.id);
    await audit({ id: user.id, email: user.email }, 'login', 'session', null, `${user.email} signed in`);
    return Response.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (e) { return errorResponse(e); }
}
