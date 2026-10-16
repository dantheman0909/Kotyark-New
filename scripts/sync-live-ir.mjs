// Aligns the CMS investor documents with the live Wix site (https://www.kotyark.com/investor-relations).
//
// USAGE (Replit shell; database = KOTYARK_DATABASE_URL, else DATABASE_URL, same rules as scripts/migrate.mjs)
//
//   npm run sync:ir -- --fetch                    # 1. DRY RUN: crawl the live site, HEAD-check links, print the plan. Writes nothing.
//   npm run sync:ir -- --fetch --apply            # 2. APPLY the same plan in ONE transaction (audited, idempotent).
//   npm run sync:ir -- --apply                    # re-apply from the saved manifest (second run must report 0 changes)
//   npm run sync:ir -- --write-lodr               # regenerate src/lib/sebi-lodr-table.js from the manifest + this database
//   npm run sync:ir -- --verify-lodr              # read-only: does every href in src/lib/sebi-lodr-table.js resolve here?
//
// FLAGS
//   --apply            write. Without it the whole plan runs inside a transaction that is rolled back.
//   --fetch            re-crawl the live site (about 1 request per second, browser User-Agent) and rewrite the manifest.
//   --no-check         with --fetch: skip the HEAD check of every document URL (a few minutes saved; link_status left alone).
//   --manifest <file>  manifest to read / write (default attached_assets/_scratch/ir-sync/live-manifest.json).
//   --names heading|hub  folder name source: the live page heading (default) or the label on the live hub page.
//   --skip-satellites  do not create folders for the extra live pages the SEBI table links to (annual-reports, ...).
//   --fuzzy <0-1>      OPT-IN. Also pair leftover CMS / live titles greedily by best word overlap (e.g. 0.6). Default off: only file id / URL
//                      and exact normalised title are matched. Every fuzzy pairing is printed as a flag. Review diff.md first.
//   --force            also change documents an admin has edited (updated_by set). Off by default.
//   --retire-unmatched OPT-IN. Set status='draft' on documents that exist only in the CMS, have a broken link and no stored
//                      file. Default is to change nothing about them (they are listed in the report).
//
// WHAT IT CHANGES (never deletes anything)
//   document_folders  name := live heading; group_by := 'fy' where the live page groups; category (only if the column exists);
//                     live-only sections are created (slug = live slug, next sort_order, visible).
//   documents         matched by file id / URL, then by normalised title, inside the folder:
//                     title := live title (verbatim), external_url := live link, fy := live group label, doc_date := a date
//                     shown in the title, sort_order := live order. Slugs are NEVER changed. storage_key is NEVER touched.
//                     Live-only documents are inserted (published). CMS-only documents are kept and sorted after the live ones.
//   redirects         /<live path> and /investors/<live slug> -> /investors/<our slug>, inserted only when absent.
//   audit_log         one row per change (user_email 'sync:live-ir').
//
// Serving rule (src/app/files/[slug]/route.js, documentFileUrl in src/lib/documents.js): a document with a storage_key is
// served from storage; external_url is only the fallback / redirect target. So relinking a stored document never changes
// what visitors download.
//
// Outputs (gitignored): attached_assets/_scratch/ir-sync/{live-manifest.json,diff.json,diff.md,html/}
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT, connect, scratchPath, slugify, uniqueSlug } from './lib/contract.mjs';

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; };
const KNOWN = ['--apply', '--fetch', '--no-check', '--manifest', '--names', '--fuzzy', '--skip-satellites', '--force', '--retire-unmatched',
  '--write-lodr', '--verify-lodr', '--help'];
for (const a of args) {
  if (a.startsWith('--') && !KNOWN.includes(a)) { console.error(`Unknown flag ${a}. Known: ${KNOWN.join(' ')}`); process.exit(1); }
}
if (has('--help')) { console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n')); process.exit(0); }

const APPLY = has('--apply');
const FETCH = has('--fetch');
const NAMES = val('--names', 'heading');
const FUZZY = Number(val('--fuzzy', 0)) || 0;
if (FUZZY && !(FUZZY > 0 && FUZZY <= 1)) { console.error('--fuzzy needs a number in (0,1]'); process.exit(1); }
if (!['heading', 'hub'].includes(NAMES)) { console.error('--names must be heading or hub'); process.exit(1); }
const OUT_DIR = scratchPath('ir-sync');
const MANIFEST = val('--manifest', path.join(OUT_DIR, 'live-manifest.json'));
const LODR_FILE = path.join(ROOT, 'src', 'lib', 'sebi-lodr-table.js');
const SITE = 'https://www.kotyark.com';
const ACTOR = 'sync:live-ir';
fs.mkdirSync(path.join(OUT_DIR, 'html'), { recursive: true });

// ------------------------------------------------------------------ section map (live page -> our folder)
// category per the owner's mapping; satellites are the extra pages the SEBI table links to (slug = live slug).
const HUB = 'investor-relations';
const SEEDS = [
  { live: 'sebi-lodr', ours: 'sebi-lodr', category: 'Regulatory' },
  { live: 'closing-of-trading-window', ours: 'closing-trading-window', category: 'Regulatory' },
  { live: 'misc-disclosure-under-sebi', ours: 'misc-sebi-disclosure', category: 'Regulatory' },
  { live: 'board-meeting', ours: 'board-meetings', category: 'Regulatory' },
  { live: 'annualstatementofsubsidaries', ours: 'audited-financial-statements', category: 'Financial' },
  { live: 'annual-general-meeting', ours: 'annual-general-meeting', category: 'Financial' },
  { live: 'extra-ordinary-general-meetings', ours: 'extra-ordinary-general-meetings', category: 'Financial' },
  { live: 'investor-policies', ours: 'company-policies', category: 'Governance' },
  { live: 'merger-and-amalgamation', ours: 'merger-and-amalgamation', category: 'Governance' },
  { live: 'investor-relations/migrationtomainboard', ours: 'migration-to-main-board', category: 'Governance' },
  { live: 'smart-odr', ours: 'smart-odr', category: 'Other' },
  { live: 'unpaid-dividend', ours: 'unpaid-dividend', category: 'Financial' },
  { live: 'postal-ballot', ours: 'postal-ballot', category: 'Other' },
  { live: 'integrated-filling', ours: 'integrated-filling', category: 'Other' },
  // Live page titled "MOA - AOA" in the Wix page list; not linked from the hub, its document is linked from the SEBI table.
  { live: 'copy-of-integrated-filling', ours: 'moa-aoa', category: 'Governance', extra: true },
];
// Categories for satellites (not in the owner's mapping): Financial for the financial ones, Regulatory otherwise.
const SATELLITE_FINANCIAL = new Set(['annual-reports', 'annual-returns', 'financial-reults-on-conclusion-of-board-of-directors', 'shareholding-pattern']);

// ------------------------------------------------------------------ small helpers
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastReq = 0;
async function polite(url, opts = {}, tries = 3) {
  let last;
  for (let a = 1; a <= tries; a++) {
    const wait = 1000 - (Date.now() - lastReq);
    if (wait > 0) await sleep(wait);
    lastReq = Date.now();
    try {
      const res = await fetch(url, { redirect: 'follow', ...opts, headers: { 'User-Agent': UA, Accept: '*/*', ...(opts.headers || {}) }, signal: AbortSignal.timeout(45_000) });
      if (res.status === 429 || res.status >= 500) { last = res; if (a < tries) { await res.body?.cancel().catch(() => {}); await sleep(6000 * a); continue; } }
      return res;
    } catch (e) {
      last = e;
      if (a < tries) await sleep(3000 * a);
    }
  }
  if (last instanceof Response) return last;
  throw last;
}

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”' };
const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') { const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) ? String.fromCodePoint(n) : m; }
  return ENT[e.toLowerCase()] ?? m;
});
/** Visible text of an HTML fragment: tags dropped, <br> = space, entities decoded, zero-width chars removed, whitespace collapsed. */
const clean = (h) => decode(String(h).replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')).replace(/[​-‍﻿]/g, '').replace(/\s+/g, ' ').trim();
const stripNoise = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, '');
const normTitle = (t) => String(t || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
const fileKey = (u) => { const m = /\/ugd\/([A-Za-z0-9]+_[A-Za-z0-9]+)\.[A-Za-z0-9]+/i.exec(String(u || '')); return m ? m[1].toLowerCase() : null; };
const urlKey = (u) => fileKey(u) || String(u || '').replace(/[?#].*$/, '').replace(/\/+$/, '').toLowerCase();
const stable = (v) => JSON.stringify(v);
const esc1 = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;

/** 'FY 2024 - 25' / 'FY2024-2025' -> 'FY 2024-25' (the CMS convention, matches fyOfDate). Anything else is returned unchanged. */
function normLabel(l) {
  const m = /^FY\s*(\d{4})\s*-\s*(\d{2}|\d{4})$/i.exec(l.trim());
  return m ? `FY ${m[1]}-${m[2].slice(-2)}` : l;
}
/** The one dd.mm.yyyy date a title states, as ISO; null when none or ambiguous. */
function titleDate(t) {
  const set = new Set();
  for (const m of t.matchAll(/(?<!\d)(\d{1,2})\.(\d{1,2})\.(\d{4})(?!\d)/g)) {
    const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const iso = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dt = new Date(`${iso}T00:00:00Z`);
    if (mo >= 1 && mo <= 12 && !Number.isNaN(dt.getTime()) && dt.toISOString().slice(0, 10) === iso) set.add(iso);
  }
  return set.size === 1 ? [...set][0] : null;
}
const titleFy = (t) => { const m = /\bFY\s*(\d{4})\s*-\s*(\d{2}|\d{4})\b/i.exec(t); return m ? `FY ${m[1]}-${m[2].slice(-2)}` : null; };

// ------------------------------------------------------------------ crawl
function parsePage(url, html) {
  const title = clean((/<title>([\s\S]*?)<\/title>/i.exec(html) || [])[1] || '');
  const metaDescription = decode((/<meta name="description" content="([^"]*)"/i.exec(html) || [])[1] || '');
  const i = html.indexOf('<main');
  const j = html.indexOf('</main>');
  const main = stripNoise(i >= 0 ? html.slice(i, j > i ? j : undefined) : html);
  const tokens = [];
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let last = 0;
  const pushText = (seg) => {
    for (const piece of seg.split(/<\/p>|<\/h[1-6]>|<\/li>|<br\s*\/?>|<\/div>/i)) {
      const t = clean(piece);
      if (t) tokens.push({ t: 'text', text: t });
    }
  };
  for (let m; (m = re.exec(main));) {
    pushText(main.slice(last, m.index));
    last = m.index + m[0].length;
    const href = decode((/href="([^"]*)"/i.exec(m[1]) || [])[1] || '').trim();
    tokens.push({ t: 'a', href, text: clean(m[2]) });
  }
  pushText(main.slice(last));
  const first = tokens.find((x) => x.t === 'text');
  return { url, title, metaDescription, heading: first ? first.text : '', tokens };
}

const isSitePage = (href) => {
  try { const u = new URL(href, SITE); return /(^|\.)kotyark\.com$/.test(u.hostname) && !u.pathname.startsWith('/_files') && u.pathname !== '/'; } catch { return false; }
};
const sitePath = (href) => new URL(href, SITE).pathname.replace(/^\/+|\/+$/g, '');
const skipHref = (h) => !h || h.startsWith('#') || /^(mailto|tel|javascript):/i.test(h);

const pageCache = new Map();
const log = (...a) => console.log(...a);
async function getPage(p) {
  if (pageCache.has(p)) return pageCache.get(p);
  const url = `${SITE}/${p}`;
  const res = await polite(url);
  const html = await res.text();
  const finalPath = new URL(res.url).pathname.replace(/^\/+|\/+$/g, '');
  fs.writeFileSync(path.join(OUT_DIR, 'html', `${p.replace(/\//g, '_')}.html`), html);
  const page = { ...parsePage(url, html), status: res.status, finalPath, redirectedTo: finalPath !== p ? `/${finalPath}` : null, html };
  pageCache.set(p, page);
  log(`  crawled /${p}  ${res.status}${page.redirectedTo ? `  -> ${page.redirectedTo}` : ''}`);
  return page;
}

/** Docs and groups of a page, in page order. Child pages become groups labelled with the link text the visitor sees. */
async function collect(p, seedPaths, labelPath = [], depth = 0) {
  const page = await getPage(p);
  const groups = [];
  const flags = [];
  const unlinked = [];
  const direct = { label: labelPath.length ? labelPath.join(' / ') : null, sourceUrl: page.url, docs: [] };
  let sawHeading = false;
  let pendingGroup = null;
  for (const tk of page.tokens) {
    if (tk.t === 'text') {
      if (!sawHeading) { sawHeading = true; continue; }
      unlinked.push(tk.text);
      continue;
    }
    if (skipHref(tk.href)) continue;
    if (!tk.text) { flags.push(`link without visible text skipped: ${tk.href}`); continue; }
    if (isSitePage(tk.href)) {
      const cp = sitePath(tk.href);
      if (cp === p || seedPaths.has(cp) || depth >= 3) continue;
      const child = await getPage(cp);
      if (child.redirectedTo) {
        flags.push(`child page "${tk.text}" (${tk.href}) redirects to ${child.redirectedTo} on the live site: no documents`);
        groups.push({ label: normLabel(tk.text), sourceUrl: tk.href, docs: [], liveBroken: true });
        continue;
      }
      const sub = await collect(cp, seedPaths, [...labelPath, normLabel(tk.text)], depth + 1);
      groups.push(...sub.groups);
      flags.push(...sub.flags);
      unlinked.push(...sub.unlinked.map((t) => `[${tk.text}] ${t}`));
      continue;
    }
    direct.docs.push({ title: tk.text, url: tk.href });
  }
  void pendingGroup;
  const out = direct.docs.length ? [direct, ...groups] : groups;
  return { page, groups: out, flags, unlinked };
}

function parseLodrTable(html) {
  const tbl = /<table[\s\S]*?<\/table>/i.exec(html);
  if (!tbl) return null;
  const rows = [];
  let cur = null; // the row owning a rowspan
  for (const chunk of tbl[0].split(/<tr\b[^>]*>|<\/tr>/i)) {
    const cells = [...chunk.matchAll(/<(th|td)\b([^>]*)>([\s\S]*?)(?=<(?:th|td)\b|<\/t[hd]>|$)/gi)].map((m) => ({ tag: m[1].toLowerCase(), attrs: m[2], html: m[3] }));
    if (!cells.length || cells[0].tag === 'th') continue;
    const mkLinks = (h) => [...h.matchAll(/<a\b[^>]*?href\s*=\s*"([^"]*)"[^>]*>([\s\S]*?)(?:<\/a>|$)/gi)].map((m) => ({ href: decode(m[1]).trim(), label: clean(m[2]) }));
    const lines = (h) => decode(h.replace(/<a\b[\s\S]*?<\/a>/gi, ' ').replace(/<\/?(b|i|strong|em)>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''))
      .split('\n').map((x) => x.replace(/[​-‍﻿]/g, '').replace(/\s+/g, ' ').trim()).filter(Boolean);
    const detailHtml = cells[cells.length - 1].html;
    const details = lines(detailHtml);
    const links = mkLinks(detailHtml);
    if (cells.length >= 3) {
      const rs = /rowspan="(\d+)"/i.exec(cells[0].attrs);
      const row = { sr: clean(cells[0].html), particular: clean(cells[1].html), regulation: '', status: '', details, links };
      rows.push(row);
      cur = rs && Number(rs[1]) > 1 ? row : null;
    } else if (cells.length === 2) {
      rows.push({ sr: '', parentSr: cur ? cur.sr : null, indent: true, particular: clean(cells[0].html), regulation: '', status: '', details, links });
    }
  }
  return rows;
}

async function crawl() {
  log('Crawling the live site (about 1 request per second)...');
  const seedPaths = new Set(SEEDS.map((s) => s.live));
  const hub = await getPage(HUB);
  // Seeds from the hub, in hub order; anything the hub links that we have no mapping for becomes an unmapped section.
  const hubLinks = hub.tokens.filter((t) => t.t === 'a' && isSitePage(t.href) && t.text && sitePath(t.href) !== HUB);
  const hubLabel = new Map();
  for (const l of hubLinks) if (!hubLabel.has(sitePath(l.href))) hubLabel.set(sitePath(l.href), l.text);
  const order = [...hubLabel.keys()];
  const sebi = await getPage('sebi-lodr');
  // SEBI table: embedded HTML (Wix "HtmlComponent"), not in the server-rendered markup. Find and fetch it.
  let lodr = null;
  const feat = [...new Set((sebi.html.match(/https:\/\/siteassets\.parastorage\.com\/pages\/pages\/thunderbolt\?[^"\\\s]*module=thunderbolt-features[^"\\\s]*/g) || []).map((u) => u.replace(/&amp;/g, '&')))];
  const embeds = new Set();
  for (const u of feat) {
    const r = await polite(u);
    const t = await r.text();
    for (const m of t.matchAll(/https:\/\/[A-Za-z0-9.-]*filesusr\.com\/html\/[A-Za-z0-9_]+\.html/g)) embeds.add(m[0]);
  }
  for (const u of embeds) {
    const r = await polite(u);
    const t = await r.text();
    if (/<table/i.test(t) && /SR\.?\s*NO/i.test(t)) {
      fs.writeFileSync(path.join(OUT_DIR, 'html', 'sebi-lodr-embed.html'), t);
      lodr = { sourceUrl: u, rows: parseLodrTable(t) };
      log(`  SEBI table: ${lodr.rows.length} rows from ${u}`);
      break;
    }
  }
  if (!lodr) throw new Error('SEBI LODR table embed not found; the live page structure changed');
  // Satellites: kotyark.com pages the table links to that are not hub sections.
  const satPaths = [];
  for (const r of lodr.rows) for (const l of r.links) {
    if (isSitePage(l.href)) {
      const p = sitePath(l.href);
      if (!seedPaths.has(p) && !satPaths.includes(p) && !['about-us', 'contact'].includes(p) && p !== HUB && !order.includes(p)) satPaths.push(p);
    }
  }
  // Sections in site-menu order (SEEDS), then hub links we have no mapping for, then the SEBI-table satellites.
  // kind: hub = linked from the hub page; menu = in the site menu / SEBI table only (e.g. Audited Financial Statements).
  const all = [
    ...SEEDS.map((s) => ({ live: s.live, kind: s.extra ? 'extra' : hubLabel.has(s.live) ? 'hub' : 'menu' })),
    ...order.filter((p) => !SEEDS.some((s) => s.live === p)).map((p) => ({ live: p, kind: 'hub' })),
    ...satPaths.map((p) => ({ live: p, kind: 'satellite' })),
  ];
  for (const e of all) seedPaths.add(e.live);
  const sections = [];
  for (const e of all) {
    const seed = SEEDS.find((s) => s.live === e.live);
    const { page, groups, flags, unlinked } = await collect(e.live, seedPaths);
    const last = e.live.split('/').pop();
    const intro = []; // text shown before the first link and after the heading
    const firstLinkIdx = page.tokens.findIndex((t) => t.t === 'a' && !skipHref(t.href));
    const headIdx = page.tokens.findIndex((t) => t.t === 'text');
    for (const [k, t] of page.tokens.entries()) if (t.t === 'text' && k > headIdx && (firstLinkIdx < 0 || k < firstLinkIdx) && e.live !== 'sebi-lodr') intro.push(t.text);
    sections.push({
      liveUrl: page.url, slugGuess: last, livePath: e.live, kind: e.kind, hubLabel: hubLabel.get(e.live) || null,
      ours: seed ? seed.ours : last,
      category: seed ? seed.category : (SATELLITE_FINANCIAL.has(last) ? 'Financial' : e.kind === 'hub' ? 'Other' : 'Regulatory'),
      mapped: Boolean(seed) || e.kind === 'satellite',
      heading: page.heading, pageTitle: page.title, metaDescription: page.metaDescription, intro,
      groups: groups.map((g) => ({ label: g.label, sourceUrl: g.sourceUrl, liveBroken: g.liveBroken || false,
        docs: g.docs.map((d) => ({ title: d.title, url: d.url, date: titleDate(d.title) })) })),
      unlinked: unlinked.filter((t) => !intro.includes(t)), flags,
      ...(e.live === 'sebi-lodr' ? { lodr } : {}),
    });
  }
  // Doc-level hub link (outside any section)
  const hubDocs = hub.tokens.filter((t) => t.t === 'a' && !skipHref(t.href) && !isSitePage(t.href) && t.text).map((t) => ({ title: t.text, url: t.href }));
  return { crawledAt: new Date().toISOString(), hub: { liveUrl: hub.url, heading: hub.heading, title: hub.title, directDocs: hubDocs, links: [...hubLabel.entries()].map(([p, l]) => ({ path: p, label: l })) }, sections };
}

// ------------------------------------------------------------------ link check
async function headCheck(url) {
  const out = { checkedAt: new Date().toISOString(), method: 'HEAD' };
  try {
    let r = await polite(url, { method: 'HEAD' });
    if (r.status >= 400 || r.status === 405) {
      await r.body?.cancel().catch(() => {});
      r = await polite(url, { method: 'GET', headers: { Range: 'bytes=0-0' } });
      out.method = 'GET-range';
    }
    out.status = r.status;
    out.contentType = (r.headers.get('content-type') || '').split(';')[0] || null;
    const cr = /\/(\d+)$/.exec(r.headers.get('content-range') || '');
    out.size = cr ? Number(cr[1]) : (r.headers.get('content-length') ? Number(r.headers.get('content-length')) : null);
    if (r.url && r.url !== url) out.finalUrl = r.url;
    await r.body?.cancel().catch(() => {});
  } catch (e) { out.status = 0; out.error = String(e.cause?.code || e.message || e); }
  return out;
}
async function checkAll(manifest) {
  const urls = new Set();
  for (const s of manifest.sections) {
    for (const g of s.groups) for (const d of g.docs) urls.add(d.url);
    for (const r of s.lodr?.rows || []) for (const l of r.links) if (/^https?:/.test(l.href) && !isSitePage(l.href)) urls.add(l.href);
  }
  for (const d of manifest.hub.directDocs) urls.add(d.url);
  const old = manifest.checks || {};
  manifest.checks = {};
  let n = 0;
  log(`HEAD-checking ${urls.size} URLs (sequential, about 1 per second)...`);
  for (const u of urls) {
    manifest.checks[u] = await headCheck(u);
    if (++n % 25 === 0) log(`  ${n}/${urls.size}`);
  }
  void old;
}
function annotateChecks(manifest) {
  const flagFor = (c) => {
    if (!c) return null;
    if (c.status !== 200) return `HTTP ${c.status || 'error'}${c.error ? ` (${c.error})` : ''}`;
    if (c.contentType && !/pdf/i.test(c.contentType)) return `not a PDF (${c.contentType})`;
    return null;
  };
  for (const s of manifest.sections) {
    for (const g of s.groups) for (const d of g.docs) { d.check = manifest.checks?.[d.url] || null; d.checkFlag = flagFor(d.check); }
    for (const r of s.lodr?.rows || []) for (const l of r.links) { const c = manifest.checks?.[l.href]; if (c) { l.check = c; l.checkFlag = flagFor(c); } }
  }
}

// ------------------------------------------------------------------ planning
function jaccard(a, b) {
  const A = new Set(normTitle(a).split(' ')); const B = new Set(normTitle(b).split(' '));
  let i = 0; for (const x of A) if (B.has(x)) i++;
  return i / (A.size + B.size - i || 1);
}
const linkStatusOf = (c) => (!c ? null : c.status === 200 ? 'ok' : c.status === 0 ? 'error' : 'broken');

async function plan(client, manifest) {
  const ops = [];
  const notes = [];
  const diff = { generatedAt: new Date().toISOString(), crawledAt: manifest.crawledAt, sections: [], summary: {} };
  const q = (t, p = []) => client.query(t, p).then((r) => r.rows);
  const hasCategory = (await q(`SELECT 1 FROM information_schema.columns WHERE table_name='document_folders' AND column_name='category'`)).length > 0;
  const folders = await q(`SELECT id, slug, name, group_by, sort_order, visible${hasCategory ? ', category' : ''} FROM document_folders`);
  const docs = await q(`SELECT id, folder_id, title, slug, external_url, storage_key, fy, doc_date::text AS doc_date, sort_order, status,
                               link_status, updated_by, created_at FROM documents`);
  const pagesPaths = new Set((await q('SELECT path FROM pages')).map((r) => r.path));
  const redirectsRows = new Map((await q('SELECT from_path, to_path FROM redirects')).map((r) => [r.from_path, r.to_path]));
  const slugSet = new Set(docs.map((d) => d.slug));
  const folderBySlug = new Map(folders.map((f) => [f.slug, { ...f }]));
  let nextSort = Math.max(0, ...folders.map((f) => f.sort_order));
  const claimedUrls = new Set(docs.map((d) => `${d.folder_id}\u0000${d.external_url}`));
  const redirectsPlanned = new Set();

  const sections = manifest.sections.filter((s) => !(has('--skip-satellites') && s.kind === 'satellite'));
  for (const s of sections) {
    const sd = { liveUrl: s.liveUrl, livePath: s.livePath, kind: s.kind, ours: s.ours, heading: s.heading, flags: [...s.flags], unlinked: s.unlinked, intro: s.intro };
    diff.sections.push(sd);
    let folder = folderBySlug.get(s.ours);
    const wantName = NAMES === 'hub' && s.hubLabel ? s.hubLabel : s.heading;
    const liveHasGroups = s.groups.some((g) => g.label);
    if (!folder) {
      folder = { id: crypto.randomUUID(), slug: s.ours, name: wantName, group_by: liveHasGroups ? 'fy' : 'none', sort_order: ++nextSort, visible: true, category: s.category, isNew: true };
      folderBySlug.set(s.ours, folder);
      ops.push({ op: 'folder.insert', section: s.ours, row: { ...folder, description: '', intro_html: '' }, hasCategory });
      sd.folder = 'new';
    } else {
      const before = {}; const after = {};
      if (folder.name !== wantName) { before.name = folder.name; after.name = wantName; }
      if (liveHasGroups && folder.group_by === 'none') { before.group_by = folder.group_by; after.group_by = 'fy'; }
      if (hasCategory && s.category !== 'Other' && folder.category === 'Other') { before.category = folder.category; after.category = s.category; }
      if (Object.keys(after).length) ops.push({ op: 'folder.update', section: s.ours, id: folder.id, before, after, hasCategory });
      sd.folder = 'exists'; sd.nameDiff = folder.name !== wantName ? { ours: folder.name, live: wantName } : null;
    }
    if (!s.mapped) sd.flags.push(`hub section with no mapping in SEEDS: folder slug defaulted to the live slug (${s.ours}) and category to Other`);

    // ---- documents
    const live = []; const seenUrl = new Set(); const liveDupes = [];
    for (const g of s.groups) for (const d of g.docs) {
      if (seenUrl.has(d.url)) { liveDupes.push({ title: d.title, url: d.url, group: g.label }); continue; }
      seenUrl.add(d.url);
      live.push({ ...d, group: g.label, fy: g.label ? g.label : null });
    }
    const ours = folder.isNew ? [] : docs.filter((d) => d.folder_id === folder.id);
    const unmatchedOurs = new Set(ours.map((d) => d.id));
    const byId = new Map(ours.map((d) => [d.id, d]));
    const match = new Map(); // live index -> our doc
    const kind = new Map();
    const take = (li, od, how) => { match.set(li, od); kind.set(li, how); unmatchedOurs.delete(od.id); };
    live.forEach((l, i) => {
      const k = urlKey(l.url);
      const od = ours.find((o) => unmatchedOurs.has(o.id) && o.external_url && urlKey(o.external_url) === k);
      if (od) take(i, od, 'url');
    });
    live.forEach((l, i) => {
      if (match.has(i)) return;
      const od = ours.find((o) => unmatchedOurs.has(o.id) && normTitle(o.title) === normTitle(l.title));
      if (od) take(i, od, 'title');
    });
    // Opt-in (--fuzzy 0.6): pair leftovers that are each other's best word-overlap match. Default off: never guessed.
    if (FUZZY > 0) {
      const cand = [];
      live.forEach((l, i) => { if (!match.has(i)) for (const o of ours) if (unmatchedOurs.has(o.id)) cand.push({ i, o, j: jaccard(o.title, l.title) }); });
      cand.sort((a, b) => b.j - a.j);
      for (const c of cand) if (c.j >= FUZZY && !match.has(c.i) && unmatchedOurs.has(c.o.id)) take(c.i, c.o, 'fuzzy');
    }
    const sdoc = { liveCount: live.length, matchedByUrl: 0, matchedByTitle: 0, titleDiffs: [], linkDiffs: [], fyDiffs: [], orderDiffs: [], liveOnly: [], oursOnly: [], liveDuplicateUrls: liveDupes, possible: [] };
    sd.docs = sdoc;
    const pos = new Map(live.map((l, i) => [i, i + 1]));
    live.forEach((l, i) => {
      const od = match.get(i);
      const date = l.date;
      if (!od) {
        const base = /^(FY\s*)?\d{4}\s*-\s*\d{2,4}$/i.test(l.title) && l.group ? `${l.group} ${l.title}` : l.title;
        sdoc.liveOnly.push({ title: l.title, url: l.url, group: l.group, status: l.check?.status ?? null });
        if (claimedUrls.has(`${folder.id}\u0000${l.url}`)) { sd.flags.push(`live-only document skipped, URL already used in this folder: ${l.title}`); return; }
        claimedUrls.add(`${folder.id}\u0000${l.url}`);
        ops.push({ op: 'doc.insert', section: s.ours, folderId: folder.id, title: l.title, slugBase: base, url: l.url,
          fy: l.fy || titleFy(l.title), doc_date: date, sort_order: pos.get(i), check: l.check || null });
        return;
      }
      if (kind.get(i) === 'url') sdoc.matchedByUrl++; else sdoc.matchedByTitle++;
      if (kind.get(i) === 'fuzzy') sd.flags.push(`fuzzy match applied: "${od.title}" <- "${l.title}"`);
      const before = {}; const after = {};
      if (od.title !== l.title) { before.title = od.title; after.title = l.title; sdoc.titleDiffs.push({ ours: od.title, live: l.title }); }
      if (od.external_url !== l.url) {
        if (claimedUrls.has(`${folder.id}\u0000${l.url}`)) sd.flags.push(`link not changed (URL already used by another document in this folder): ${l.title}`);
        else { before.external_url = od.external_url; after.external_url = l.url; claimedUrls.add(`${folder.id}\u0000${l.url}`); sdoc.linkDiffs.push({ title: l.title, ours: od.external_url, live: l.url, stored: Boolean(od.storage_key) }); }
      }
      if (l.fy && od.fy !== l.fy) { before.fy = od.fy; after.fy = l.fy; sdoc.fyDiffs.push({ title: l.title, ours: od.fy, live: l.fy }); }
      if (date && od.doc_date !== date) { before.doc_date = od.doc_date; after.doc_date = date; }
      if (od.sort_order !== pos.get(i)) { before.sort_order = od.sort_order; after.sort_order = pos.get(i); sdoc.orderDiffs.push({ title: l.title, ours: od.sort_order, live: pos.get(i) }); }
      if (Object.keys(after).length) {
        if (od.updated_by && !has('--force')) { sd.flags.push(`document edited by an admin, left alone (use --force): ${od.title}`); return; }
        ops.push({ op: 'doc.update', section: s.ours, id: od.id, slug: od.slug, before, after, check: after.external_url ? (l.check || null) : null });
      }
    });
    // CMS-only documents: kept; moved after the live ones so the live order leads.
    const tail = ours.filter((o) => unmatchedOurs.has(o.id)).sort((a, b) => a.sort_order - b.sort_order || String(a.created_at).localeCompare(String(b.created_at)));
    tail.forEach((o, k) => {
      const want = live.length + k + 1;
      const best = live.map((l, i) => ({ l, i, j: jaccard(o.title, l.title) })).filter((x) => !match.has(x.i)).sort((a, b) => b.j - a.j)[0];
      sdoc.oursOnly.push({ title: o.title, url: o.external_url, slug: o.slug, linkStatus: o.link_status, stored: Boolean(o.storage_key), status: o.status,
        possibleLive: best && best.j >= 0.5 ? { title: best.l.title, score: Number(best.j.toFixed(2)) } : null });
      if (o.sort_order !== want && !(o.updated_by && !has('--force'))) ops.push({ op: 'doc.update', section: s.ours, id: o.id, slug: o.slug, before: { sort_order: o.sort_order }, after: { sort_order: want }, check: null });
      if (has('--retire-unmatched') && o.status === 'published' && !o.storage_key && ['broken', 'error'].includes(o.link_status)) {
        ops.push({ op: 'doc.update', section: s.ours, id: o.id, slug: o.slug, before: { status: o.status }, after: { status: 'draft' }, check: null });
      }
    });
    void byId;

    // ---- redirects (old live URLs)
    const liveSlug = s.livePath.split('/').pop();
    const want = [{ from: `/${s.livePath}`, to: `/investors/${s.ours}` }];
    if (liveSlug !== s.ours) want.push({ from: `/investors/${liveSlug}`, to: `/investors/${s.ours}` });
    for (const r of want) {
      if (r.from === r.to) continue;
      if (pagesPaths.has(r.from)) { sd.flags.push(`redirect not added, a CMS page exists at ${r.from}`); continue; }
      if (r.from.startsWith('/investors/') && folderBySlug.has(r.from.slice('/investors/'.length)) && !r.from.slice('/investors/'.length).includes('/')) { sd.flags.push(`redirect not added, ${r.from} is a real folder`); continue; }
      if (redirectsRows.has(r.from)) { if (redirectsRows.get(r.from) !== r.to) sd.flags.push(`redirect ${r.from} already points to ${redirectsRows.get(r.from)} (not changed)`); continue; }
      if (redirectsPlanned.has(r.from)) continue;
      redirectsPlanned.add(r.from);
      ops.push({ op: 'redirect.insert', section: s.ours, from: r.from, to: r.to });
    }
  }
  // hub: /investor-relations -> /investors
  if (!redirectsRows.has('/investor-relations') && !pagesPaths.has('/investor-relations')) ops.push({ op: 'redirect.insert', section: 'hub', from: '/investor-relations', to: '/investors' });

  diff.summary = {
    sectionsLive: manifest.sections.length,
    sectionsMissingInOurs: diff.sections.filter((x) => x.folder === 'new').map((x) => x.ours),
    sectionsOnlyInOurs: folders.filter((f) => !manifest.sections.some((s) => s.ours === f.slug) && f.slug !== 'investors').map((f) => f.slug),
  };
  return { ops, diff, hasCategory, slugSet, notes };
}

// ------------------------------------------------------------------ execution
async function auditRow(client, action, entity, entityId, summary, diff) {
  await client.query(`INSERT INTO audit_log(user_id, user_email, action, entity, entity_id, summary, diff) VALUES (NULL,$1,$2,$3,$4,$5,$6::jsonb)`,
    [ACTOR, action, entity, entityId == null ? null : String(entityId), summary, diff ? JSON.stringify(diff) : null]);
}
async function execute(client, p) {
  const counts = { document_folders: { inserted: 0, updated: 0 }, documents: { inserted: 0, updated: 0 }, redirects: { inserted: 0, updated: 0 }, audit_log: { inserted: 0 } };
  const lines = [];
  const audit = async (...a) => { await auditRow(client, ...a); counts.audit_log.inserted++; };
  const slugs = p.slugSet;
  for (const o of p.ops) {
    if (o.op === 'folder.insert') {
      const r = o.row;
      const cols = ['id', 'slug', 'name', 'description', 'intro_html', 'group_by', 'visible', 'sort_order'];
      const vals = [r.id, r.slug, r.name, '', '', r.group_by, true, r.sort_order];
      if (o.hasCategory) { cols.push('category'); vals.push(r.category); }
      await client.query(`INSERT INTO document_folders(${cols.join(',')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(',')})`, vals);
      counts.document_folders.inserted++;
      lines.push(`insert folder  ${r.slug}  "${r.name}"  group_by=${r.group_by}${o.hasCategory ? `  category=${r.category}` : ''}  sort=${r.sort_order}`);
      await audit('create', 'folder', r.id, `Live sync: created folder ${r.slug}`, { before: null, after: { slug: r.slug, name: r.name, group_by: r.group_by, category: o.hasCategory ? r.category : undefined, sort_order: r.sort_order } });
    } else if (o.op === 'folder.update') {
      const set = Object.keys(o.after);
      await client.query(`UPDATE document_folders SET ${set.map((k, i) => `${k}=$${i + 2}`).join(', ')}, updated_at=now() WHERE id=$1`, [o.id, ...set.map((k) => o.after[k])]);
      counts.document_folders.updated++;
      lines.push(`update folder  ${o.section}  ${stable(o.after)}  (was ${stable(o.before)})`);
      await audit('update', 'folder', o.id, `Live sync: updated folder ${o.section}`, { before: o.before, after: o.after });
    } else if (o.op === 'doc.insert') {
      const slug = await uniqueSlug(o.slugBase, async (c) => slugs.has(c));
      slugs.add(slug);
      const ls = linkStatusOf(o.check);
      const { rows: [row] } = await client.query(
        `INSERT INTO documents(folder_id, title, slug, external_url, fy, doc_date, sort_order, status, link_status, link_http_code, link_checked_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'published',$8,$9,$10) RETURNING id`,
        [o.folderId, o.title, slug, o.url, o.fy, o.doc_date, o.sort_order, ls || 'unchecked', o.check ? o.check.status || null : null, o.check ? o.check.checkedAt : null]);
      counts.documents.inserted++;
      lines.push(`insert doc     [${o.section}] #${o.sort_order} ${o.title}  -> ${slug}${o.fy ? `  fy=${o.fy}` : ''}${o.doc_date ? `  date=${o.doc_date}` : ''}`);
      await audit('create', 'document', row.id, `Live sync: added "${o.title}" to ${o.section}`, { before: null, after: { title: o.title, slug, external_url: o.url, fy: o.fy, doc_date: o.doc_date, sort_order: o.sort_order } });
    } else if (o.op === 'doc.update') {
      const set = Object.keys(o.after);
      const params = [o.id, ...set.map((k) => o.after[k])];
      let sql = `UPDATE documents SET ${set.map((k, i) => `${k}=$${i + 2}`).join(', ')}`;
      if (o.after.external_url && o.check) {
        sql += `, link_status=$${params.length + 1}, link_http_code=$${params.length + 2}, link_checked_at=$${params.length + 3}`;
        params.push(linkStatusOf(o.check), o.check.status || null, o.check.checkedAt);
      }
      await client.query(`${sql}, updated_at=now() WHERE id=$1`, params);
      counts.documents.updated++;
      lines.push(`update doc     [${o.section}] ${o.slug}  ${stable(o.after)}`);
      await audit('update', 'document', o.id, `Live sync: updated ${o.slug}`, { before: o.before, after: o.after });
    } else if (o.op === 'redirect.insert') {
      const r = await client.query(`INSERT INTO redirects(from_path, to_path, code) VALUES ($1,$2,301) ON CONFLICT (from_path) DO NOTHING`, [o.from, o.to]);
      if (r.rowCount) {
        counts.redirects.inserted++;
        lines.push(`insert redirect ${o.from} -> ${o.to}`);
        await audit('create', 'redirect', o.from, `Live sync: redirect ${o.from} -> ${o.to}`, { before: null, after: { from: o.from, to: o.to, code: 301 } });
      }
    }
  }
  return { counts, lines };
}

// ------------------------------------------------------------------ diff report
function writeDiff(diff, manifest, inSync) {
  // A run that finds nothing to change describes the already-synced state: it must not overwrite the before-sync diff.
  const base = inSync && fs.existsSync(path.join(OUT_DIR, 'diff.json')) ? 'diff-in-sync' : 'diff';
  fs.writeFileSync(path.join(OUT_DIR, `${base}.json`), JSON.stringify(diff, null, 2));
  const L = [];
  L.push('# Live site vs CMS: investor documents', '', `Crawled ${manifest.crawledAt}. Generated ${diff.generatedAt}. Names from: ${NAMES}.`, '');
  L.push(`- Live sections: ${diff.summary.sectionsLive}`);
  L.push(`- Live sections missing in the CMS (would be created): ${diff.summary.sectionsMissingInOurs.join(', ') || 'none'}`);
  L.push(`- CMS sections not on live: ${diff.summary.sectionsOnlyInOurs.join(', ') || 'none'}`, '');
  L.push('| Live page | Our slug | Name (ours -> live) | Live docs | Matched URL / title | Live-only | CMS-only | Title diffs | Link diffs | Order diffs |', '|---|---|---|---|---|---|---|---|---|---|');
  for (const s of diff.sections) {
    const d = s.docs;
    L.push(`| /${s.livePath} | ${s.ours}${s.folder === 'new' ? ' (new)' : ''} | ${s.nameDiff ? `${s.nameDiff.ours} -> ${s.nameDiff.live}` : (s.folder === 'new' ? `new: ${s.heading}` : 'same')} | ${d.liveCount} | ${d.matchedByUrl} / ${d.matchedByTitle} | ${d.liveOnly.length} | ${d.oursOnly.length} | ${d.titleDiffs.length} | ${d.linkDiffs.length} | ${d.orderDiffs.length} |`);
  }
  for (const s of diff.sections) {
    const d = s.docs;
    L.push('', `## /${s.livePath}  ->  /investors/${s.ours}`, '', `Live heading: ${s.heading}`);
    for (const f of s.flags) L.push(`- FLAG: ${f}`);
    for (const t of s.intro || []) L.push(`- live text before the first link (intro or an unlinked item; not imported, no document created): ${t}`);
    for (const t of s.unlinked) L.push(`- live text with no link (no document created): ${t}`);
    for (const x of d.liveDuplicateUrls) L.push(`- live lists the same file twice (second one not imported): "${x.title}" ${x.url}`);
    if (d.titleDiffs.length) { L.push('', 'Title differences (ours -> live):'); for (const t of d.titleDiffs) L.push(`- ${t.ours}  ->  ${t.live}`); }
    if (d.linkDiffs.length) { L.push('', 'Links that differ:'); for (const t of d.linkDiffs) L.push(`- ${t.title}: ${t.ours}  ->  ${t.live}${t.stored ? '  (file stored; fallback only)' : ''}`); }
    if (d.fyDiffs.length) { L.push('', 'Group / FY differences:'); for (const t of d.fyDiffs) L.push(`- ${t.title}: ${t.ours || '(none)'} -> ${t.live}`); }
    if (d.liveOnly.length) { L.push('', 'Live only (new):'); for (const t of d.liveOnly) L.push(`- ${t.group ? `[${t.group}] ` : ''}${t.title}  ${t.url}${t.status && t.status !== 200 ? `  (HTTP ${t.status})` : ''}`); }
    if (d.oursOnly.length) { L.push('', 'CMS only (kept):'); for (const t of d.oursOnly) L.push(`- ${t.title}  [${t.linkStatus}${t.stored ? ', stored file' : ''}]${t.possibleLive ? `  possible live match: "${t.possibleLive.title}" (${t.possibleLive.score})` : ''}`); }
  }
  fs.writeFileSync(path.join(OUT_DIR, `${base}.md`), L.join('\n') + '\n');
}

// ------------------------------------------------------------------ SEBI LODR table
async function lodrContext(client, manifest) {
  const folders = new Map((await client.query('SELECT id, slug, visible FROM document_folders')).rows.map((r) => [r.id, r]));
  const docs = (await client.query(`SELECT d.slug, d.folder_id, d.external_url, d.status, d.title FROM documents d ORDER BY d.sort_order`)).rows;
  const byKey = new Map();
  for (const d of docs) {
    const f = folders.get(d.folder_id);
    if (!f || !f.visible || d.status !== 'published' || !d.external_url) continue;
    const k = urlKey(d.external_url);
    if (!byKey.has(k)) byKey.set(k, `/investors/${f.slug}/${d.slug}`);
  }
  const sectionByPath = new Map(manifest.sections.map((s) => [s.livePath, s.ours]));
  return { byKey, sectionByPath, folderSlugs: new Set([...folders.values()].map((f) => f.slug)) };
}
/** A table link to a PDF whose file id we do not have may still be the SAME file uploaded twice (usrfiles vs _files, other id).
 *  Equal size alone is a hint, not proof: download both and compare SHA-256. Result cached on the link in the manifest. */
async function resolveHashes(manifest) {
  const s = manifest.sections.find((x) => x.livePath === 'sebi-lodr');
  const docs = [];
  for (const sec of manifest.sections) for (const g of sec.groups) for (const d of g.docs) docs.push(d);
  const known = new Set(docs.map((d) => urlKey(d.url)));
  const sha = async (u) => { const r = await polite(u); if (!r.ok) throw new Error(`HTTP ${r.status}`); return crypto.createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex'); };
  let changed = false;
  for (const r of s.lodr.rows) for (const l of r.links) {
    if (l.hashChecked || !/^https?:/.test(l.href) || isSitePage(l.href) || known.has(urlKey(l.href))) continue;
    const size = manifest.checks?.[l.href]?.size;
    l.hashChecked = true; changed = true;
    if (!size) continue;
    const cands = docs.filter((d) => manifest.checks?.[d.url]?.size === size);
    if (!cands.length) continue;
    try {
      const h = await sha(l.href);
      for (const d of cands) if ((await sha(d.url)) === h) { l.sameFileAs = d.url; log(`  table row ${r.sr}: same bytes as "${d.title}"`); break; }
    } catch (e) { l.hashChecked = false; log(`  hash check skipped for row ${r.sr}: ${e.message}`); }
  }
  if (changed) fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
}
function mapLodrLink(l, ctx) {
  const out = { href: l.href, label: l.label };
  const notes = [];
  if (/^mailto:/i.test(l.href)) return { link: out, notes };
  let u; try { u = new URL(l.href); } catch { return { link: out, notes: ['unparseable href kept'] }; }
  const p = u.pathname.replace(/^\/+|\/+$/g, '');
  if (/(^|\.)kotyark\.com$/.test(u.hostname) && !u.pathname.startsWith('/_files')) {
    if (p === 'about-us') out.href = '/about';
    else if (p === 'contact') out.href = '/contact';
    else if (p === '') out.href = '/';
    else if (ctx.sectionByPath.has(p)) out.href = `/investors/${ctx.sectionByPath.get(p)}`;
    else notes.push(`no section for live page /${p}; kept as the live URL`);
  } else {
    const k = urlKey(l.href);
    if (ctx.byKey.has(k)) out.href = ctx.byKey.get(k);
    else if (l.sameFileAs && ctx.byKey.has(urlKey(l.sameFileAs))) { out.href = ctx.byKey.get(urlKey(l.sameFileAs)); notes.push(`same file (identical SHA-256) as the CMS document ${out.href}`); }
    else notes.push('PDF not in the CMS as a document; kept as the live URL');
  }
  if (l.check && l.check.status !== 200) { out.broken = true; notes.push(`BROKEN on live: HTTP ${l.check.status || 'error'} (checked ${String(l.check.checkedAt).slice(0, 10)})`); }
  return { link: out, notes };
}
const linkSrc = (l) => `{ href: ${esc1(l.href)}, label: ${esc1(l.label)}${l.broken ? ', broken: true' : ''} }`;
async function writeLodr(client, manifest) {
  const s = manifest.sections.find((x) => x.livePath === 'sebi-lodr');
  if (!s?.lodr?.rows?.length) throw new Error('manifest has no SEBI table; run with --fetch');
  await resolveHashes(manifest);
  const ctx = await lodrContext(client, manifest);
  const out = [];
  out.push(
    '// Regulation 46(2) SEBI (LODR) disclosure table for /investors/sebi-lodr.',
    '// CONTRACT: rows of { sr, particular, regulation, status, details, links: [{ href, label, broken? }], parentSr?, indent? }.',
    '//   sr / particular / labels are verbatim from the live kotyark.com table (an embedded HTML file on the Wix page).',
    "//   regulation and status are '' : the live table has only SR. NO. / PARTICULARS / DETAILS, so none is invented.",
    '//   details: plain text lines of the live DETAILS cell that are not links ("-" when it shows a dash; the contact name,',
    '//   designation and e-mail for rows 10 and 11). links: every link of the DETAILS cell, in order.',
    '//   Sub-rows (live rows 12 and 23 have rowspan groups): sr is empty, parentSr names the numbered row, indent is true.',
    '//   hrefs are internal paths (/investors/<section>, /investors/<section>/<doc>, /about, /contact); a link that has no',
    '//   internal destination stays an absolute URL. broken: true marks a link the live site itself answers with non-200.',
    `// Generated by scripts/sync-live-ir.mjs --write-lodr from the live table crawled ${manifest.crawledAt}. Do not hand-edit; regenerate.`,
    `// Source: ${s.lodr.sourceUrl}`,
    'export const SEBI_LODR_ROWS = [');
  const bad = [];
  for (const r of s.lodr.rows) {
    const mapped = r.links.map((l) => mapLodrLink(l, ctx));
    for (const m of mapped) for (const n of m.notes) { out.push(`  // row ${r.sr || `${r.parentSr}.`}: ${n} (${m.link.label} -> ${m.link.href})`); if (/BROKEN/.test(n)) bad.push({ sr: r.sr || r.parentSr, href: m.link.href }); }
    const f = [`sr: ${esc1(r.sr)}`];
    if (r.parentSr) f.push(`parentSr: ${esc1(r.parentSr)}`);
    if (r.indent) f.push('indent: true');
    f.push(`particular: ${esc1(r.particular)}`, "regulation: ''", "status: ''", `details: [${r.details.map(esc1).join(', ')}]`, `links: [${mapped.map((m) => linkSrc(m.link)).join(', ')}]`);
    out.push(`  { ${f.join(', ')} },`);
  }
  out.push('];', '');
  fs.writeFileSync(LODR_FILE, out.join('\n'));
  log(`Wrote ${path.relative(ROOT, LODR_FILE)}: ${s.lodr.rows.length} rows; ${bad.length} broken link(s) flagged.`);
}
async function verifyLodr(client) {
  const src = fs.readFileSync(LODR_FILE, 'utf8');
  const mod = await import(`${new URL(`file://${LODR_FILE}`).href}?t=${Date.now()}`);
  const rows = mod.SEBI_LODR_ROWS;
  const folders = new Map((await client.query('SELECT id, slug, visible FROM document_folders')).rows.map((r) => [r.slug, r]));
  const pages = new Map((await client.query('SELECT path, status FROM pages')).rows.map((r) => [r.path, r.status]));
  const docs = new Map((await client.query(`SELECT d.slug, d.status, f.slug AS folder_slug, f.visible FROM documents d JOIN document_folders f ON f.id=d.folder_id`)).rows.map((r) => [`${r.folder_slug}/${r.slug}`, r]));
  let ok = 0; const fail = []; const warn = [];
  for (const r of rows) for (const l of r.links) {
    const h = l.href;
    let res = null;
    if (/^(https?:|mailto:)/.test(h)) { ok++; continue; }
    let m;
    if ((m = /^\/investors\/([^/]+)$/.exec(h))) res = folders.get(m[1])?.visible ? 'ok' : 'no visible folder';
    else if ((m = /^\/investors\/([^/]+)\/([^/]+)$/.exec(h))) { const d = docs.get(`${m[1]}/${m[2]}`); res = d && d.status === 'published' && d.visible ? 'ok' : 'no published document'; }
    else if (pages.has(h)) { res = 'ok'; if (pages.get(h) !== 'published') warn.push(`${h} is a CMS page with status ${pages.get(h)}: it resolves only once published (sr ${r.sr || r.parentSr})`); }
    else res = 'no such CMS page';
    if (res === 'ok') ok++; else fail.push(`${r.sr || r.parentSr}: ${h}  ${res}`);
  }
  log(`SEBI table hrefs: ${ok} resolve, ${fail.length} do not.`);
  for (const f of fail) log('  FAIL', f);
  for (const w of [...new Set(warn)]) log('  note', w);
  void src;
  return fail.length;
}

// ------------------------------------------------------------------ main
async function main() {
  let manifest;
  if (FETCH) {
    manifest = await crawl();
    if (!has('--no-check')) await checkAll(manifest);
    else if (fs.existsSync(MANIFEST)) manifest.checks = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')).checks || {};
    annotateChecks(manifest);
    fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
    log(`Manifest: ${path.relative(ROOT, MANIFEST)}`);
  } else {
    if (!fs.existsSync(MANIFEST)) { console.error(`No manifest at ${MANIFEST}. Run with --fetch first.`); process.exit(1); }
    manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
    log(`Using saved manifest (crawled ${manifest.crawledAt}).`);
  }
  if (!FETCH) annotateChecks(manifest);

  const client = await connect();
  try {
    if (has('--verify-lodr')) { const n = await verifyLodr(client); await client.end(); process.exit(n ? 1 : 0); }
    if (has('--write-lodr')) { await writeLodr(client, manifest); const n = await verifyLodr(client); await client.end(); process.exit(n ? 1 : 0); }

    await client.query('BEGIN');
    const p = await plan(client, manifest);
    writeDiff(p.diff, manifest, p.ops.length === 0);
    const { counts, lines } = await execute(client, p);
    if (APPLY) await client.query('COMMIT'); else await client.query('ROLLBACK');
    console.log(`\n${APPLY ? 'APPLIED' : 'DRY RUN (nothing written)'}: ${lines.length} change(s)\n`);
    for (const l of lines) console.log('  ' + l);
    console.log(`\n${APPLY ? 'Result' : 'Plan'} per table (inserted / updated):`);
    for (const [t, c] of Object.entries(counts)) console.log(`  ${t.padEnd(17)} ${String(c.inserted).padStart(4)} / ${String(c.updated ?? 0).padStart(4)}`);
    const sum = p.diff.sections.reduce((a, s) => ({ live: a.live + s.docs.liveCount, mUrl: a.mUrl + s.docs.matchedByUrl, mTitle: a.mTitle + s.docs.matchedByTitle, liveOnly: a.liveOnly + s.docs.liveOnly.length, oursOnly: a.oursOnly + s.docs.oursOnly.length, titles: a.titles + s.docs.titleDiffs.length, links: a.links + s.docs.linkDiffs.length }), { live: 0, mUrl: 0, mTitle: 0, liveOnly: 0, oursOnly: 0, titles: 0, links: 0 });
    console.log(`\nSections: ${p.diff.sections.length}  live docs: ${sum.live}  matched by URL/title: ${sum.mUrl}/${sum.mTitle}  retitled: ${sum.titles}  relinked: ${sum.links}  live-only: ${sum.liveOnly}  CMS-only: ${sum.oursOnly}`);
    const flags = p.diff.sections.flatMap((s) => s.flags.map((f) => `[${s.ours}] ${f}`));
    if (flags.length) { console.log(`\nFlags (${flags.length}):`); for (const f of flags) console.log('  ' + f); }
    console.log(`\nDiff: ${path.relative(ROOT, OUT_DIR)}/diff.md (diff-in-sync.md when nothing changes)`);
    await client.end();
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch { /* ignore */ }
    console.error('sync:ir failed, rolled back:', e.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}
await main();
