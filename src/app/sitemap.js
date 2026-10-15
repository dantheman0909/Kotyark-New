import { query } from '@/lib/db';
import { absoluteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

// Routes that exist as files. A published CMS page at the same path supplies lastModified (or removes it if noindex).
const STATIC_PATHS = [
  '/', '/about', '/products', '/products/biodiesel', '/products/crude-glycerin',
  '/contact', '/investors', '/investors/sebi-lodr',
];

function priorityFor(path) {
  if (path === '/') return 1.0;
  const depth = path.split('/').filter(Boolean).length;
  return depth === 1 ? 0.8 : 0.6;
}

export default async function sitemap() {
  const now = new Date();
  /** @type {Map<string, {url:string,lastModified:Date,changeFrequency:string,priority:number}>} */
  const entries = new Map();
  const put = (path, lastModified, changeFrequency, priority) => {
    const url = absoluteUrl(path);
    entries.set(url, { url, lastModified, changeFrequency, priority });
  };

  for (const p of STATIC_PATHS) put(p, now, p === '/' || p === '/investors' ? 'weekly' : 'monthly', priorityFor(p));

  try {
    const [pages, folders, docs] = await Promise.all([
      query(`SELECT path, coalesce(published_at, updated_at) AS updated_at, (coalesce(live_seo->>'noindex', '') = 'true') AS noindex
               FROM pages WHERE status = 'published'`),
      query(`SELECT slug, updated_at FROM document_folders WHERE visible ORDER BY sort_order, name`),
      query(`SELECT d.slug, d.storage_key IS NOT NULL AS has_file, d.updated_at, f.slug AS folder_slug
               FROM documents d JOIN document_folders f ON f.id = d.folder_id
              WHERE d.status = 'published' AND f.visible
              ORDER BY d.updated_at DESC`),
    ]);

    for (const p of pages) {
      if (p.noindex) { entries.delete(absoluteUrl(p.path)); continue; }
      put(p.path, new Date(p.updated_at), 'monthly', priorityFor(p.path));
    }
    for (const f of folders) put(`/investors/${f.slug}`, new Date(f.updated_at), 'weekly', 0.7);
    for (const d of docs) {
      put(`/investors/${d.folder_slug}/${d.slug}`, new Date(d.updated_at), 'yearly', 0.5);
      // Only files we host. Legacy external (Wix) URLs are never listed.
      if (d.has_file) put(`/files/${d.slug}.pdf`, new Date(d.updated_at), 'yearly', 0.4);
    }
  } catch (e) {
    console.error('[sitemap] database unavailable, serving static routes only:', e?.message);
  }

  return [...entries.values()];
}
