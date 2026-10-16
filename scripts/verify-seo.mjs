// SEO + LLM-discoverability verifier.
// Usage: BASE_URL=http://localhost:5000 [SITE_URL=https://www.kotyark.com] node scripts/verify-seo.mjs
//
// Fetches /sitemap.xml, rewrites the production host to BASE_URL and checks every URL, then llms.txt,
// llms-full.txt, robots.txt, noindex on private routes and the web manifest. Prints a pass/fail table and
// exits non-zero on any failure.
//
// --nojs note: every public page is a Server Component, so a plain fetch() of the HTML is exactly what a
// crawler that does not run JavaScript sees. The "raw HTML copy" check below therefore doubles as a no-JS test.
//
// Production-only checks (robots allow groups) are skipped with a note when robots.txt disallows everything,
// i.e. on a non-production host. To exercise them locally run the server with REPLIT_DEPLOYMENT=1 and
// SITE_URL=<the same base URL> so canonicals are self-referencing.
const BASE_URL = (process.env.BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
const SITE_URL = (process.env.SITE_URL || 'https://www.kotyark.com').replace(/\/$/, '');
const SITE_HOST = new URL(SITE_URL).host;

const results = [];
const notes = [];
let failures = 0;

function rec(label, problems) {
  results.push({ label, problems });
  if (problems.length) failures++;
}

const decode = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&nbsp;/g, ' ');
const count = (re, s) => (s.match(re) || []).length;

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'));
  return m ? decode(m[2] ?? m[3]) : null;
}

/** Visible-ish text: scripts/styles removed, tags replaced by spaces, entities decoded, whitespace collapsed. */
function textOf(html) {
  return decode(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
}

const MARKETING = ['/', '/about', '/products', '/products/biodiesel', '/products/crude-glycerin', '/contact', '/investors'];

// Two sentences (case-insensitive) per marketing page that must be in the raw server-rendered HTML.
const COPY = {
  '/': ['not drilled', 'non-edible vegetable oils'],
  '/products': ['closed loop', 'trans-esterification'],
  '/products/biodiesel': ['mono alkyl ester', 'Bio-Fuel Authority'],
  '/products/crude-glycerin': ['crude glycerin', 'food processing'],
  '/about': ['Measured in kilolitres', 'Gaurang'],
  '/contact': ['info@kotyark.com', 'RIICO Industrial Area'],
  '/investors': ['in the open', 'SEBI'],
};

const ogImages = new Map(); // og:image URL -> problem string | ''

async function checkOgImage(url) {
  if (ogImages.has(url)) return ogImages.get(url);
  let problem = '';
  try {
    const u = new URL(url);
    const res = await fetch(`${BASE_URL}${u.pathname}${u.search}`);
    const ct = res.headers.get('content-type') || '';
    if (res.status !== 200) problem = `og:image ${u.pathname} -> ${res.status}`;
    else if (!ct.startsWith('image/')) problem = `og:image ${u.pathname} content-type ${ct}`;
    await res.body?.cancel();
  } catch (e) { problem = `og:image fetch failed: ${e.message}`; }
  ogImages.set(url, problem);
  return problem;
}

async function checkHtml(html, pathname) {
  const problems = [];
  const titles = count(/<title[\s>]/gi, html);
  if (titles !== 1) problems.push(`<title> x${titles}`);
  else {
    const t = decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '').trim();
    if (!t) problems.push('empty <title>');
    else if (t.length < 30 || t.length > 65) problems.push(`title ${t.length} chars (want 30-65)`);
  }

  const metas = html.match(/<meta\b[^>]*>/gi) || [];
  const meta = (key, by = 'name') => metas.find(t => (attr(t, by) || '').toLowerCase() === key);
  const desc = meta('description');
  const dl = desc ? (attr(desc, 'content') || '').trim().length : 0;
  if (!dl) problems.push('no meta description');
  else if (dl < 70 || dl > 170) problems.push(`description ${dl} chars (want 70-170)`);

  const links = html.match(/<link\b[^>]*>/gi) || [];
  const canon = links.filter(t => (attr(t, 'rel') || '').toLowerCase() === 'canonical');
  if (canon.length !== 1) problems.push(`canonical x${canon.length}`);
  else {
    try {
      const c = new URL(attr(canon[0], 'href') || '', SITE_URL);
      if (c.host !== SITE_HOST) problems.push(`canonical host ${c.host}`);
      else if (c.pathname.replace(/\/$/, '') !== pathname.replace(/\/$/, '')) problems.push(`canonical not self-referencing (${c.pathname})`);
    } catch { problems.push('canonical unparseable'); }
  }

  for (const k of ['og:title', 'og:description', 'og:image']) {
    const m = meta(k, 'property');
    if (!m || !(attr(m, 'content') || '').trim()) problems.push(`no ${k}`);
  }
  const tw = meta('twitter:image') || meta('twitter:image', 'property');
  if (!tw) problems.push('no twitter:image');
  const og = meta('og:image', 'property');
  if (og && attr(og, 'content')) { const p = await checkOgImage(attr(og, 'content')); if (p) problems.push(p); }

  const robots = meta('robots');
  if (robots && /noindex/i.test(attr(robots, 'content') || '')) problems.push('noindex on a public page');

  if (!/<html\b[^>]*\blang\s*=\s*["']en-IN["']/i.test(html)) problems.push('html lang is not en-IN');

  const h1 = count(/<h1[\s>]/gi, html);
  if (h1 !== 1) problems.push(`<h1> x${h1}`);

  for (const img of html.match(/<img\b[^>]*>/gi) || []) {
    if (attr(img, 'alt') === null) { problems.push(`img without alt (${(attr(img, 'src') || '').slice(0, 40)})`); break; }
  }

  const re = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      const j = JSON.parse(m[1]);
      for (const item of Array.isArray(j) ? j : [j]) {
        if (!item['@context'] || !item['@type']) problems.push('JSON-LD missing @context/@type');
      }
    } catch { problems.push('JSON-LD does not parse'); }
  }

  if (pathname === '/') {
    for (const p of ['/products', '/investors', '/about', '/contact']) {
      const re2 = new RegExp(`<a\\b[^>]*\\bhref\\s*=\\s*["'](?:${SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})?${p}/?["']`, 'i');
      if (!re2.test(html)) problems.push(`home has no <a href="${p}">`);
    }
  }

  if (MARKETING.includes(pathname)) {
    if (/\bBSE\b(?! SME)/.test(textOf(html))) problems.push('mentions "BSE" outside the BSE SME listing history (exchange is NSE)');
    const txt = textOf(html).toLowerCase();
    for (const s of COPY[pathname] || []) if (!txt.includes(s.toLowerCase())) problems.push(`raw HTML lacks "${s}"`);
  }
  return problems;
}

async function main() {
  const sm = await fetch(`${BASE_URL}/sitemap.xml`);
  if (!sm.ok) { console.error(`sitemap.xml -> ${sm.status}`); process.exit(1); }
  const xml = await sm.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x => decode(x[1].trim()));
  if (!locs.length) { console.error('sitemap.xml has no <loc> entries'); process.exit(1); }
  const sitePaths = new Set();

  for (const loc of locs) {
    const u = new URL(loc);
    const problems = [];
    if (u.host !== SITE_HOST) problems.push(`sitemap host ${u.host} is not ${SITE_HOST}`);
    const target = `${BASE_URL}${u.pathname}${u.search}`;
    try {
      const res = await fetch(target, { redirect: 'manual' });
      if (res.status !== 200) problems.push(`status ${res.status}`);
      else {
        const ct = res.headers.get('content-type') || '';
        if (u.pathname.startsWith('/files/') && u.pathname.endsWith('.pdf')) {
          if (!ct.includes('application/pdf')) problems.push(`content-type ${ct || '(none)'}`);
          await res.body?.cancel();
        } else if (ct.includes('text/html')) {
          if (!u.pathname.startsWith('/files/')) sitePaths.add(u.pathname);
          problems.push(...await checkHtml(await res.text(), u.pathname));
        } else {
          await res.body?.cancel();
        }
      }
    } catch (e) {
      problems.push(`fetch failed: ${e.message}`);
    }
    rec(u.pathname + u.search, problems);
  }

  // Marketing pages must be in the sitemap.
  rec('sitemap: marketing pages listed', MARKETING.filter(p => !locs.some(l => new URL(l).pathname === p)).map(p => `missing ${p}`));

  // robots.txt
  let robotsText = '';
  try {
    const r = await fetch(`${BASE_URL}/robots.txt`);
    robotsText = await r.text();
    const problems = [];
    if (r.status !== 200) problems.push(`status ${r.status}`);
    const blocksAll = /^\s*disallow:\s*\/\s*$/im.test(robotsText);
    if (!blocksAll && !/^\s*disallow:\s*\/admin\b/im.test(robotsText)) problems.push('/admin not disallowed');
    if (!blocksAll) {
      for (const d of ['/api/', '/preview/']) if (!new RegExp(`^\\s*disallow:\\s*${d}`, 'im').test(robotsText)) problems.push(`${d} not disallowed`);
      if (!/^\s*sitemap:\s*\S+/im.test(robotsText)) problems.push('no Sitemap line');
      for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) {
        if (!new RegExp(`^\\s*user-agent:\\s*${bot}\\s*$`, 'im').test(robotsText)) problems.push(`no ${bot} group`);
      }
    } else notes.push('robots.txt disallows everything (non-production host): AI crawler allow-group checks skipped.');
    rec('/robots.txt', problems);
  } catch (e) { rec('/robots.txt', [`fetch failed: ${e.message}`]); }

  // Private routes: noindex (header or meta) or disallowed in robots.txt.
  for (const p of ['/admin', '/login', '/preview/x']) {
    const problems = [];
    try {
      const res = await fetch(`${BASE_URL}${p}`, { redirect: 'manual' });
      const body = res.status < 300 ? await res.text() : '';
      const header = /noindex/i.test(res.headers.get('x-robots-tag') || '');
      const metaTag = /<meta[^>]+name=["']robots["'][^>]*noindex/i.test(body);
      const disallowed = new RegExp(`^\\s*disallow:\\s*(${p.replace(/\/x$/, '/')}|/)\\s*$`, 'im').test(robotsText);
      const redirected = res.status >= 300 && res.status < 400; // /admin bounces to /login: never rendered anonymously
      if (!(header || metaTag || disallowed || redirected)) problems.push('no noindex and not robots-disallowed');
    } catch (e) { problems.push(`fetch failed: ${e.message}`); }
    rec(`private: ${p}`, problems);
  }

  // LLM files.
  for (const f of ['/llms.txt', '/llms-full.txt']) {
    const problems = [];
    try {
      const res = await fetch(`${BASE_URL}${f}`);
      const body = await res.text();
      const ct = res.headers.get('content-type') || '';
      if (res.status !== 200) problems.push(`status ${res.status}`);
      if (!ct.startsWith('text/plain')) problems.push(`content-type ${ct || '(none)'}`);
      if (!body.startsWith('# ')) problems.push('does not start with "# "');
      if (f === '/llms.txt' && !/^> /m.test(body)) problems.push('no ">" summary');
      const need = locs.map(l => new URL(l)).filter(u => /^\/(investors|products)(\/|$)/.test(u.pathname) || ['/', '/about', '/contact'].includes(u.pathname)).filter(u => !u.pathname.startsWith('/files/'));
      // llms.txt lists pages and folders (not every document); llms-full.txt lists documents too.
      const missing = need.filter(u => {
        const abs = `${SITE_URL}${u.pathname === '/' ? '' : u.pathname}`;
        const isDoc = /^\/investors\/[^/]+\/[^/]+$/.test(u.pathname);
        if (f === '/llms.txt' && isDoc) return false;
        return !body.includes(abs);
      });
      if (missing.length) problems.push(`missing ${missing.length} URL(s), e.g. ${missing[0].pathname}`);
      // Legal-record titles and folder descriptions (after the disclosures heading) may name BSE; the copy above may not.
      if (/\bBSE\b(?! SME)/.test(body.split('## Investor disclosures')[0])) problems.push('mentions "BSE" in the marketing copy (exchange is NSE)');
    } catch (e) { problems.push(`fetch failed: ${e.message}`); }
    rec(f, problems);
  }

  // Web manifest.
  try {
    const res = await fetch(`${BASE_URL}/manifest.webmanifest`);
    const problems = [];
    if (res.status !== 200) problems.push(`status ${res.status}`);
    else {
      const j = await res.json();
      if (j.name !== 'Kotyark Industries Limited' || !j.icons?.length) problems.push('manifest incomplete');
    }
    rec('/manifest.webmanifest', problems);
  } catch (e) { rec('/manifest.webmanifest', [`fetch failed: ${e.message}`]); }

  const w = Math.min(70, Math.max(...results.map(r => r.label.length)));
  console.log(`\nBASE_URL=${BASE_URL}  SITE_URL=${SITE_URL}\n`);
  for (const r of results) {
    console.log(`${r.problems.length ? 'FAIL' : 'ok  '}  ${r.label.padEnd(w)}  ${r.problems.join('; ')}`);
  }
  for (const n of notes) console.log(`note: ${n}`);
  console.log(`\n${results.length - failures}/${results.length} passed`);
  process.exit(failures ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
