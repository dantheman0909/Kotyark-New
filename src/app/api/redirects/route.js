import { revalidatePath } from 'next/cache';
import { errorResponse, httpError, requireUser } from '@/lib/auth';
import { query, queryOne, tx } from '@/lib/db';
import { audit } from '@/lib/audit';
import { normalizePath } from '@/lib/pages';
import { TAGS } from '@/lib/revalidate';
import { revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

const CODES = [301, 302, 308];
const RESERVED = /^\/(admin|api|_next|login|preview)(\/|$)/;

// GET /api/redirects -> { redirects: [{ fromPath, toPath, code, createdAt }] }
export async function GET() {
  try {
    await requireUser();
    const rows = await query('SELECT from_path, to_path, code, created_at FROM redirects ORDER BY created_at DESC, from_path');
    return Response.json({ redirects: rows.map(r => ({ fromPath: r.from_path, toPath: r.to_path, code: r.code, createdAt: r.created_at })) });
  } catch (e) { return errorResponse(e); }
}

function cleanFrom(v) {
  const raw = String(v ?? '').trim();
  if (!raw.startsWith('/')) throw httpError(400, 'From path must start with /');
  if (raw.startsWith('//') || raw.includes('\\')) throw httpError(400, 'From path cannot contain backslashes or start with //');
  if (/[\s?#]/.test(raw)) throw httpError(400, 'From path cannot contain spaces, ? or #');
  const p = normalizePath(raw);
  if (p === '/') throw httpError(400, 'The home page cannot be redirected');
  if (RESERVED.test(p)) throw httpError(400, `${p} is reserved by the application`);
  return p;
}

function cleanTo(v) {
  const raw = String(v ?? '').trim();
  if (/^https:\/\/[^\s]+$/i.test(raw)) return raw;
  if (!raw.startsWith('/') || raw.startsWith('//') || /[\s\\]/.test(raw)) throw httpError(400, 'To path must be a /path or an https:// URL');
  const [pathPart, ...rest] = raw.split(/(?=[?#])/);
  return normalizePath(pathPart) + rest.join('');
}

function cleanCode(v) {
  const code = v === undefined || v === null || v === '' ? 301 : Number(v);
  if (!CODES.includes(code)) throw httpError(400, 'Status code must be 301, 302 or 308');
  return code;
}

/** Throw if from -> to would loop (direct, reciprocal or via a chain). `ignoreFrom` is the row being edited. */
async function assertNoLoop(client, from, to, ignoreFrom) {
  if (to === from) throw httpError(400, 'From and to paths are the same');
  if (!to.startsWith('/')) return;
  const toPath = normalizePath(to.split(/[?#]/)[0]);
  let cursor = toPath;
  for (let hops = 0; hops < 20; hops++) {
    if (cursor === from) throw httpError(400, `This redirect would create a loop (${to} eventually redirects back to ${from})`);
    const { rows } = await client.query('SELECT to_path FROM redirects WHERE from_path = $1 AND from_path <> $2', [cursor, ignoreFrom || '']);
    if (!rows[0] || !rows[0].to_path.startsWith('/')) return;
    cursor = normalizePath(rows[0].to_path.split(/[?#]/)[0]);
  }
  throw httpError(400, 'Redirect chain is too long');
}

async function assertNoPageAt(client, from) {
  const { rows } = await client.query(`SELECT title FROM pages WHERE path = $1 AND status = 'published'`, [from]);
  if (rows[0]) throw httpError(409, `A published page ("${rows[0].title}") already lives at ${from}; the redirect would never run.`);
}

function done() {
  revalidatePath('/', 'layout');
  revalidateTag(TAGS.redirects, 'max');
}

// POST /api/redirects { fromPath, toPath, code? } -> 201 { redirect }
export async function POST(req) {
  try {
    const user = await requireUser('redirects:write');
    const body = await req.json().catch(() => null);
    const from = cleanFrom(body?.fromPath);
    const to = cleanTo(body?.toPath);
    const code = cleanCode(body?.code);
    await tx(async (client) => {
      const { rows } = await client.query('SELECT 1 FROM redirects WHERE from_path = $1', [from]);
      if (rows[0]) throw httpError(409, `A redirect from ${from} already exists`);
      await assertNoLoop(client, from, to, null);
      await assertNoPageAt(client, from);
      await client.query('INSERT INTO redirects(from_path, to_path, code) VALUES ($1,$2,$3)', [from, to, code]);
      // Flatten chains: anything that pointed at `from` now points straight at `to`.
      await client.query('UPDATE redirects SET to_path = $2 WHERE to_path = $1 AND from_path <> $2', [from, to]);
    });
    await audit(user, 'create', 'redirect', from, `Redirect ${from} -> ${to} (${code})`, { after: { from, to, code } });
    done();
    return Response.json({ redirect: { fromPath: from, toPath: to, code } }, { status: 201 });
  } catch (e) { return errorResponse(e); }
}

// PUT /api/redirects?from=/old  { fromPath?, toPath, code? } -> { redirect }   (fromPath renames the key)
export async function PUT(req) {
  try {
    const user = await requireUser('redirects:write');
    const current = cleanFrom(new URL(req.url).searchParams.get('from'));
    const body = await req.json().catch(() => null);
    const from = body?.fromPath ? cleanFrom(body.fromPath) : current;
    const to = cleanTo(body?.toPath);
    const code = cleanCode(body?.code);
    await tx(async (client) => {
      const { rows: [existing] } = await client.query('SELECT from_path, to_path, code FROM redirects WHERE from_path = $1 FOR UPDATE', [current]);
      if (!existing) throw httpError(404, 'Redirect not found');
      if (from !== current && (await client.query('SELECT 1 FROM redirects WHERE from_path = $1', [from])).rows[0]) {
        throw httpError(409, `A redirect from ${from} already exists`);
      }
      await assertNoLoop(client, from, to, current);
      await assertNoPageAt(client, from);
      await client.query('UPDATE redirects SET from_path = $2, to_path = $3, code = $4 WHERE from_path = $1', [current, from, to, code]);
    });
    await audit(user, 'update', 'redirect', from, `Redirect ${current} -> ${to} (${code})`, { after: { from, to, code } });
    done();
    return Response.json({ redirect: { fromPath: from, toPath: to, code } });
  } catch (e) { return errorResponse(e); }
}

// DELETE /api/redirects?from=/old -> { ok }
export async function DELETE(req) {
  try {
    const user = await requireUser('redirects:write');
    const from = cleanFrom(new URL(req.url).searchParams.get('from'));
    const row = await queryOne('DELETE FROM redirects WHERE from_path = $1 RETURNING to_path, code', [from]);
    if (!row) throw httpError(404, 'Redirect not found');
    await audit(user, 'delete', 'redirect', from, `Deleted redirect ${from} -> ${row.to_path}`, { before: { from, to: row.to_path, code: row.code } });
    done();
    return Response.json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
