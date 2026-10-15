// Site search over CMS pages and investor documents. Server-only.
// Uses the generated tsvector columns (pages.search_tsv, documents.search_tsv) and their GIN indexes.
import { query } from './db';

export const MAX_QUERY_LENGTH = 200;
export const SEARCH_TYPES = ['all', 'pages', 'documents'];

// ts_headline marks matches with private-use sentinels so that text which itself contains "<mark>"
// can never be mistaken for a highlight. Sentinels become real <mark> tags only after the rest of
// the text has been HTML-escaped.
const SEL = '';
const STOP = '';
const HEADLINE_OPTS = `StartSel=${SEL},StopSel=${STOP},MaxFragments=2,MaxWords=30,MinWords=10`;

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape ts_headline output; only <mark>...</mark> (from our sentinels) survives. */
export function safeSnippet(raw) {
  if (!raw) return '';
  const escaped = String(raw).replace(/[&<>"']/g, c => ESC[c]);
  return escaped
    .replace(/([^]*)/g, '<mark>$1</mark>')
    .replace(/[]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeQuery(q) {
  return String(q ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_QUERY_LENGTH);
}

// $1 = query text, $2 = mode ('web' -> websearch_to_tsquery, 'prefix' -> to_tsquery with a ":*" term)
const TQ = `CASE WHEN $2 = 'prefix' THEN to_tsquery('english', $1) ELSE websearch_to_tsquery('english', $1) END`;

const HITS = `
  SELECT 'pages'::text AS type, p.id AS id, p.live_title AS title, p.path AS url,
         ts_rank_cd(p.search_tsv, q.tq) AS rank, p.published_at AS date
    FROM pages p, q
   WHERE p.status = 'published' AND coalesce(p.live_seo->>'noindex', '') <> 'true'
     AND p.search_tsv @@ q.tq
  UNION ALL
  SELECT 'documents'::text, d.id, d.title, '/investors/' || f.slug || '/' || d.slug,
         ts_rank_cd(d.search_tsv, q.tq), coalesce(d.doc_date::timestamptz, d.updated_at)
    FROM documents d JOIN document_folders f ON f.id = d.folder_id, q
   WHERE d.status = 'published' AND f.visible
     AND d.search_tsv @@ q.tq`;

async function run(term, mode, { limit, offset, type }) {
  const counts = await query(
    `WITH q AS (SELECT ${TQ} AS tq), hits AS (${HITS}) SELECT type, count(*)::int AS n FROM hits GROUP BY type`,
    [term, mode],
  );
  const c = { pages: 0, documents: 0 };
  for (const r of counts) c[r.type] = r.n;
  const total = type === 'pages' ? c.pages : type === 'documents' ? c.documents : c.pages + c.documents;
  if (total === 0 || offset >= total) return { counts: c, total, rows: [] };

  // Rank and page first; headlines (expensive) are computed only for the rows on this page.
  const rows = await query(
    `WITH q AS (SELECT ${TQ} AS tq),
          hits AS (${HITS}),
          pg AS (
            SELECT * FROM hits WHERE ($5 = 'all' OR type = $5)
             ORDER BY rank DESC, date DESC NULLS LAST, title LIMIT $3 OFFSET $4)
     SELECT pg.type, pg.title, pg.url, pg.date, f.name AS folder_name,
            CASE pg.type
              WHEN 'pages' THEN ts_headline('english', p.live_search_text, q.tq, $6)
              ELSE ts_headline('english', left(d.extracted_text, 500000), q.tq, $6) END AS hl,
            CASE pg.type
              WHEN 'pages' THEN ts_headline('english', coalesce(p.live_seo->>'metaDescription', ''), q.tq, $6)
              ELSE ts_headline('english', d.description, q.tq, $6) END AS hl_alt,
            CASE pg.type WHEN 'pages' THEN coalesce(p.live_seo->>'metaDescription', '') ELSE d.description END AS plain_alt
       FROM pg CROSS JOIN q
       LEFT JOIN pages p ON pg.type = 'pages' AND p.id = pg.id
       LEFT JOIN documents d ON pg.type = 'documents' AND d.id = pg.id
       LEFT JOIN document_folders f ON f.id = d.folder_id
      ORDER BY pg.rank DESC, pg.date DESC NULLS LAST, pg.title`,
    [term, mode, limit, offset, type, HEADLINE_OPTS],
  );
  return { counts: c, total, rows };
}

function shape(r) {
  let snippet = safeSnippet(r.hl);
  if (!snippet.includes('<mark>')) {
    // The match was in the title/description (or past the text we scanned): prefer those.
    const alt = safeSnippet(r.hl_alt);
    snippet = alt.includes('<mark>') ? alt : safeSnippet(String(r.plain_alt || '').slice(0, 220)) || snippet;
  }
  const out = { type: r.type === 'pages' ? 'page' : 'document', title: r.title, url: r.url, snippet };
  if (r.folder_name) out.folderName = r.folder_name;
  if (r.date) out.date = new Date(r.date).toISOString().slice(0, 10);
  return out;
}

/**
 * @param {string} q
 * @param {{limit?: number, offset?: number, type?: 'all'|'pages'|'documents'}} [opts]
 * @returns {Promise<{query: string, type: string, total: number, counts: {pages:number, documents:number}, results: Array}>}
 */
export async function searchSite(q, { limit = 20, offset = 0, type = 'all' } = {}) {
  const term = normalizeQuery(q);
  const t = SEARCH_TYPES.includes(type) ? type : 'all';
  const lim = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const off = Math.max(parseInt(offset, 10) || 0, 0);
  if (!term) return { query: term, type: t, total: 0, counts: { pages: 0, documents: 0 }, results: [] };

  let res = await run(term, 'web', { limit: lim, offset: off, type: t });
  if (res.counts.pages + res.counts.documents === 0) {
    // Prefix fallback for one short term ("polic" -> "policy"). Alphanumerics only, so no tsquery syntax can leak in.
    const word = term.replace(/[^\p{L}\p{N}]/gu, '');
    if (!/\s/.test(term) && word.length >= 3) {
      res = await run(`${word}:*`, 'prefix', { limit: lim, offset: off, type: t });
    }
  }
  return { query: term, type: t, total: res.total, counts: res.counts, results: res.rows.map(shape) };
}
