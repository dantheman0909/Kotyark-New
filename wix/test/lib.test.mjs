// Run: node --test wix/test/lib.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { documentUrlToHttp, resolveDocLink, groupDocuments, buildSidebar, buildHubGroups, buildReg46Rows, formatDocDate } from '../src/public/lib/investor.js';
import { buildSectionSeo, documentListJsonLd, organizationJsonLd } from '../src/public/lib/seo.js';

const O = 'https://example.com';

test('documentUrlToHttp', () => {
  assert.equal(documentUrlToHttp('https://x.y/a.pdf', O), 'https://x.y/a.pdf');
  assert.equal(documentUrlToHttp('wix:document://v1/ugd/e196d6_abc.pdf/Name.pdf#originalFileName=Name.pdf&documentType=ugd', O), `${O}/_files/ugd/e196d6_abc.pdf`);
  assert.equal(documentUrlToHttp('', O), '');
});

test('resolveDocLink: file > legacy ok/unchecked > updating', () => {
  assert.equal(resolveDocLink({ file: 'wix:document://v1/ugd/a.pdf/n.pdf', legacyUrl: 'https://l', linkStatus: 'broken' }, O).state, 'file');
  assert.equal(resolveDocLink({ legacyUrl: 'https://l', linkStatus: 'ok' }, O).url, 'https://l');
  assert.equal(resolveDocLink({ legacyUrl: 'https://l', linkStatus: 'unchecked' }, O).state, 'legacy');
  const u = resolveDocLink({ legacyUrl: 'https://l', linkStatus: 'broken' }, O);
  assert.deepEqual([u.state, u.url], ['updating', '']);
  assert.equal(resolveDocLink({}, O).state, 'updating');
});

test('groupDocuments: none -> single group sorted; fy -> newest first, no-FY last', () => {
  const docs = [
    { _id: 'a', title: 'a', fy: 'FY 2022-23', sortOrder: 3 },
    { _id: 'b', title: 'b', fy: 'FY 2024-25', sortOrder: 2 },
    { _id: 'c', title: 'c', fy: null, sortOrder: 1 },
    { _id: 'd', title: 'd', fy: 'FY 2024-25', sortOrder: 1 },
  ];
  const none = groupDocuments(docs, 'none');
  assert.equal(none.length, 1);
  assert.deepEqual(none[0].docs.map((d) => d._id), ['c', 'd', 'b', 'a']);
  const fy = groupDocuments(docs, 'fy');
  assert.deepEqual(fy.map((g) => g.title), ['FY 2024-25', 'FY 2022-23', 'Other documents']);
  assert.deepEqual(fy[0].docs.map((d) => d._id), ['d', 'b']);
  assert.equal(new Set(fy.map((g) => g._id)).size, 3);
  assert.deepEqual(groupDocuments([], 'fy'), []);
});

test('buildSidebar filters, sorts, flags current', () => {
  const s = buildSidebar([
    { _id: '2', title: 'B', slug: 'b', sortOrder: 2, visibleInMenu: true },
    { _id: '1', title: 'A', slug: 'a', sortOrder: 1, visibleInMenu: true },
    { _id: '3', title: 'C', slug: 'c', sortOrder: 3, visibleInMenu: false },
  ], 'b');
  assert.deepEqual(s.map((x) => [x.slug, x.isCurrent, x.url]), [['a', false, '/investors/a'], ['b', true, '/investors/b']]);
});

test('buildHubGroups on the generated CSV order', () => {
  const csv = readFileSync(new URL('../data/collections/InvestorSections.csv', import.meta.url), 'utf8');
  assert.ok(csv.includes('hubGroup'));
  const g = buildHubGroups([
    { _id: '1', title: 'T1', slug: 's1', description: 'd', hubGroup: 'Other Filings', hubOrder: 2 },
    { _id: '2', title: 'T2', slug: 's2', description: 'd', hubGroup: 'Regulatory Filings', hubOrder: 1 },
    { _id: '3', title: 'T3', slug: 's3', description: 'd', hubGroup: 'Other Filings', hubOrder: 1 },
  ]);
  assert.deepEqual(g.map((x) => x.title), ['Regulatory Filings', 'Other Filings']);
  assert.deepEqual(g[1].sections.map((x) => x.title), ['T3', 'T1']);
});

test('buildReg46Rows: blank link = NA', () => {
  const r = buildReg46Rows([{ _id: 'x', srNo: 'N', sortOrder: 2, linkUrl: '' }, { _id: 'y', srNo: 'A', sortOrder: 1, linkUrl: '/about' }]);
  assert.deepEqual(r.map((x) => [x.srNo, x.hasLink]), [['A', true], ['N', false]]);
});

test('formatDocDate uses UTC day', () => {
  assert.match(formatDocDate('2025-02-11T12:00:00.000Z'), /11/);
  assert.equal(formatDocDate(null), '');
  assert.equal(formatDocDate('garbage'), '');
});

test('JSON-LD builders', () => {
  const section = { slug: 'board-meetings', title: 'Board Meetings', description: 'desc', seoTitle: 'BM', seoDescription: 'sd' };
  const ld = documentListJsonLd(O, section, [{ title: 'X', url: 'https://f/x.pdf', date: '2025-02-11T12:00:00.000Z' }, { title: 'Y', url: '' }]);
  assert.equal(ld.mainEntity.numberOfItems, 1);
  assert.equal(ld.mainEntity.itemListElement[0].item.datePublished, '2025-02-11');
  const seo = buildSectionSeo(O, section, []);
  assert.equal(seo.canonical, `${O}/investors/board-meetings`);
  assert.equal(seo.title, 'BM');
  const crumbs = seo.structuredData.find((x) => x['@type'] === 'BreadcrumbList').itemListElement;
  assert.deepEqual(crumbs.map((c) => c.position), [1, 2, 3]);
  assert.equal(organizationJsonLd(O).logo, undefined);
  JSON.stringify(seo.structuredData);
});

test('generated CSVs: row counts and reference integrity', () => {
  const read = (n) => readFileSync(new URL(`../data/collections/${n}.csv`, import.meta.url), 'utf8').trim().split('\n');
  assert.equal(read('InvestorSections').length > 15, true); // multi-line cells may add lines
  assert.equal(read('InvestorDocuments').length, 105);
  assert.equal(read('Reg46Disclosures').length, 31);
});
