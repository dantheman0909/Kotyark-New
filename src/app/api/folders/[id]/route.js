import { query, queryOne, tx } from '@/lib/db';
import { getCurrentUser, can, requireUser, errorResponse, httpError } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { slugify } from '@/lib/slug';
import { sanitizeRichText } from '@/lib/sanitize';
import { revalidateFolder } from '@/lib/revalidate';
import { pingIndexNow } from '@/lib/indexnow';
import { getFolderById, GROUP_BY, FOLDER_CATEGORIES, addRedirect } from '@/lib/documents';

export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    const folder = await getFolderById(id);
    if (!folder) throw httpError(404, 'Folder not found');
    const user = await getCurrentUser();
    if (!folder.visible && !(user && can(user, 'documents:write'))) throw httpError(404, 'Folder not found');
    return Response.json({ folder });
  } catch (e) { return errorResponse(e); }
}

// PUT /api/folders/:id  JSON, any of { name, slug, description, intro_html, group_by, category, visible, parent_id, sort_order }
// Renaming never changes the slug; only an explicit different `slug` does (and records 301 redirects).
export async function PUT(req, { params }) {
  try {
    const user = await requireUser('documents:write');
    const { id } = await params;
    const before = await getFolderById(id);
    if (!before) throw httpError(404, 'Folder not found');
    const body = await req.json().catch(() => { throw httpError(400, 'Invalid JSON body'); });

    const sets = []; const vals = [];
    const set = (col, v) => { vals.push(v); sets.push(`${col} = $${vals.length}`); };

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name || name.length > 200) throw httpError(400, 'name must be 1-200 characters');
      set('name', name);
    }
    if (body.description !== undefined) set('description', String(body.description).slice(0, 1000));
    if (body.intro_html !== undefined) set('intro_html', sanitizeRichText(body.intro_html));
    if (body.group_by !== undefined) {
      if (!GROUP_BY.includes(body.group_by)) throw httpError(400, 'group_by must be none, fy or year');
      set('group_by', body.group_by);
    }
    if (body.category !== undefined) {
      if (!FOLDER_CATEGORIES.includes(body.category)) throw httpError(400, `category must be one of ${FOLDER_CATEGORIES.join(', ')}`);
      set('category', body.category);
    }
    if (body.visible !== undefined) set('visible', Boolean(body.visible));
    if (body.sort_order !== undefined) {
      if (!Number.isInteger(body.sort_order)) throw httpError(400, 'sort_order must be an integer');
      set('sort_order', body.sort_order);
    }
    if (body.parent_id !== undefined) {
      if (body.parent_id === id) throw httpError(400, 'A folder cannot be its own parent');
      if (body.parent_id && !(await getFolderById(body.parent_id))) throw httpError(400, 'parent_id does not exist');
      set('parent_id', body.parent_id || null);
    }
    let newSlug = null;
    if (body.slug !== undefined && body.slug !== before.slug) {
      newSlug = slugify(body.slug);
      if (await queryOne('SELECT 1 FROM document_folders WHERE slug = $1 AND id <> $2', [newSlug, id])) {
        throw httpError(409, 'That slug is already used by another folder');
      }
      set('slug', newSlug);
    }
    if (!sets.length) return Response.json({ folder: before });

    const folder = await tx(async (c) => {
      const r = await c.query(
        `UPDATE document_folders SET ${sets.join(', ')}, updated_at = now() WHERE id = $${vals.length + 1}
         RETURNING id, parent_id, slug, name, description, intro_html, group_by, category, visible, sort_order, created_at, updated_at`,
        [...vals, id]);
      if (newSlug) {
        await addRedirect(`/investors/${before.slug}`, `/investors/${newSlug}`, c);
        const docs = await c.query('SELECT slug FROM documents WHERE folder_id = $1', [id]);
        for (const d of docs.rows) await addRedirect(`/investors/${before.slug}/${d.slug}`, `/investors/${newSlug}/${d.slug}`, c);
      }
      return r.rows[0];
    });
    await audit(user, 'update', 'folder', id, `Updated folder "${folder.name}"`, {
      before: { name: before.name, slug: before.slug, visible: before.visible, group_by: before.group_by, category: before.category },
      after: { name: folder.name, slug: folder.slug, visible: folder.visible, group_by: folder.group_by, category: folder.category },
    });
    revalidateFolder(before.slug);
    if (newSlug) revalidateFolder(newSlug);
    // Ping only when the folder was or is visible AND something public changed (visibility, slug or name).
    if ((before.visible || folder.visible) && (before.visible !== folder.visible || before.slug !== folder.slug || before.name !== folder.name)) {
      const paths = ['/investors', `/investors/${before.slug}`, `/investors/${folder.slug}`];
      if (before.visible !== folder.visible || before.slug !== folder.slug) {
        // Published documents' landing pages appear, vanish or move with the folder.
        const docs = await query(`SELECT slug FROM documents WHERE folder_id = $1 AND status = 'published' LIMIT 2000`, [id]);
        for (const d of docs) {
          if (before.visible) paths.push(`/investors/${before.slug}/${d.slug}`);
          if (folder.visible) paths.push(`/investors/${folder.slug}/${d.slug}`);
        }
      }
      pingIndexNow(paths);
    }
    return Response.json({ folder });
  } catch (e) { return errorResponse(e); }
}

// DELETE /api/folders/:id -> 409 if it still holds documents or sub-folders
export async function DELETE(_req, { params }) {
  try {
    const user = await requireUser('documents:delete');
    const { id } = await params;
    const folder = await getFolderById(id);
    if (!folder) throw httpError(404, 'Folder not found');
    const docs = await queryOne('SELECT count(*)::int AS n FROM documents WHERE folder_id = $1', [id]);
    const kids = await queryOne('SELECT count(*)::int AS n FROM document_folders WHERE parent_id = $1', [id]);
    if (docs.n > 0) throw httpError(409, `Folder still contains ${docs.n} document(s). Move or delete them first.`);
    if (kids.n > 0) throw httpError(409, `Folder still contains ${kids.n} sub-folder(s). Move or delete them first.`);
    await query('DELETE FROM document_folders WHERE id = $1', [id]);
    await audit(user, 'delete', 'folder', id, `Deleted folder "${folder.name}"`, { before: { slug: folder.slug, name: folder.name } });
    revalidateFolder(folder.slug);
    if (folder.visible) pingIndexNow(['/investors', `/investors/${folder.slug}`]); // was public
    return Response.json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
