// IndexNow: tells Bing, Yandex, Seznam, Naver (and through them AI search that reads their indexes) that URLs
// changed. Fire-and-forget; never throws; no-op unless a key is configured AND this is a production deployment.
// The key file is served by src/app/indexnow-key.txt/route.js and announced via `keyLocation`.
//
// RULE: only URLs that are public after the change, or were public before it. Never ping from a draft save, a
// draft/hidden document or folder, or a nav save: a URL sent here is announced to search engines, and an
// unpublished slug may be price-sensitive. Callers compute this from the before/after rows they already hold.
import { SITE_URL, absoluteUrl } from './site';

/**
 * Public URLs touched by a document, or [] when it is not public (published AND in a visible folder).
 * Includes the investors hub and the folder page, whose listings change with it.
 */
export function publicDocPaths(doc, folderSlug, folderVisible) {
  if (!doc || doc.status !== 'published' || !folderVisible || !folderSlug) return [];
  return ['/investors', `/investors/${folderSlug}`, `/investors/${folderSlug}/${doc.slug}`];
}

export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const KEY_RE = /^[A-Za-z0-9-]{8,128}$/;

export function getIndexNowKey() {
  const k = (process.env.INDEXNOW_KEY || '').trim();
  return KEY_RE.test(k) ? k : null;
}

/** paths: root-relative paths or absolute URLs on our host. */
export function pingIndexNow(paths) {
  try {
    const key = getIndexNowKey();
    if (!key || !process.env.REPLIT_DEPLOYMENT) return;
    const host = new URL(SITE_URL).host;
    const urls = new Set();
    for (const p of [].concat(paths || [])) {
      if (!p) continue;
      const u = String(p).startsWith('http') ? String(p) : absoluteUrl(String(p));
      try { if (new URL(u).host === host) urls.add(u); } catch { /* skip malformed */ }
    }
    if (!urls.size) return;
    fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key, keyLocation: absoluteUrl('/indexnow-key.txt'), urlList: [...urls].slice(0, 10000) }),
      signal: AbortSignal.timeout(3000),
    }).catch(() => {});
  } catch { /* never break a publish */ }
}
