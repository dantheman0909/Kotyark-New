#!/usr/bin/env node
// Generates the Wix CMS import CSVs from the verbatim content snapshot + link audit.
// Usage: node wix/data/build-collections.mjs        (no dependencies)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT = join(here, 'source', 'content-snapshot.json');
const AUDIT = join(here, 'source', 'link-audit-2026-10-15.csv');
const OUT = join(here, 'collections');

const snap = JSON.parse(readFileSync(SNAPSHOT, 'utf8'));

// ---------- CSV helpers (RFC 4180) ----------
function csvCell(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCsv(headers, rows) {
  return [headers.join(','), ...rows.map((r) => headers.map((h) => csvCell(r[h])).join(','))].join('\n') + '\n';
}
function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}
const escHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------- Hub layout (from src/app/investors/page.js: group + card order) ----------
const HUB = {
  'sebi-lodr': ['Regulatory Filings', 1],
  'board-meetings': ['Regulatory Filings', 2],
  'closing-trading-window': ['Regulatory Filings', 3],
  'misc-sebi-disclosure': ['Regulatory Filings', 4],
  'annual-general-meeting': ['Financial Statements', 1],
  'extra-ordinary-general-meetings': ['Financial Statements', 2],
  'audited-financial-statements': ['Financial Statements', 3],
  'unpaid-dividend': ['Financial Statements', 4],
  'company-policies': ['Corporate Governance', 1],
  'moa-aoa': ['Corporate Governance', 2],
  'merger-and-amalgamation': ['Corporate Governance', 3],
  'migration-to-main-board': ['Corporate Governance', 4],
  'postal-ballot': ['Other Filings', 1],
  'integrated-filling': ['Other Filings', 2],
  'smart-odr': ['Other Filings', 3],
};

// ---------- InvestorSections ----------
const folders = [...snap.folders].sort((a, b) => a.sort_order - b.sort_order);
const titles = new Set();
const sectionRows = folders.map((f) => {
  if (titles.has(f.name)) throw new Error(`Duplicate section title ${f.name}`);
  titles.add(f.name);
  const intro = snap.folderIntros[f.slug];
  if (!intro) throw new Error(`No intro for ${f.slug}`);
  const hub = HUB[f.slug];
  if (!hub) throw new Error(`No hub placement for ${f.slug}`);
  return {
    title: f.name,
    slug: f.slug,
    description: f.description,
    introHtml: `<p>${escHtml(intro)}</p>` + (snap.folderIntroExtraHtml[f.slug] || ''),
    groupBy: f.group_by,
    visibleInMenu: f.visible ? 'true' : 'false',
    sortOrder: f.sort_order,
    seoTitle: f.seo.metaTitle,
    seoDescription: f.seo.metaDescription,
    pageHeading: f.pageHeading,
    layout: f.slug === 'sebi-lodr' ? 'disclosures' : 'documents',
    hubGroup: hub[0],
    hubOrder: hub[1],
  };
});
const sectionHeaders = ['title', 'slug', 'description', 'introHtml', 'groupBy', 'visibleInMenu', 'sortOrder',
  'seoTitle', 'seoDescription', 'pageHeading', 'layout', 'hubGroup', 'hubOrder'];

// ---------- InvestorDocuments ----------
const audit = new Map();
for (const r of parseCsv(readFileSync(AUDIT, 'utf8'))) audit.set(`${r.folder}|${r.url}`, r.status);
const nameBySlug = new Map(folders.map((f) => [f.slug, f.name]));
let unchecked = 0;
const docRows = snap.documents.map((d) => {
  const section = nameBySlug.get(d.folder_slug);
  if (!section) throw new Error(`Unknown folder ${d.folder_slug}`);
  let status = audit.get(`${d.folder_slug}|${d.external_url}`);
  if (status !== 'ok' && status !== 'broken') { status = 'unchecked'; unchecked++; }
  return {
    title: d.title,
    section,
    legacyUrl: d.external_url,
    linkStatus: status,
    fy: d.fy,
    documentDate: d.doc_date ? `${d.doc_date}T12:00:00.000Z` : '', // noon UTC: same calendar day in every timezone
    sortOrder: d.sort_order,
    description: '',
    published: 'true',
  };
});
const docHeaders = ['title', 'section', 'legacyUrl', 'linkStatus', 'fy', 'documentDate', 'sortOrder', 'description', 'published'];

// ---------- Reg46Disclosures ----------
const lodr = snap.pages.find((p) => p.path === '/investors/sebi-lodr');
const table = lodr.blocks.find((b) => b.type === 'compliance_table');
const regRows = table.props.rows.map((r, i) => ({
  srNo: r.sr, particular: r.particular, regulation: r.regulation, linkUrl: r.href || '', sortOrder: i + 1,
}));
const regHeaders = ['srNo', 'particular', 'regulation', 'linkUrl', 'sortOrder'];

// ---------- write ----------
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'InvestorSections.csv'), toCsv(sectionHeaders, sectionRows));
writeFileSync(join(OUT, 'InvestorDocuments.csv'), toCsv(docHeaders, docRows));
writeFileSync(join(OUT, 'Reg46Disclosures.csv'), toCsv(regHeaders, regRows));

const count = (s) => docRows.filter((d) => d.linkStatus === s).length;
console.log(`InvestorSections:  ${sectionRows.length} rows`);
console.log(`InvestorDocuments: ${docRows.length} rows (ok ${count('ok')}, broken ${count('broken')}, unchecked ${unchecked})`);
console.log(`Reg46Disclosures:  ${regRows.length} rows (${regRows.filter((r) => !r.linkUrl).length} without link = NA)`);
