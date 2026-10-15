import { errorResponse, httpError, requireUser } from '@/lib/auth';
import { queryOne, tx } from '@/lib/db';
import { audit } from '@/lib/audit';
import { slugify } from '@/lib/slug';
import { computePath, getPageTree, UUID_RE } from '@/lib/pages';
import { revalidatePagePath } from '@/lib/revalidate';
import { assertPathAllowed, shapeFull, PAGE_FULL_COLUMNS } from './_lib';

export const dynamic = 'force-dynamic';

// GET /api/pages -> { pages: [flat, no blocks], tree: [nested] }
export async function GET() {
  try {
    await requireUser();
    return Response.json(await getPageTree());
  } catch (e) { return errorResponse(e); }
}

// POST /api/pages { title, parentId?, slug? } -> 201 { page }
export async function POST(req) {
  try {
    const user = await requireUser('pages:write');
    const body = await req.json().catch(() => null);
    const title = String(body?.title ?? '').trim();
    if (!title) throw httpError(400, 'Title is required');
    if (title.length > 200) throw httpError(400, 'Title is too long');
    const parentId = body?.parentId || null;
    if (parentId && !UUID_RE.test(parentId)) throw httpError(400, 'Invalid parent');
    if (parentId && !(await queryOne('SELECT 1 FROM pages WHERE id = $1', [parentId]))) throw httpError(400, 'Parent page not found');

    const base = slugify(body?.slug || title);
    let slug = base;
    for (let i = 2; await queryOne('SELECT 1 FROM pages WHERE path = $1', [await computePath(parentId, slug)]); i++) {
      if (body?.slug) throw httpError(409, `A page already exists at ${await computePath(parentId, slug)}`);
      slug = `${base}-${i}`;
      if (i > 500) throw httpError(409, 'Could not allocate a unique slug');
    }
    const path = await computePath(parentId, slug);
    assertPathAllowed(path);

    const row = await tx(async (client) => {
      const { rows: [{ next }] } = await client.query(
        `SELECT COALESCE(MAX(nav_order), -1) + 1 AS next FROM pages WHERE parent_id IS NOT DISTINCT FROM $1`, [parentId]);
      const { rows } = await client.query(
        `INSERT INTO pages(parent_id, slug, path, title, nav_order, created_by, updated_by)
         VALUES ($1,$2,$3,$4,$5,$6,$6) RETURNING ${PAGE_FULL_COLUMNS}`,
        [parentId, slug, path, title, next, user.id]);
      return rows[0];
    });
    await audit(user, 'create', 'page', row.id, `Created draft page "${title}" at ${path}`, { after: { title, path, parentId } });
    revalidatePagePath(path);
    return Response.json({ page: shapeFull(row) }, { status: 201 });
  } catch (e) { return errorResponse(e); }
}
