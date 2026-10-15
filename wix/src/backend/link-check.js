// Server module (plain .js, importable from jobs.js and link-check.web.js). Not exposed to the browser.
import wixData from 'wix-data';
import { fetch } from 'wix-fetch';

const COLLECTION = 'InvestorDocuments';
const OPTS = { suppressAuth: true }; // runs from a scheduled job / admin web method

async function probe(url) {
  // HEAD first; some CDNs reject HEAD, so retry once with GET.
  for (const method of ['head', 'get']) {
    try {
      const res = await fetch(url, { method, redirect: 'follow' });
      if (res.ok) return 'ok';
      if (method === 'head' && (res.status === 403 || res.status === 405 || res.status === 501)) continue;
      return 'broken';
    } catch (e) {
      if (method === 'get') return 'broken';
    }
  }
  return 'broken';
}

/** Checks every published document that has a legacyUrl and no uploaded file; updates linkStatus if it changed. */
export async function checkAllLinks() {
  const items = [];
  let page = await wixData.query(COLLECTION).eq('published', true).limit(1000).find(OPTS);
  items.push(...page.items);
  while (page.hasNext()) { page = await page.next(); items.push(...page.items); }

  const todo = items.filter((d) => d.legacyUrl && !d.file);
  const summary = { checked: 0, changed: 0, ok: 0, broken: 0 };
  for (let i = 0; i < todo.length; i += 5) { // small batches: stay polite to the file server
    await Promise.all(todo.slice(i, i + 5).map(async (d) => {
      const status = await probe(d.legacyUrl);
      summary.checked++;
      summary[status]++;
      if (d.linkStatus !== status) {
        await wixData.update(COLLECTION, { ...d, linkStatus: status }, OPTS);
        summary.changed++;
      }
    }));
  }
  return summary;
}
