// Pure helpers for the investor pages. No Wix imports: unit-tested in Node (wix/test/lib.test.mjs).

export const FALLBACK_ORIGIN = 'https://kotyark.com';

/**
 * Turns a Media Manager URL (wix:document://v1/ugd/<id>.pdf/<name>.pdf#...) into a public https URL.
 * Plain http(s) URLs are returned unchanged; anything unrecognised comes back as-is.
 * Needed for JSON-LD, where `wix:` URLs are meaningless to crawlers.
 */
export function documentUrlToHttp(url, origin = FALLBACK_ORIGIN) {
  if (!url || typeof url !== 'string') return '';
  if (/^https?:\/\//i.test(url)) return url;
  const m = url.match(/^wix:document:\/\/v1\/([a-z0-9]+)\/([^/#?]+)/i);
  if (!m) return url;
  return `${origin.replace(/\/$/, '')}/_files/${m[1]}/${m[2]}`;
}

/**
 * Decides what a document row should render.
 *   file present            -> { state: 'file',     url }   (Document field wins)
 *   legacyUrl, not broken   -> { state: 'legacy',   url }   (ok / unchecked)
 *   everything else         -> { state: 'updating', url: '' } ("file being updated", no link)
 */
export function resolveDocLink(doc, origin = FALLBACK_ORIGIN) {
  if (doc && doc.file) return { state: 'file', url: documentUrlToHttp(doc.file, origin), rawUrl: doc.file };
  if (doc && doc.legacyUrl && doc.linkStatus !== 'broken') return { state: 'legacy', url: doc.legacyUrl, rawUrl: doc.legacyUrl };
  return { state: 'updating', url: '', rawUrl: '' };
}

const bySortOrder = (a, b) => (a.sortOrder ?? 1e9) - (b.sortOrder ?? 1e9);

/** "FY 2024-25" -> 2024 (for ordering); unparseable -> -1. */
export function fyStartYear(fy) {
  const m = /(\d{4})/.exec(fy || '');
  return m ? Number(m[1]) : -1;
}

/**
 * Groups documents for the nested repeater. Always returns [{ _id, title, docs }].
 *   groupBy 'fy'  -> one group per financial year, newest first; documents with no FY go last as "Other documents".
 *   otherwise     -> a single group with an empty title (the page hides the group header).
 * Documents inside a group are ordered by sortOrder.
 */
export function groupDocuments(docs, groupBy) {
  const list = (docs || []).slice().sort(bySortOrder);
  if (groupBy !== 'fy') return [{ _id: 'all', title: '', docs: list }];
  const map = new Map();
  for (const d of list) {
    const key = d.fy ? d.fy : '__other';
    if (!map.has(key)) map.set(key, { _id: 'fy-' + (d.fy ? d.fy.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'other'), title: d.fy || 'Other documents', docs: [], fyKey: key });
    map.get(key).docs.push(d);
  }
  return [...map.values()]
    .sort((a, b) => {
      if (a.fyKey === '__other') return 1;
      if (b.fyKey === '__other') return -1;
      return fyStartYear(b.fyKey) - fyStartYear(a.fyKey);
    })
    .map(({ fyKey, ...g }) => g);
}

/** Sidebar items: visibleInMenu only, sortOrder asc, with the current one flagged. */
export function buildSidebar(sections, currentSlug) {
  return (sections || [])
    .filter((s) => s.visibleInMenu !== false)
    .slice()
    .sort(bySortOrder)
    .map((s) => ({ _id: s._id, title: s.title, slug: s.slug, url: `/investors/${s.slug}`, isCurrent: s.slug === currentSlug }));
}

const HUB_GROUPS = [
  { key: 'Regulatory Filings', tag: 'Regulatory', description: 'Mandatory filings and disclosures as per SEBI Listing Obligations and Disclosure Requirements (LODR).' },
  { key: 'Financial Statements', tag: 'Financial', description: 'Annual and quarterly financial reports, including audited statements and subsidiary financials.' },
  { key: 'Corporate Governance', tag: 'Governance', description: 'Company constitution, policies, and governance framework ensuring transparency and compliance.' },
  { key: 'Other Filings', tag: 'Other', description: 'Additional regulatory filings, postal ballots, and dispute resolution.' },
];

/** Hub page: sections bucketed by hubGroup in the reference order; each card links to /investors/<slug>. */
export function buildHubGroups(sections) {
  const known = new Set(HUB_GROUPS.map((g) => g.key));
  const groups = HUB_GROUPS.map((g) => ({ _id: g.key.toLowerCase().replace(/[^a-z0-9]+/g, '-'), title: g.key, tag: g.tag, description: g.description, sections: [] }));
  const other = groups[groups.length - 1];
  for (const s of (sections || []).slice().sort((a, b) => (a.hubOrder ?? 1e9) - (b.hubOrder ?? 1e9) || bySortOrder(a, b))) {
    const g = known.has(s.hubGroup) ? groups.find((x) => x.title === s.hubGroup) : other;
    g.sections.push({ _id: s._id, title: s.title, description: s.description, url: `/investors/${s.slug}` });
  }
  return groups.filter((g) => g.sections.length);
}

/** Reg 46 rows for the table repeater: blank linkUrl means "NA". */
export function buildReg46Rows(items) {
  return (items || []).slice().sort(bySortOrder).map((r) => ({
    _id: r._id,
    srNo: r.srNo,
    particular: r.particular,
    regulation: r.regulation,
    linkUrl: r.linkUrl ? r.linkUrl : '',
    hasLink: Boolean(r.linkUrl),
  }));
}

/** Date for display (UTC, so a noon-UTC import never slips a day). */
export function formatDocDate(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
