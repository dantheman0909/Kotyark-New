import { query } from '@/lib/db';
import { requireUser, errorResponse, httpError } from '@/lib/auth';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const TIMEOUT_MS = 10_000;
const CONCURRENCY = 5;
const UA = 'KotyarkLinkChecker/1.0 (+https://www.kotyark.com)';

// Admin-supplied URLs only, but never probe the server's own network.
function isPrivateHost(host) {
  const h = host.toLowerCase();
  return h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal') || h === '::1' || h === '[::1]'
    || /^(127|10|0)\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h);
}

/** HEAD first; fall back to a 1-byte ranged GET when HEAD is refused. Returns { status, code }. */
async function probe(url) {
  let u;
  try { u = new URL(url); } catch { return { status: 'error', code: null }; }
  if (isPrivateHost(u.hostname)) return { status: 'error', code: null };
  const opts = (method, extra = {}) => ({ method, redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'User-Agent': UA, ...extra } });
  const classify = (code) => (code >= 200 && code < 400 ? 'ok' : 'broken');
  try {
    let res = await fetch(url, opts('HEAD'));
    if (res.status >= 400) {
      res.body?.cancel?.().catch(() => {});
      res = await fetch(url, opts('GET', { Range: 'bytes=0-0' }));
      res.body?.cancel?.().catch(() => {});
    }
    return { status: classify(res.status), code: res.status };
  } catch {
    try {
      const res = await fetch(url, opts('GET', { Range: 'bytes=0-0' }));
      res.body?.cancel?.().catch(() => {});
      return { status: classify(res.status), code: res.status };
    } catch { return { status: 'error', code: null }; }
  }
}

async function mapWithConcurrency(items, n, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i]); }
  }));
  return out;
}

// POST /api/documents/link-check
//   -> { checked, ok, broken, error, stored, checkedAt, brokenDocuments: [{id,title,external_url,status,http_code,folder_id,folder_name,folder_slug}] }
// documents:write (owner, editor, compliance). Probes documents that have an external_url and no stored file;
// `stored` counts those skipped because a file is held in App Storage (the legacy URL no longer matters).
export async function POST() {
  try {
    const user = await requireUser('documents:write');
    const docs = await query(
      `SELECT d.id, d.title, d.external_url, d.folder_id, f.name AS folder_name, f.slug AS folder_slug
         FROM documents d JOIN document_folders f ON f.id = d.folder_id
        WHERE d.external_url IS NOT NULL AND d.storage_key IS NULL ORDER BY d.created_at`);
    const stored = (await query('SELECT count(*)::int AS n FROM documents WHERE external_url IS NOT NULL AND storage_key IS NOT NULL'))[0].n;
    const checkedAt = new Date().toISOString();
    if (!docs.length) return Response.json({ checked: 0, ok: 0, broken: 0, error: 0, stored, checkedAt, brokenDocuments: [] });

    const results = await mapWithConcurrency(docs, CONCURRENCY, async (d) => {
      const r = await probe(d.external_url);
      // storage_key IS NULL: a file stored while this run was probing must not be re-flagged.
      await query('UPDATE documents SET link_status = $1, link_http_code = $2, link_checked_at = now() WHERE id = $3 AND storage_key IS NULL', [r.status, r.code, d.id]);
      return { ...d, ...r };
    });
    const count = (s) => results.filter((r) => r.status === s).length;
    const summary = { checked: results.length, ok: count('ok'), broken: count('broken'), error: count('error'), stored };
    await audit(user, 'update', 'document', null, `Link check: ${summary.ok} ok, ${summary.broken} broken, ${summary.error} unreachable, ${summary.stored} stored (skipped)`, { after: summary });
    return Response.json({
      ...summary,
      checkedAt,
      brokenDocuments: results.filter((r) => r.status !== 'ok').map((r) => ({ id: r.id, title: r.title, external_url: r.external_url, status: r.status, http_code: r.code, folder_id: r.folder_id, folder_name: r.folder_name, folder_slug: r.folder_slug })),
    });
  } catch (e) { return errorResponse(e); }
}
