// Checks every documents.external_url and records the result on the row.
// Never deletes or alters titles or URLs: a broken link is flagged, not removed.
//
//   node scripts/link-audit.mjs                 (npm run audit:links, once the script entry is added)
//   node scripts/link-audit.mjs --folder postal-ballot   # one folder only
//
// Classification:
//   ok      2xx and a pdf / octet-stream content-type
//   broken  404 or 410
//   error   anything else (other status, 2xx with a non-PDF type, timeout, network failure)
// HEAD first; on 405/403 retries once as GET with `Range: bytes=0-1023`. 15 s timeout, concurrency 5,
// one retry on a network error. Results: documents.link_status / link_http_code / link_checked_at,
// attached_assets/_scratch/link-audit.csv, and per-folder totals on stdout.
import fs from 'node:fs';
import path from 'node:path';
import { connect, scratchPath } from './lib/contract.mjs';

const args = process.argv.slice(2);
const fIdx = args.indexOf('--folder');
const ONLY_FOLDER = fIdx >= 0 ? args[fIdx + 1] : null;
for (const a of args) if (a.startsWith('--') && a !== '--folder') { console.error(`Unknown flag ${a}`); process.exit(1); }

const TIMEOUT_MS = 15_000;
const CONCURRENCY = 5;
const UA = 'Mozilla/5.0 (compatible; KotyarkLinkAudit/1.0; +https://www.kotyark.com)';

async function request(url, method, extraHeaders = {}) {
  const res = await fetch(url, { method, redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'user-agent': UA, ...extraHeaders } });
  try { await res.body?.cancel(); } catch { /* ignore */ }
  return res;
}

/** One check with a single retry on network error. Returns { status, code, note }. */
async function check(url) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      let res = await request(url, 'HEAD');
      if (res.status === 405 || res.status === 403) res = await request(url, 'GET', { range: 'bytes=0-1023' });
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (res.status >= 200 && res.status < 300) {
        const isPdf = ct.includes('pdf') || ct.includes('octet-stream');
        return { status: isPdf ? 'ok' : 'error', code: res.status, note: isPdf ? '' : `unexpected content-type: ${ct || 'none'}` };
      }
      if (res.status === 404 || res.status === 410) return { status: 'broken', code: res.status, note: '' };
      return { status: 'error', code: res.status, note: '' };
    } catch (e) {
      if (attempt === 1) return { status: 'error', code: null, note: e.cause?.code || e.name || e.message };
    }
  }
}

const client = await connect();
const params = [];
let where = `d.external_url IS NOT NULL`;
if (ONLY_FOLDER) { params.push(ONLY_FOLDER); where += ` AND f.slug = $1`; }
const { rows } = await client.query(
  `SELECT d.id, d.title, d.external_url, f.slug AS folder, f.sort_order AS fo, d.sort_order AS so
     FROM documents d JOIN document_folders f ON f.id = d.folder_id WHERE ${where} ORDER BY f.sort_order, d.sort_order`, params);

// Identical URLs (the same PDF filed under two sections) are fetched once.
const unique = [...new Set(rows.map((r) => r.external_url))];
const results = new Map();
let next = 0;
let done = 0;
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, unique.length) }, async () => {
  while (next < unique.length) {
    const url = unique[next++];
    results.set(url, await check(url));
    done++;
    if (done % 20 === 0 || done === unique.length) process.stdout.write(`\r  checked ${done}/${unique.length}`);
  }
}));
process.stdout.write('\n');

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const csv = [['folder', 'title', 'url', 'status', 'code', 'note'].join(',')];
const perFolder = new Map();
await client.query('BEGIN');
try {
  for (const r of rows) {
    const res = results.get(r.external_url);
    await client.query(
      `UPDATE documents SET link_status = $2, link_http_code = $3, link_checked_at = now() WHERE id = $1`, [r.id, res.status, res.code]);
    csv.push([r.folder, r.title, r.external_url, res.status, res.code ?? '', res.note].map(csvCell).join(','));
    const c = perFolder.get(r.folder) || { ok: 0, broken: 0, error: 0 };
    c[res.status]++;
    perFolder.set(r.folder, c);
  }
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  console.error('Failed to record results:', e.message);
  await client.end();
  process.exit(1);
}
await client.end();

fs.mkdirSync(path.dirname(scratchPath('x')), { recursive: true });
fs.writeFileSync(scratchPath('link-audit.csv'), csv.join('\n') + '\n');

const tot = { ok: 0, broken: 0, error: 0 };
console.log('\nfolder'.padEnd(36) + 'total    ok broken error');
for (const [folder, c] of perFolder) {
  console.log(folder.padEnd(35) + String(c.ok + c.broken + c.error).padStart(5) + String(c.ok).padStart(6) + String(c.broken).padStart(7) + String(c.error).padStart(6));
  for (const k of Object.keys(tot)) tot[k] += c[k];
}
console.log('TOTAL'.padEnd(35) + String(rows.length).padStart(5) + String(tot.ok).padStart(6) + String(tot.broken).padStart(7) + String(tot.error).padStart(6));
console.log(`(${unique.length} unique URLs checked)  CSV: attached_assets/_scratch/link-audit.csv`);
