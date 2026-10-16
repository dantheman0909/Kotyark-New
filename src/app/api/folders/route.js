import { query, queryOne } from '@/lib/db';
import { getCurrentUser, can, requireUser, errorResponse, httpError } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { uniqueSlug } from '@/lib/slug';
import { sanitizeRichText } from '@/lib/sanitize';
import { revalidateFolder } from '@/lib/revalidate';
import { pingIndexNow } from '@/lib/indexnow';
import { listFolders, getFolderById, GROUP_BY, FOLDER_CATEGORIES } from '@/lib/documents';
import crypto from 'node:crypto';

export const dynamic = 'force-dynamic';

const PUBLIC_FIELDS = ['id', 'parent_id', 'slug', 'name', 'description', 'group_by', 'category', 'sort_order', 'document_count'];

// GET /api/folders -> { folders: [...] }
// Unauthenticated: visible folders, public fields only (published document counts).
// Authenticated editors: every folder incl. hidden, with intro_html, visible, draft-inclusive counts.
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (user && can(user, 'documents:write')) {
      const folders = await listFolders({ withIntro: true, includeDrafts: true, withBroken: true });
      return Response.json({ folders });
    }
    const folders = (await listFolders({ visibleOnly: true })).map((f) => Object.fromEntries(PUBLIC_FIELDS.map((k) => [k, f[k]])));
    return Response.json({ folders });
  } catch (e) { return errorResponse(e); }
}

// POST /api/folders  JSON { name, slug?, description?, intro_html?, group_by?, category?, visible?, parent_id?, sort_order? } -> 201 { folder }
export async function POST(req) {
  try {
    const user = await requireUser('documents:write');
    const body = await req.json().catch(() => { throw httpError(400, 'Invalid JSON body'); });

    const name = String(body.name || '').trim();
    if (!name) throw httpError(400, 'name is required');
    if (name.length > 200) throw httpError(400, 'name is too long');
    const groupBy = body.group_by ?? 'none';
    if (!GROUP_BY.includes(groupBy)) throw httpError(400, 'group_by must be none, fy or year');
    const category = body.category ?? 'Other';
    if (!FOLDER_CATEGORIES.includes(category)) throw httpError(400, `category must be one of ${FOLDER_CATEGORIES.join(', ')}`);
    const parentId = body.parent_id || null;
    if (parentId && !(await getFolderById(parentId))) throw httpError(400, 'parent_id does not exist');

    const slug = await uniqueSlug(body.slug || name, async (s) => Boolean(await queryOne('SELECT 1 FROM document_folders WHERE slug = $1', [s])));
    let sortOrder = Number.isInteger(body.sort_order) ? body.sort_order : null;
    if (sortOrder === null) {
      sortOrder = (await queryOne('SELECT COALESCE(max(sort_order), 0) + 1 AS n FROM document_folders')).n;
    }
    const id = crypto.randomUUID();
    const rows = await query(
      `INSERT INTO document_folders(id, parent_id, slug, name, description, intro_html, group_by, visible, sort_order, category)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, parent_id, slug, name, description, intro_html, group_by, category, visible, sort_order, created_at, updated_at`,
      [id, parentId, slug, name, String(body.description || '').slice(0, 1000), sanitizeRichText(body.intro_html),
        groupBy, body.visible !== false, sortOrder, category]);
    await audit(user, 'create', 'folder', id, `Created folder "${name}"`, { after: { slug, name, category } });
    revalidateFolder(slug);
    if (rows[0].visible) await pingIndexNow(['/investors', `/investors/${slug}`]);
    return Response.json({ folder: { ...rows[0], document_count: 0 } }, { status: 201 });
  } catch (e) { return errorResponse(e); }
}
