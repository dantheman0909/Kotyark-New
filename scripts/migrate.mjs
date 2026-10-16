// Applies src/lib/migrations/*.sql in order, once each. Idempotent.
// Usage: npm run migrate   (uses KOTYARK_DATABASE_URL, else DATABASE_URL)
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const url = process.env.KOTYARK_DATABASE_URL || process.env.DATABASE_URL;
if (!url) { console.error('No database configured.'); process.exit(1); }
const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
// Bounded everywhere so a hung database can never keep `npm run start` from running (see .replit run command):
// connect 10 s, any single query 120 s on the client side, plus a server-side statement_timeout set below.
// Note: the advisory lock assumes a direct (session) connection, which is Replit's default DATABASE_URL; a
// transaction-mode pooler URL (Neon "-pooler") would not keep the lock on one session.
const client = new pg.Client({
  connectionString: url,
  ssl: isLocal || /sslmode=disable/.test(url) ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 10_000,
  query_timeout: 120_000,
});
const dir = path.join(process.cwd(), 'src', 'lib', 'migrations');

// Session-level advisory lock: concurrent instance starts queue here; the later ones then see "Up to date".
// Polled with a deadline rather than waited on forever, so a stuck holder cannot hang a boot.
const LOCK_ID = 7_340_007;
const LOCK_DEADLINE_MS = 60_000;
async function acquireLock() {
  const end = Date.now() + LOCK_DEADLINE_MS;
  for (;;) {
    const { rows: [{ ok }] } = await client.query('SELECT pg_try_advisory_lock($1) AS ok', [LOCK_ID]);
    if (ok) return true;
    if (Date.now() >= end) return false;
    await new Promise((r) => setTimeout(r, 500));
  }
}
let locked = false;

await client.connect();
try {
  locked = await acquireLock();
  if (!locked) throw new Error(`could not get the migration lock within ${LOCK_DEADLINE_MS / 1000}s (another migrate is running or stuck)`);
  await client.query("SET lock_timeout = '30s'"); // a migration statement never waits forever on a table lock
  await client.query("SET statement_timeout = '110s'");
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
  const done = new Set((await client.query('SELECT name FROM schema_migrations')).rows.map(r => r.name));
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  let applied = 0;
  for (const f of files) {
    if (done.has(f)) continue;
    const sql = fs.readFileSync(path.join(dir, f), 'utf8');
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(name) VALUES ($1)', [f]);
      await client.query('COMMIT');
      console.log(`applied ${f}`);
      applied++;
    } catch (e) {
      await client.query('ROLLBACK');
      throw new Error(`${f}: ${e.message}`);
    }
  }

  // Bootstrap the first owner from env, only when no users exist. No source fallback.
  const { rows: [{ c }] } = await client.query('SELECT count(*)::int AS c FROM users');
  if (c === 0) {
    const email = process.env.ADMIN_EMAIL, pass = process.env.ADMIN_PASSWORD;
    if (email && pass) {
      if (pass.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters.');
      await client.query(
        `INSERT INTO users(email, name, password_hash, role) VALUES ($1, $2, $3, 'owner')`,
        [email.toLowerCase().trim(), 'Owner', await bcrypt.hash(pass, 12)]);
      console.log(`bootstrapped owner ${email}`);
    } else {
      console.warn('No users exist. Set ADMIN_EMAIL and ADMIN_PASSWORD and rerun to create the owner.');
    }
  }
  console.log(applied ? `${applied} migration(s) applied.` : 'Up to date.');
} finally {
  if (locked) await client.query('SELECT pg_advisory_unlock($1)', [LOCK_ID]).catch(() => {});
  await client.end();
}
