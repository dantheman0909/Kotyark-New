// SEO verifier. Usage: BASE_URL=http://localhost:5000 [SITE_URL=https://www.kotyark.com] node scripts/verify-seo.mjs
// Fetches /sitemap.xml, rewrites the production host to BASE_URL and checks every URL.
const BASE_URL = (process.env.BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
const SITE_URL = (process.env.SITE_URL || 'https://www.kotyark.com').replace(/\/$/, '');
const SITE_HOST = new URL(SITE_URL).host;

const results = [];
let failures = 0;

function rec(label, problems) {
  results.push({ label, problems });
  if (problems.length) failures++;
}

const decode = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'");
const count = (re, s) => (s.match(re) || []).length;

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'));
  return m ? decode(m[2] ?? m[3]) : null;
}

function checkHtml(html) {
  const problems = [];
  const titles = count(/<title[\s>]/gi, html);
  if (titles !== 1) problems.push(`<title> x${titles}`);
  else if (!/<title[^>]*>\s*\S[\s\S]*?<\/title>/i.test(html)) problems.push('empty <title>');

  const metas = html.match(/<meta\b[^>]*>/gi) || [];
  const desc = metas.find(t => (attr(t, 'name') || '').toLowerCase() === 'description');
  if (!desc || !(attr(desc, 'content') || '').trim()) problems.push('no meta description');

  const links = html.match(/<link\b[^>]*>/gi) || [];
  const canon = links.filter(t => (attr(t, 'rel') || '').toLowerCase() === 'canonical');
  if (canon.length !== 1) problems.push(`canonical x${canon.length}`);
  else {
    try {
      const host = new URL(attr(canon[0], 'href') || '', SITE_URL).host;
      if (host !== SITE_HOST) problems.push(`canonical host ${host}`);
    } catch { problems.push('canonical unparseable'); }
  }

  const h1 = count(/<h1[\s>]/gi, html);
  if (h1 !== 1) problems.push(`<h1> x${h1}`);

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
  return problems;
}

async function main() {
  const sm = await fetch(`${BASE_URL}/sitemap.xml`);
  if (!sm.ok) { console.error(`sitemap.xml -> ${sm.status}`); process.exit(1); }
  const xml = await sm.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x => decode(x[1].trim()));
  if (!locs.length) { console.error('sitemap.xml has no <loc> entries'); process.exit(1); }

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
          problems.push(...checkHtml(await res.text()));
        } else {
          await res.body?.cancel();
        }
      }
    } catch (e) {
      problems.push(`fetch failed: ${e.message}`);
    }
    rec(u.pathname + u.search, problems);
  }

  // robots.txt
  try {
    const r = await fetch(`${BASE_URL}/robots.txt`);
    const t = await r.text();
    const problems = [];
    if (r.status !== 200) problems.push(`status ${r.status}`);
    if (!/^\s*disallow:\s*\/admin\b/im.test(t) && !/^\s*disallow:\s*\/\s*$/im.test(t)) problems.push('/admin not disallowed');
    if (/^\s*disallow:\s*\/\s*$/im.test(t)) console.log('note: robots.txt disallows everything (non-production host); expected in dev');
    rec('/robots.txt', problems);
  } catch (e) { rec('/robots.txt', [`fetch failed: ${e.message}`]); }

  const w = Math.min(70, Math.max(...results.map(r => r.label.length)));
  console.log(`\nBASE_URL=${BASE_URL}  SITE_URL=${SITE_URL}\n`);
  for (const r of results) {
    console.log(`${r.problems.length ? 'FAIL' : 'ok  '}  ${r.label.padEnd(w)}  ${r.problems.join('; ')}`);
  }
  console.log(`\n${results.length - failures}/${results.length} passed`);
  process.exit(failures ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
