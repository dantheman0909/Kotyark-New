#!/usr/bin/env node
// Break-glass: create an owner login, or reset its password, from the Replit Shell.
// Usage:  ADMIN_EMAIL=you@kotyark.com ADMIN_PASSWORD='12+ chars' npm run admin:reset
//   (or rely on the ADMIN_EMAIL / ADMIN_PASSWORD Secrets already set in Replit)
// Also clears that email's failed-login lockout and signs out its existing sessions.
import pg from 'pg';
import bcrypt from 'bcryptjs';

const url = process.env.KOTYARK_DATABASE_URL || process.env.DATABASE_URL;
const email = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
const pass = process.env.ADMIN_PASSWORD || '';
if (!url) { console.error('No database configured (DATABASE_URL is not set). Add PostgreSQL to the Replit workspace.'); process.exit(1); }
if (!email || !email.includes('@')) { console.error('Set ADMIN_EMAIL (Secrets, or prefix the command).'); process.exit(1); }
if (pass.length < 12) { console.error(`ADMIN_PASSWORD must be at least 12 characters (got ${pass.length}).`); process.exit(1); }

const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
const client = new pg.Client({ connectionString: url, ssl: isLocal || /sslmode=disable/.test(url) ? false : { rejectUnauthorized: false } });
await client.connect();
try {
  const exists = await client.query(`SELECT to_regclass('public.users') AS t`);
  if (!exists.rows[0].t) { console.error('Tables not found. Run: npm run migrate'); process.exit(1); }
  const hash = await bcrypt.hash(pass, 12);
  const { rows: [u] } = await client.query(
    `INSERT INTO users(email, name, password_hash, role, active) VALUES ($1, 'Owner', $2, 'owner', true)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'owner', active = true, updated_at = now()
     RETURNING id, (xmax = 0) AS created`, [email, hash]);
  await client.query(`DELETE FROM sessions WHERE user_id = $1`, [u.id]);
  await client.query(`DELETE FROM login_attempts WHERE email = $1 AND NOT success`, [email]);
  await client.query(
    `INSERT INTO audit_log(user_email, action, entity, entity_id, summary) VALUES ('admin-reset-script', $1, 'user', $2, $3)`,
    [u.created ? 'create' : 'update', String(u.id), `${u.created ? 'Created' : 'Reset password for'} owner ${email} from the shell`]);
  const { rows: [{ n }] } = await client.query(`SELECT count(*)::int AS n FROM users`);
  console.log(`${u.created ? 'Created' : 'Reset'} owner login: ${email}. Lockout cleared. Users in database: ${n}.`);
  console.log('Sign in at /login with this email and the ADMIN_PASSWORD value.');
} finally {
  await client.end();
}
