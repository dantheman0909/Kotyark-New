// Shared helpers for the pages API routes. Server-only.
import crypto from 'node:crypto';
import { httpError } from '@/lib/auth';
import { BLOCKS, validateBlock, mapRichText } from '@/lib/blocks/schemas';
import { isAllowedEmbed, sanitizeRichText } from '@/lib/sanitize';
import { addPathRedirect, computePath, descendantIds, recomputeDescendantPaths, UUID_RE } from '@/lib/pages';

export const MAX_BLOCKS = 100;
// First path segments owned by app routes: a CMS page there would never be reachable.
const RESERVED_FIRST_SEGMENTS = new Set(['admin', 'api', 'login', 'preview', '_next', 'files', 'media', 'search']);

export function assertUuid(id) {
  if (!UUID_RE.test(String(id || ''))) throw httpError(404, 'Page not found');
}

export function assertPathAllowed(path) {
  const first = path.split('/').filter(Boolean)[0];
  if (first && RESERVED_FIRST_SEGMENTS.has(first)) throw httpError(400, `"/${first}" is reserved by the application; choose another slug.`);
}

export const PAGE_FULL_COLUMNS = `id, parent_id, slug, path, title, status, blocks, seo, show_in_nav, nav_order, template,
  preview_token, search_text, published_at, created_at, updated_at`;

export const pageColumns = (alias) => PAGE_FULL_COLUMNS.split(',').map(c => `${alias}.${c.trim()}`).join(', ');

export async function loadPage(client, id, { lock = false } = {}) {
  const { rows } = await client.query(`SELECT ${PAGE_FULL_COLUMNS} FROM pages WHERE id = $1${lock ? ' FOR UPDATE' : ''}`, [id]);
  if (!rows[0]) throw httpError(404, 'Page not found');
  return rows[0];
}

export function shapeFull(r) {
  return {
    id: r.id, parentId: r.parent_id, slug: r.slug, path: r.path, title: r.title, status: r.status,
    blocks: r.blocks, seo: r.seo, showInNav: r.show_in_nav, navOrder: r.nav_order, template: r.template,
    previewToken: r.preview_token, publishedAt: r.published_at, createdAt: r.created_at, updatedAt: r.updated_at,
    ...(r.has_unpublished_changes !== undefined ? { hasUnpublishedChanges: r.has_unpublished_changes } : {}),
  };
}

// ---- value checks -------------------------------------------------------------------------

const URL_OK = /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i;
const IMAGE_OK = /^([0-9a-f-]{36}|\/(?!\/)[^\s]*|https:\/\/[^\s]+)$/i;

/** Coerce raw props to the shape the schema declares and drop unknown keys. */
function normalizeProps(fields, props) {
  const src = props && typeof props === 'object' ? props : {};
  const out = {};
  for (const [k, f] of Object.entries(fields)) {
    const v = src[k];
    if (f.kind === 'list') {
      out[k] = (Array.isArray(v) ? v : []).filter(i => i && typeof i === 'object').map(item => normalizeProps(f.fields, item));
    } else if (f.kind === 'boolean') {
      out[k] = v === true || v === 'true';
    } else if (f.kind === 'number') {
      const n = Number(v);
      out[k] = Number.isFinite(n) ? n : 0;
    } else {
      const s = v === undefined || v === null ? (f.default ?? '') : String(v);
      out[k] = f.kind === 'select' || f.kind === 'url' || f.kind === 'image' || f.kind === 'folder' ? s.trim() : s;
    }
  }
  return out;
}

function checkValues(fields, props, where, errs) {
  for (const [k, f] of Object.entries(fields)) {
    const v = props[k];
    if (f.kind === 'list') v.forEach((item, i) => checkValues(f.fields, item, `${where}${f.label} #${i + 1} › `, errs));
    else if (f.kind === 'url' && v && !URL_OK.test(v)) errs.push(`${where}${f.label}: must start with /, https://, mailto: or tel:`);
    else if (f.kind === 'image' && v && !IMAGE_OK.test(v)) errs.push(`${where}${f.label}: must be a media id, a /path or an https:// URL`);
    else if (f.kind === 'text' && typeof v === 'string' && v.length > 500) errs.push(`${where}${f.label}: too long (max 500 characters)`);
  }
}

/**
 * Validate, normalise and sanitise a block list.
 * Returns { blocks, errors } where errors = [{ index, blockId, type, messages: [] }].
 */
export function cleanBlocks(input) {
  if (!Array.isArray(input)) throw httpError(400, 'blocks must be an array');
  if (input.length > MAX_BLOCKS) throw httpError(400, `A page can have at most ${MAX_BLOCKS} blocks`);
  const blocks = [];
  const errors = [];
  input.forEach((raw, index) => {
    const type = raw?.type;
    const def = BLOCKS[type];
    const blockId = typeof raw?.id === 'string' && raw.id.length > 0 && raw.id.length <= 64 ? raw.id : crypto.randomUUID();
    if (!def) { errors.push({ index, blockId, type: String(type), messages: [`Unknown block type: ${type}`] }); return; }
    let block = { id: blockId, type, props: normalizeProps(def.fields, raw.props) };
    const messages = [...validateBlock(block)];
    checkValues(def.fields, block.props, `${def.label} › `, messages);
    if (type === 'embed' && block.props.url && !isAllowedEmbed(block.props.url)) {
      messages.push(`${def.label} › Embed URL: host not allowed (use https YouTube, Vimeo or Google Maps URLs)`);
    }
    block = mapRichText(block, sanitizeRichText);
    if (messages.length) errors.push({ index, blockId, type, messages });
    blocks.push(block);
  });
  return { blocks, errors };
}

export function validationResponse(errors) {
  return Response.json({
    error: `Validation failed: ${errors.reduce((n, e) => n + e.messages.length, 0)} problem(s)`,
    errors,
  }, { status: 400 });
}

export function cleanSeo(input) {
  const s = input && typeof input === 'object' ? input : {};
  const str = (v, max) => String(v ?? '').trim().slice(0, max);
  const out = {
    metaTitle: str(s.metaTitle, 200),
    metaDescription: str(s.metaDescription, 400),
    ogImageId: str(s.ogImageId, 500),
    canonical: str(s.canonical, 500),
    noindex: s.noindex === true || s.noindex === 'true',
  };
  if (out.ogImageId && !IMAGE_OK.test(out.ogImageId)) throw httpError(400, 'SEO image must be a media id, a /path or an https:// URL');
  if (out.canonical && !/^https:\/\//i.test(out.canonical)) throw httpError(400, 'Canonical URL must start with https://');
  return out;
}

// ---- structural change (slug / parent) ----------------------------------------------------

/**
 * Re-slug and/or re-parent a page inside a transaction. Recomputes descendant paths and, for every
 * published page that moved, writes a 301 from its old path to its new one.
 * Returns the list of moved pages [{ id, oldPath, newPath, status }] (including the page itself).
 */
export async function movePage(client, existing, newSlug, newParentId) {
  const parentId = newParentId || null;
  if (existing.path === '/') {
    if (newSlug !== existing.slug || parentId !== (existing.parent_id || null)) throw httpError(400, 'The home page cannot be renamed or moved');
    return [];
  }
  if (!newSlug) throw httpError(400, 'Slug is required');
  if (parentId) {
    if (!UUID_RE.test(parentId)) throw httpError(400, 'Invalid parent');
    const { rows } = await client.query('SELECT 1 FROM pages WHERE id = $1', [parentId]);
    if (!rows[0]) throw httpError(400, 'Parent page not found');
    if ((await descendantIds(client, existing.id)).includes(parentId)) throw httpError(400, 'A page cannot be moved under itself or one of its sub-pages');
  }
  if (newSlug === existing.slug && parentId === (existing.parent_id || null)) return [];

  const newPath = await computePath(parentId, newSlug, client);
  assertPathAllowed(newPath);
  const { rows: clash } = await client.query('SELECT id FROM pages WHERE path = $1 AND id <> $2', [newPath, existing.id]);
  if (clash[0]) throw httpError(409, `Another page already uses ${newPath}`);

  await client.query('UPDATE pages SET slug = $1, parent_id = $2, path = $3, updated_at = now() WHERE id = $4',
    [newSlug, parentId, newPath, existing.id]);
  const moved = [{ id: existing.id, oldPath: existing.path, newPath, status: existing.status }];
  moved.push(...await recomputeDescendantPaths(client, existing.id));
  for (const m of moved) if (m.status === 'published') await addPathRedirect(client, m.oldPath, m.newPath);
  return moved;
}
