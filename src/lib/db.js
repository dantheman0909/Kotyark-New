// Single Postgres pool for the whole app. Server-only.
// KOTYARK_DATABASE_URL wins over DATABASE_URL so a dev shell that already
// exports another project's DATABASE_URL can never be written to by accident.
import pg from 'pg';

const connectionString = process.env.KOTYARK_DATABASE_URL || process.env.DATABASE_URL;

const globalForPg = globalThis;

function createPool() {
  if (!connectionString) {
    throw new Error('No database configured: set DATABASE_URL (Replit) or KOTYARK_DATABASE_URL (local).');
  }
  const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(connectionString);
  return new pg.Pool({
    connectionString,
    max: Number(process.env.PG_POOL_MAX || 5),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: isLocal || /sslmode=disable/.test(connectionString) ? false : { rejectUnauthorized: false },
  });
}

export function getPool() {
  if (!globalForPg.__kotyarkPool) globalForPg.__kotyarkPool = createPool();
  return globalForPg.__kotyarkPool;
}

/** Run a parameterized query. Returns rows. */
export async function query(text, params = []) {
  const res = await getPool().query(text, params);
  return res.rows;
}

/** Run a parameterized query and return the first row or null. */
export async function queryOne(text, params = []) {
  const rows = await query(text, params);
  return rows[0] ?? null;
}

/** Run fn(client) inside a transaction. client.query(text, params) returns a pg Result. */
export async function tx(fn) {
  const client = await getPool().connect();
  let broken; // set when ROLLBACK itself fails: the connection is dead and must not go back to the pool
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (err) {
    await client.query('ROLLBACK').catch((e) => { broken = e; });
    throw err;
  } finally {
    client.release(broken);
  }
}
