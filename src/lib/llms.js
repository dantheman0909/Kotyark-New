// Shared by /llms.txt and /llms-full.txt. Server-only.
import { query } from './db';
import { absoluteUrl } from './site';

const MAX_DOCS = 2000;
/** Titles and descriptions are interpolated into markdown links: neutralise brackets and line breaks. */
export function mdText(v) {
  return String(v ?? '').replace(/[\r\n\u2028\u2029]+/g, ' ').replace(/\[/g, '\\[').replace(/\]/g, '\\]').trim();
}

export const LLMS_HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
};

/**
 * One aggregate query: every visible folder with its published documents (explicit columns, no extracted_text).
 * Returns [] when the database is unavailable so the static parts of the files are still served.
 */
export async function loadDisclosures() {
  try {
    const rows = await query(
      `SELECT f.slug, f.name, f.description,
              coalesce(json_agg(json_build_object('title', d.title, 'slug', d.slug, 'date', d.doc_date, 'description', d.description)
                       ORDER BY d.doc_date DESC NULLS LAST, d.sort_order, d.title) FILTER (WHERE d.id IS NOT NULL), '[]'::json) AS docs
         FROM document_folders f
         LEFT JOIN documents d ON d.folder_id = f.id AND d.status = 'published'
        WHERE f.visible
        GROUP BY f.id
        ORDER BY f.sort_order, f.name`
    );
    let budget = MAX_DOCS; // total documents across all folders
    const folders = rows.map((r) => {
      const all = r.docs || [];
      const docs = all.slice(0, Math.max(0, budget));
      budget -= docs.length;
      return {
        slug: r.slug, name: mdText(r.name), description: mdText(r.description), url: absoluteUrl(`/investors/${r.slug}`),
        docs: docs.map((d) => ({ title: mdText(d.title), date: d.date ? String(d.date).slice(0, 10) : '', description: mdText(d.description), url: absoluteUrl(`/investors/${r.slug}/${d.slug}`) })),
        omitted: all.length - docs.length,
      };
    });
    const omitted = folders.reduce((n, f) => n + f.omitted, 0);
    if (omitted > 0) folders.truncatedNote = `Note: this list is truncated; ${omitted} more document(s) are listed on ${absoluteUrl('/investors')}.`;
    return folders;
  } catch (e) {
    console.error('[llms] database unavailable, serving static content only:', e?.message);
    return [];
  }
}
