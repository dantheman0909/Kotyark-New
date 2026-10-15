// Data access for CMS pages, the page tree, navigation and redirects. Server-only.
//
// Draft vs live: a page row holds the WORKING copy (title, blocks, seo) edited in the admin.
// Publishing inserts a page_revisions row with note 'Published'. The public site renders the
// latest 'Published' snapshot when one exists, so saving a draft never changes the live page.
// Rows published by other means (a migration script setting status directly) have no snapshot
// and fall back to the row columns.
import { query, queryOne } from './db';
import { buildMetadata } from './seo';
import { blocksToText, imageSrc } from './blocks/schemas';
import { htmlToText } from './sanitize';
import { DEFAULT_HEADER_NAV } from './nav-defaults';

// Paths also served by a legacy static route: a nav link to a DRAFT page here must stay, or the nav empties.
export const STATIC_ROUTE_PATHS = new Set(['/', '/about', '/products', '/products/biodiesel', '/products/crude-glycerin',
  '/contact', '/investors', '/investors/sebi-lodr']);

export const PUBLISHED_NOTE = 'Published';
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Normalise a request path: leading slash, no trailing slash (except '/'), no query/hash. */
export function normalizePath(p) {
  let s = String(p || '/').split('#')[0].split('?')[0].trim();
  if (!s.startsWith('/')) s = '/' + s;
  s = s.replace(/\/{2,}/g, '/');
  if (s.length > 1) s = s.replace(/\/+$/, '');
  return s || '/';
}

const joinPath = (parentPath, slug) => (!slug ? '/' : parentPath === '/' || !parentPath ? `/${slug}` : `${parentPath}/${slug}`);

/** Path a page would have under `parentId` with `slug`. `client` is an optional tx client. */
export async function computePath(parentId, slug, client = null) {
  if (!parentId) return slug ? `/${slug}` : '/';
  const run = client ? (t, p) => client.query(t, p).then(r => r.rows) : query;
  const [parent] = await run('SELECT path FROM pages WHERE id = $1', [parentId]);
  if (!parent) throw new Error('Parent page not found');
  return joinPath(parent.path, slug);
}

/**
 * After a page's path changed, rewrite every descendant's path (recursively).
 * Returns [{ id, oldPath, newPath, status }] for each descendant that moved.
 * Must be called with a transaction client.
 */
export async function recomputeDescendantPaths(client, pageId) {
  const moved = [];
  const walk = async (id, path) => {
    const { rows: kids } = await client.query('SELECT id, slug, path, status FROM pages WHERE parent_id = $1', [id]);
    for (const kid of kids) {
      const newPath = joinPath(path, kid.slug);
      if (newPath !== kid.path) {
        await client.query('UPDATE pages SET path = $1, updated_at = now() WHERE id = $2', [newPath, kid.id]);
        moved.push({ id: kid.id, oldPath: kid.path, newPath, status: kid.status });
      }
      await walk(kid.id, newPath);
    }
  };
  const { rows: [page] } = await client.query('SELECT path FROM pages WHERE id = $1', [pageId]);
  if (page) await walk(pageId, page.path);
  return moved;
}

/** ids of `pageId` and every descendant (used for cycle checks). */
export async function descendantIds(client, pageId) {
  const { rows } = await client.query(
    `WITH RECURSIVE d AS (
       SELECT id FROM pages WHERE id = $1
       UNION ALL SELECT p.id FROM pages p JOIN d ON p.parent_id = d.id)
     SELECT id FROM d`, [pageId]);
  return rows.map(r => r.id);
}

/** Insert (or replace) a 301 from oldPath to newPath, flatten chains and drop self/loop rows. */
export async function addPathRedirect(client, oldPath, newPath) {
  if (!oldPath || oldPath === newPath || oldPath === '/') return;
  await client.query('DELETE FROM redirects WHERE from_path = $1', [newPath]); // the new URL is a real page now
  await client.query('UPDATE redirects SET to_path = $2 WHERE to_path = $1', [oldPath, newPath]); // A->old becomes A->new
  await client.query(
    `INSERT INTO redirects(from_path, to_path, code) VALUES ($1, $2, 301)
     ON CONFLICT (from_path) DO UPDATE SET to_path = EXCLUDED.to_path, code = 301`, [oldPath, newPath]);
  await client.query('DELETE FROM redirects WHERE from_path = to_path');
}

const ADMIN_COLUMNS = `id, parent_id, slug, path, title, status, show_in_nav, nav_order, template,
  published_at, created_at, updated_at`;

export function shapePageRow(r) {
  return {
    id: r.id, parentId: r.parent_id, slug: r.slug, path: r.path, title: r.title, status: r.status,
    showInNav: r.show_in_nav, navOrder: r.nav_order, template: r.template,
    publishedAt: r.published_at, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

/** Flat list (no blocks) plus a nested tree, ordered by nav_order then title. */
export async function getPageTree() {
  const rows = await query(`SELECT ${ADMIN_COLUMNS} FROM pages ORDER BY nav_order, title`);
  const flat = rows.map(shapePageRow);
  const byId = new Map(flat.map(p => [p.id, { ...p, children: [] }]));
  const tree = [];
  for (const p of byId.values()) {
    const parent = p.parentId && byId.get(p.parentId);
    (parent ? parent.children : tree).push(p);
  }
  return { pages: flat, tree };
}

// Public content = latest publish snapshot if any, else the row's own columns.
const PUBLIC_SELECT = `
  SELECT p.id, p.parent_id, p.slug, p.path, p.status, p.published_at, p.updated_at, p.template,
         COALESCE(r.title, p.title) AS title, COALESCE(r.blocks, p.blocks) AS blocks,
         COALESCE(r.seo, p.seo) AS seo
    FROM pages p
    LEFT JOIN LATERAL (
      SELECT title, blocks, seo FROM page_revisions
       WHERE page_id = p.id AND note = '${PUBLISHED_NOTE}' ORDER BY id DESC LIMIT 1) r ON true`;

/** The published page at `path`, with its live (snapshot) content, or null. */
export async function getPublishedPageByPath(path) {
  const row = await queryOne(`${PUBLIC_SELECT} WHERE p.path = $1 AND p.status = 'published'`, [normalizePath(path)]);
  // Derive the text from the LIVE snapshot: the row's search_text may include unpublished draft edits.
  return row ? { ...row, search_text: blocksToText(row.blocks, htmlToText) } : null;
}

/** Any page (draft or published) by preview token, with its WORKING content. */
export async function getPageByPreviewToken(token) {
  if (!/^[0-9a-f]{32}$/i.test(String(token || ''))) return null;
  return queryOne(
    `SELECT id, parent_id, slug, path, status, title, blocks, seo, search_text, template
       FROM pages WHERE preview_token = $1`, [token]);
}

/** Ancestors of a page from the root down (excluding the page itself): [{ title, path }]. */
export async function getAncestors(parentId) {
  if (!parentId) return [];
  return query(
    `WITH RECURSIVE a AS (
       SELECT id, parent_id, title, path, 1 AS depth FROM pages WHERE id = $1
       UNION ALL SELECT p.id, p.parent_id, p.title, p.path, a.depth + 1 FROM pages p JOIN a ON p.id = a.parent_id)
     SELECT title, path FROM a ORDER BY depth DESC`, [parentId]);
}

/** Breadcrumb trail [{ name, path }] from Home to the page. Empty for the home page. */
export async function getBreadcrumbs(page) {
  if (page.path === '/') return [];
  const ancestors = await getAncestors(page.parent_id);
  const crumbs = [{ name: 'Home', path: '/' }];
  for (const a of ancestors) if (a.path !== '/') crumbs.push({ name: a.title, path: a.path });
  crumbs.push({ name: page.title, path: page.path });
  return crumbs;
}

/** Next.js Metadata for a CMS page row (public or preview). */
export function pageMetadata(page, { noindex = false } = {}) {
  const seo = page.seo || {};
  const firstHero = (page.blocks || []).find(b => b.type === 'hero' && b.props?.image);
  const imageValue = seo.ogImageId || firstHero?.props?.image;
  const description = seo.metaDescription || String(page.search_text || '').slice(0, 160).trim();
  const meta = buildMetadata({
    title: seo.metaTitle || page.title,
    description,
    path: page.path,
    image: imageValue ? imageSrc(imageValue) : undefined,
    noindex: noindex || !!seo.noindex,
  });
  if (seo.canonical && /^https?:\/\//i.test(seo.canonical)) meta.alternates = { canonical: seo.canonical };
  return meta;
}

/**
 * Published CMS page for a static route, or null. Never throws: if the database is down the
 * legacy hard-coded page renders instead.
 */
export async function getCmsOverride(path) {
  try {
    return await getPublishedPageByPath(path);
  } catch (err) {
    console.error(`[cms] override lookup failed for ${path}:`, err.message);
    return null;
  }
}

/** Metadata for a static route: the CMS page's SEO when published, else `fallback`. */
export async function overrideMetadata(path, fallback) {
  const page = await getCmsOverride(path);
  return page ? pageMetadata(page) : fallback;
}

/** An href safe to render: relative path, anchor, http(s), mailto or tel. Anything else becomes '#'. */
export function safeHref(href) {
  const h = String(href || '').trim();
  if (!h) return '';
  if (/^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(h)) return h;
  return '#';
}

// --- Navigation -------------------------------------------------------------------------

function buildNavTree(rows) {
  const items = rows.map(r => ({
    id: r.id,
    label: r.label,
    href: r.page_id
      ? (r.page_status === 'published' || STATIC_ROUTE_PATHS.has(r.page_path) ? r.page_path : null)
      : r.url,
    parentId: r.parent_id,
    children: [],
  })).filter(i => i.href || i.href === ''); // draft page links (with no static route) drop out; '' = non-link heading
  const byId = new Map(items.map(i => [i.id, i]));
  const roots = [];
  for (const i of items) {
    if (!i.parentId) roots.push(i);
    else if (i.href) byId.get(i.parentId)?.children.push(i); // orphaned children (parent skipped) drop out
  }
  const clean = i => ({ id: i.id, label: i.label, href: i.href, ...(i.children.length ? { children: i.children.map(clean) } : {}) });
  return roots.filter(i => i.href || i.children.length).map(clean);
}

/** Header and footer menus in one query: { header: [...], footer: [...] } (nested one level). */
export async function getNavMenus() {
  const rows = await query(
    `SELECT n.id, n.menu, n.label, n.page_id, n.url, n.parent_id, n.sort_order, p.path AS page_path, p.status AS page_status
       FROM nav_items n LEFT JOIN pages p ON p.id = n.page_id
      ORDER BY n.sort_order, n.label`);
  return {
    header: buildNavTree(rows.filter(r => r.menu === 'header')),
    footer: buildNavTree(rows.filter(r => r.menu === 'footer')),
  };
}

/** One menu, resolved for the public site: [{ label, href, children? }]. */
export async function getNav(menu) {
  const all = await getNavMenus();
  return menu === 'footer' ? all.footer : all.header;
}

/** Nav for the site shell: DB menus, falling back to the hard-coded header when empty or on error. */
export async function loadSiteNav() {
  try {
    const { header, footer } = await getNavMenus();
    return { header: header.length ? header : DEFAULT_HEADER_NAV, footer: footer.length ? footer : null };
  } catch (err) {
    console.error('[cms] nav load failed, using fallback:', err.message);
    return { header: DEFAULT_HEADER_NAV, footer: null };
  }
}

// --- Redirects --------------------------------------------------------------------------

/** { to, code } for `path`, or null. Path matching is exact after normalisation. */
export async function findRedirect(path) {
  const row = await queryOne('SELECT to_path, code FROM redirects WHERE from_path = $1', [normalizePath(path)]);
  return row ? { to: row.to_path, code: row.code } : null;
}
