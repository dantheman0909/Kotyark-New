import getDb from './db';

const INVESTOR_ROOT_ID = 'inv-root';

// Sections shown in the Investor Relations sidebar (all child folders of the root).
export function getInvestorSections() {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, name, slug, visible_in_menu
       FROM folders
       WHERE parent_id = ?
       ORDER BY sort_order ASC, name ASC`
    )
    .all(INVESTOR_ROOT_ID)
    .map((f) => ({
      id: f.id,
      name: f.name,
      slug: f.slug,
      href: `/investors/${f.slug}`,
      visible: !!f.visible_in_menu,
    }));
}

// A single investor section page by slug (must be a child of the investor root).
export function getInvestorPage(slug) {
  const db = getDb();
  const folder = db
    .prepare('SELECT * FROM folders WHERE slug = ? AND parent_id = ?')
    .get(slug, INVESTOR_ROOT_ID);
  return folder || null;
}

// Documents for a folder, shaped for the public DocumentList component.
export function getDocumentsForFolder(folderId) {
  const db = getDb();
  return db
    .prepare('SELECT * FROM documents WHERE folder_id = ? ORDER BY created_at DESC')
    .all(folderId)
    .map((d) => ({ title: d.title, url: d.file_path, isExternal: !!d.is_external }));
}

// A named editable content block (for existing bespoke pages).
export function getContentBlock(key) {
  const db = getDb();
  return db.prepare('SELECT * FROM content_blocks WHERE key = ?').get(key) || null;
}
