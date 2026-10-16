// Dynamic social cards for the investor section and document pages. Server-only.
// Rendering a PNG is CPU-heavy, so rendered buffers are kept in a small in-memory LRU (50 entries, 5-minute life, cleared on every document/folder change) and
// every response carries a CDN-friendly Cache-Control. Only slugs that exist get their own entry; an unknown slug is
// served ONE shared generic card, so a crawler walking random URLs can neither fill the cache nor trigger renders.
import { queryOne } from './db';
import { renderOg } from './og-image';
import { clampDescription } from './seo';

const FALLBACK = { eyebrow: 'Investor Relations · NSE: KOTYARK', headline: 'Every filing, in the open.' };
// Short lifetimes: an unpublished or renamed filing's card must not outlive its page for long.
const CACHE_CONTROL = 'public, max-age=300, s-maxage=300';
const GENERIC_CACHE_CONTROL = 'public, max-age=60, s-maxage=60';
const MAX_ENTRIES = 50;
const ENTRY_TTL = 5 * 60_000;

const lru = (globalThis.__kotyarkOgLru ||= new Map());

function lruGet(key) {
  const e = lru.get(key);
  if (!e) return null;
  if (Date.now() - e.at > ENTRY_TTL) { lru.delete(key); return null; }
  lru.delete(key); lru.set(key, e); // most recently used goes last
  return e.buf;
}
function lruSet(key, buf) {
  lru.delete(key);
  lru.set(key, { buf, at: Date.now() });
  while (lru.size > MAX_ENTRIES) lru.delete(lru.keys().next().value);
}

function png(buf, cacheControl = CACHE_CONTROL) {
  return new Response(buf, { headers: { 'Content-Type': 'image/png', 'Cache-Control': cacheControl } });
}

/** Drop every cached card (called whenever a document or folder changes). */
export function clearOgCache() {
  lru.clear();
}

async function render(card) {
  const res = await renderOg(card);
  return Buffer.from(await res.arrayBuffer());
}

async function genericCard() {
  let buf = lruGet('generic');
  if (!buf) { buf = await render(FALLBACK); lruSet('generic', buf); }
  // A draft or not-yet-loaded slug gets the generic card; keep it short-lived so the real card appears soon after publishing.
  return png(buf, GENERIC_CACHE_CONTROL);
}

async function safeOne(sql, params) {
  try { return await queryOne(sql, params); } catch { return null; }
}

// Slugs are length-bounded before they are used as keys.
const okSlug = (s) => typeof s === 'string' && s.length > 0 && s.length <= 200;

export async function sectionCard(sectionSlug) {
  if (!okSlug(sectionSlug)) return genericCard();
  const key = `s:${sectionSlug}`;
  const hit = lruGet(key);
  if (hit) return png(hit);
  const f = await safeOne('SELECT name FROM document_folders WHERE slug = $1 AND visible', [sectionSlug]);
  if (!f) return genericCard();
  const buf = await render({ eyebrow: 'Investor Relations', headline: clampDescription(f.name, 60), sub: 'Kotyark Industries Limited · NSE: KOTYARK' });
  lruSet(key, buf);
  return png(buf);
}

export async function docCard(sectionSlug, docSlug) {
  if (!okSlug(sectionSlug) || !okSlug(docSlug)) return genericCard();
  const key = `d:${sectionSlug}/${docSlug}`;
  const hit = lruGet(key);
  if (hit) return png(hit);
  const d = await safeOne(
    `SELECT d.title, f.name AS folder FROM documents d JOIN document_folders f ON f.id = d.folder_id
      WHERE d.slug = $1 AND f.slug = $2 AND d.status = 'published' AND f.visible`, [docSlug, sectionSlug]);
  if (!d) return genericCard();
  const buf = await render({ eyebrow: `Investor Relations · ${clampDescription(d.folder, 40)}`, headline: clampDescription(d.title, 80), sub: 'Kotyark Industries Limited · NSE: KOTYARK' });
  lruSet(key, buf);
  return png(buf);
}
