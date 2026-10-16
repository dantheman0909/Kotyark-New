// Imports the legacy site content (scripts/legacy/content-snapshot.json) into the CMS tables.
// Idempotent: a rerun reports zero changes. Never publishes anything and never clobbers admin edits.
//
//   npm run migrate:content                      # import
//   npm run migrate:content -- --dry-run         # print the plan, write nothing (runs in a rolled-back transaction)
//   npm run migrate:content -- --ingest          # also download link_status='ok' documents into storage
//   npm run migrate:content -- --ingest --limit 5
//   npm run migrate:content -- --overwrite       # force snapshot values over rows an admin has edited
//
// Uses KOTYARK_DATABASE_URL, else DATABASE_URL (same rules as scripts/migrate.mjs).
import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT, connect, scratchPath, slugify, sanitizeRichText, htmlToText, validateBlock, blocksToText, mapRichText,
  extractPdfText, autoDescription, putObject,
} from './lib/contract.mjs';

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const KNOWN = ['--dry-run', '--ingest', '--limit', '--overwrite'];
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx >= 0 ? Number(args[limitIdx + 1]) : Infinity;
for (const a of args) {
  if (a.startsWith('--') && !KNOWN.includes(a)) { console.error(`Unknown flag ${a}. Known: ${KNOWN.join(' ')}`); process.exit(1); }
}
if (limitIdx >= 0 && !(LIMIT > 0)) { console.error('--limit needs a positive number'); process.exit(1); }
const DRY = flag('--dry-run');
const OVERWRITE = flag('--overwrite');
const INGEST = flag('--ingest');

const snap = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'legacy', 'content-snapshot.json'), 'utf8'));

// ---------------------------------------------------------------- helpers
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const stable = (v) => JSON.stringify(v, (_k, x) => (x && typeof x === 'object' && !Array.isArray(x)
  ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, x[k]])) : x));
const same = (a, b) => stable(a) === stable(b);
const counts = () => ({ inserted: 0, updated: 0, unchanged: 0, skipped_modified: 0 });
const report = { startedAt: new Date().toISOString(), dryRun: DRY, overwrite: OVERWRITE, tables: {}, notes: [], ingest: null };
const T = (name) => (report.tables[name] ||= counts());
const plan = [];
const log = (msg) => { if (DRY) plan.push(msg); };

// Pre-flight: every block in the snapshot must satisfy the shared contract.
for (const p of snap.pages) {
  p.blocks.forEach((b, i) => {
    const errs = validateBlock(b);
    if (errs.length) throw new Error(`${p.path} block #${i + 1} (${b.type}) invalid: ${errs.join('; ')}`);
  });
}

const client = await connect();

/** Runs one entity group in its own transaction (dry-run: everything shares one outer transaction, rolled back). */
async function group(name, fn) {
  if (DRY) { await fn(); return; }
  await client.query('BEGIN');
  try { await fn(); await client.query('COMMIT'); } catch (e) { await client.query('ROLLBACK'); throw new Error(`${name}: ${e.message}`); }
}

// ---------------------------------------------------------------- folders
// Same slug -> category mapping as migration 005 (which only backfills rows that existed when it ran).
const FOLDER_CATEGORY = {
  Regulatory: ['sebi-lodr', 'board-meetings', 'closing-trading-window', 'misc-sebi-disclosure'],
  Financial: ['annual-general-meeting', 'extra-ordinary-general-meetings', 'audited-financial-statements', 'unpaid-dividend'],
  Governance: ['company-policies', 'moa-aoa', 'merger-and-amalgamation', 'migration-to-main-board'],
};

async function migrateFolders() {
  const t = T('document_folders');
  // The category column comes from migration 005; on an older database it may not exist yet.
  const { rows: [hasCat] } = await client.query(
    `SELECT 1 AS ok FROM information_schema.columns WHERE table_name = 'document_folders' AND column_name = 'category' AND table_schema = current_schema()`);
  for (const f of snap.folders) {
    const introHtml = sanitizeRichText(`<p>${esc(snap.folderIntros[f.slug] || '')}</p>${snap.folderIntroExtraHtml?.[f.slug] || ''}`);
    const want = {
      parent_id: f.parent_id, slug: f.slug, name: f.name, description: f.description, intro_html: introHtml,
      group_by: f.group_by, visible: f.visible, sort_order: f.sort_order, seo: f.seo,
    };
    const { rows: [ex] } = await client.query(
      `SELECT parent_id, slug, name, description, intro_html, group_by, visible, sort_order, seo FROM document_folders WHERE id = $1`, [f.id]);
    if (!ex) {
      await client.query(
        `INSERT INTO document_folders(id, parent_id, slug, name, description, intro_html, group_by, visible, sort_order, seo)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`,
        [f.id, want.parent_id, want.slug, want.name, want.description, want.intro_html, want.group_by, want.visible, want.sort_order, JSON.stringify(want.seo)]);
      // Folders this script creates get their category here (005 will not backfill them on a fresh environment).
      const cat = Object.keys(FOLDER_CATEGORY).find((c) => FOLDER_CATEGORY[c].includes(f.slug));
      if (hasCat && cat) await client.query(`UPDATE document_folders SET category = $2 WHERE id = $1 AND category = 'Other'`, [f.id, cat]);
      t.inserted++; log(`insert folder ${f.id} (${f.slug})`);
    } else if (same(ex, want)) {
      t.unchanged++;
    } else if (OVERWRITE) {
      await client.query(
        `UPDATE document_folders SET parent_id=$2, slug=$3, name=$4, description=$5, intro_html=$6, group_by=$7, visible=$8,
                sort_order=$9, seo=$10::jsonb, updated_at=now() WHERE id=$1`,
        [f.id, want.parent_id, want.slug, want.name, want.description, want.intro_html, want.group_by, want.visible, want.sort_order, JSON.stringify(want.seo)]);
      t.updated++; log(`update folder ${f.id}`);
    } else {
      // folders carry no "edited by" marker, so a differing row is assumed to be an admin edit
      t.skipped_modified++; log(`skip folder ${f.id}: differs from snapshot (admin edit preserved)`);
    }
  }
}

// ---------------------------------------------------------------- documents
async function migrateDocuments() {
  const t = T('documents');
  const slugs = new Set((await client.query('SELECT slug FROM documents')).rows.map((r) => r.slug));
  const free = (base) => {
    let s = slugify(base);
    if (!slugs.has(s)) return s;
    for (let i = 2; i < 1000; i++) { if (!slugs.has(`${s}-${i}`)) return `${s}-${i}`; }
    throw new Error('could not allocate slug for ' + base);
  };
  for (const d of snap.documents) {
    const { rows: [ex] } = await client.query(
      `SELECT id, title, fy, doc_date::text AS doc_date, sort_order, updated_by FROM documents WHERE folder_id=$1 AND external_url=$2`,
      [d.folder_id, d.external_url]);
    if (!ex) {
      const slug = free(d.title);
      slugs.add(slug);
      await client.query(
        `INSERT INTO documents(folder_id, title, slug, external_url, fy, doc_date, sort_order, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'published')`,
        [d.folder_id, d.title, slug, d.external_url, d.fy, d.doc_date, d.sort_order]);
      t.inserted++; log(`insert document [${d.folder_slug}] ${d.title} -> ${slug}`);
      continue;
    }
    const want = { title: d.title, fy: d.fy, doc_date: d.doc_date, sort_order: d.sort_order };
    const have = { title: ex.title, fy: ex.fy, doc_date: ex.doc_date, sort_order: ex.sort_order };
    if (same(want, have)) { t.unchanged++; continue; }
    if (ex.updated_by === null || OVERWRITE) {
      await client.query(`UPDATE documents SET title=$2, fy=$3, doc_date=$4, sort_order=$5, updated_at=now() WHERE id=$1`,
        [ex.id, d.title, d.fy, d.doc_date, d.sort_order]);
      t.updated++; log(`update document ${ex.id} ${d.title}`);
    } else {
      t.skipped_modified++; log(`skip document ${ex.id}: edited by an admin`);
    }
  }
}

// ---------------------------------------------------------------- pages (always draft)
function prepareBlocks(blocks) {
  return blocks.map((b) => mapRichText(b, sanitizeRichText));
}

async function migratePages() {
  const t = T('pages');
  const depth = (p) => (p.path === '/' ? 0 : p.path.split('/').length - 1);
  const ordered = [...snap.pages].sort((a, b) => depth(a) - depth(b) || a.nav_order - b.nav_order);
  const idByPath = new Map();
  for (const p of ordered) {
    const blocks = prepareBlocks(p.blocks);
    const searchText = blocksToText(blocks, htmlToText);
    const parentId = p.parentPath ? idByPath.get(p.parentPath) : null;
    if (p.parentPath && !parentId) throw new Error(`parent ${p.parentPath} not available for ${p.path}`);
    const want = {
      parent_id: parentId, slug: p.slug, title: p.title, blocks, seo: p.seo, show_in_nav: p.show_in_nav,
      nav_order: p.nav_order, template: p.template, search_text: searchText,
    };
    const { rows: [ex] } = await client.query(
      `SELECT id, parent_id, slug, title, blocks, seo, show_in_nav, nav_order, template, search_text, status, updated_by FROM pages WHERE path = $1`, [p.path]);
    if (!ex) {
      const { rows: [r] } = await client.query(
        `INSERT INTO pages(parent_id, slug, path, title, status, blocks, seo, show_in_nav, nav_order, template, search_text)
         VALUES ($1,$2,$3,$4,'draft',$5::jsonb,$6::jsonb,$7,$8,$9,$10) RETURNING id`,
        [parentId, p.slug, p.path, p.title, JSON.stringify(blocks), JSON.stringify(p.seo), p.show_in_nav, p.nav_order, p.template, searchText]);
      idByPath.set(p.path, r.id);
      t.inserted++; log(`insert page (draft) ${p.path} [${blocks.length} blocks]`);
      continue;
    }
    idByPath.set(p.path, ex.id);
    const have = {
      parent_id: ex.parent_id, slug: ex.slug, title: ex.title, blocks: ex.blocks, seo: ex.seo, show_in_nav: ex.show_in_nav,
      nav_order: ex.nav_order, template: ex.template, search_text: ex.search_text,
    };
    if (same(want, have)) { t.unchanged++; continue; }
    const pristine = ex.status === 'draft' && ex.updated_by === null;
    if (pristine || OVERWRITE) {
      // A published page is only touched under --overwrite, and its status is never changed by this script.
      await client.query(
        `UPDATE pages SET parent_id=$2, slug=$3, title=$4, blocks=$5::jsonb, seo=$6::jsonb, show_in_nav=$7, nav_order=$8,
                template=$9, search_text=$10, updated_at=now() WHERE id=$1`,
        [ex.id, parentId, p.slug, p.title, JSON.stringify(blocks), JSON.stringify(p.seo), p.show_in_nav, p.nav_order, p.template, searchText]);
      t.updated++; log(`update page ${p.path}`);
    } else {
      t.skipped_modified++; log(`skip page ${p.path}: published or edited by an admin`);
    }
  }
}

// ---------------------------------------------------------------- nav (only into an empty menu)
async function migrateNav() {
  const t = T('nav_items');
  for (const menu of ['header', 'footer']) {
    const top = snap.nav.filter((n) => n.menu === menu);
    const { rows: [{ c }] } = await client.query('SELECT count(*)::int AS c FROM nav_items WHERE menu = $1', [menu]);
    const total = top.reduce((n, i) => n + 1 + i.children.length, 0);
    if (c > 0) { t.unchanged += c; log(`nav ${menu}: ${c} item(s) already present, left untouched`); report.notes.push(`nav_items.${menu}: not empty (${c} rows), nothing imported`); continue; }
    const link = async (url) => {
      if (!url) return { page_id: null, url: '' };
      const { rows: [pg] } = await client.query('SELECT id FROM pages WHERE path = $1', [url]);
      return pg ? { page_id: pg.id, url: null } : { page_id: null, url };
    };
    let n = 0;
    for (const [i, item] of top.entries()) {
      const l = await link(item.url);
      const { rows: [parent] } = await client.query(
        `INSERT INTO nav_items(menu, label, page_id, url, parent_id, sort_order) VALUES ($1,$2,$3,$4,NULL,$5) RETURNING id`,
        [menu, item.label, l.page_id, l.url, i + 1]);
      n++;
      for (const [j, ch] of item.children.entries()) {
        const cl = await link(ch.url);
        await client.query(
          `INSERT INTO nav_items(menu, label, page_id, url, parent_id, sort_order) VALUES ($1,$2,$3,$4,$5,$6)`,
          [menu, ch.label, cl.page_id, cl.url, parent.id, j + 1]);
        n++;
      }
    }
    t.inserted += n;
    log(`nav ${menu}: insert ${n} items (expected ${total})`);
  }
}

// ---------------------------------------------------------------- settings + redirects (insert-if-absent)
async function migrateSettings() {
  const t = T('site_settings');
  for (const [key, value] of Object.entries(snap.settings)) {
    const r = await client.query(
      `INSERT INTO site_settings(key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO NOTHING`, [key, JSON.stringify(value)]);
    if (r.rowCount) { t.inserted++; log(`insert setting ${key}`); } else t.unchanged++;
  }
}

async function migrateRedirects() {
  const t = T('redirects');
  for (const r of snap.redirects || []) {
    const res = await client.query(
      `INSERT INTO redirects(from_path, to_path, code) VALUES ($1,$2,$3) ON CONFLICT (from_path) DO NOTHING`, [r.from, r.to, r.code || 301]);
    if (res.rowCount) { t.inserted++; log(`insert redirect ${r.from}`); } else t.unchanged++;
  }
  if (!(snap.redirects || []).length) report.notes.push('redirects: none inserted (no evidence of old page URLs in the repo; none guessed)');
}

// ---------------------------------------------------------------- ingest
async function mapLimit(items, n, fn) {
  const out = [];
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
}

async function ingest() {
  const { rows } = await client.query(
    `SELECT id, title, slug, external_url, description FROM documents
      WHERE link_status = 'ok' AND storage_key IS NULL AND external_url IS NOT NULL ORDER BY folder_id, sort_order`);
  const batch = rows.slice(0, Number.isFinite(LIMIT) ? LIMIT : rows.length);
  const res = { candidates: rows.length, attempted: batch.length, ingested: 0, failed: [] };
  if (DRY) { res.note = 'dry-run: nothing downloaded'; report.ingest = res; log(`ingest: would download ${batch.length} of ${rows.length} documents`); return; }
  await mapLimit(batch, 3, async (d) => {
    try {
      const r = await fetch(d.external_url, { signal: AbortSignal.timeout(60_000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.subarray(0, 5).toString('latin1') !== '%PDF-') throw new Error('not a PDF (missing %PDF- header)');
      const key = `docs/${d.id}/${d.slug}.pdf`;
      await putObject(key, buf);
      const text = await extractPdfText(buf);
      const desc = d.description ? d.description : autoDescription(text);
      const original = decodeURIComponent(new URL(d.external_url).pathname.split('/').pop() || '');
      await client.query(
        `UPDATE documents SET storage_key=$2, size=$3, mime='application/pdf', original_name=$4, extracted_text=$5,
                description=$6, updated_at=now() WHERE id=$1 AND storage_key IS NULL`,
        [d.id, key, buf.length, original, text, desc]);
      res.ingested++;
      console.log(`ingested ${d.slug}  ${buf.length} bytes, ${text.length} chars of text`);
    } catch (e) {
      res.failed.push({ id: d.id, title: d.title, error: e.message });
      console.warn(`ingest failed: ${d.title}: ${e.message}`);
    }
  });
  report.ingest = res;
}

// ---------------------------------------------------------------- run
try {
  if (DRY) await client.query('BEGIN');
  await group('document_folders', migrateFolders);
  await group('documents', migrateDocuments);
  await group('pages', migratePages);
  await group('nav_items', migrateNav);
  await group('site_settings', migrateSettings);
  await group('redirects', migrateRedirects);

  if (INGEST) await ingest();

  const totals = Object.values(report.tables).reduce((n, c) => n + c.inserted + c.updated, 0);
  report.totalChanges = totals;
  if (DRY) {
    await client.query('ROLLBACK');
  } else {
    await client.query(
      `INSERT INTO audit_log(user_id, user_email, action, entity, entity_id, summary, diff) VALUES (NULL,'migration-script','create','migration',NULL,$1,$2::jsonb)`,
      [`Content migration: ${totals} row(s) changed${INGEST ? `, ${report.ingest?.ingested ?? 0} document(s) ingested` : ''}`,
        JSON.stringify({ tables: report.tables, ingest: report.ingest })]);
  }
} catch (e) {
  if (DRY) { try { await client.query('ROLLBACK'); } catch { /* ignore */ } }
  console.error('Migration failed:', e.message);
  await client.end();
  process.exit(1);
}
await client.end();

report.finishedAt = new Date().toISOString();
fs.mkdirSync(path.dirname(scratchPath('x')), { recursive: true });
fs.writeFileSync(scratchPath('migration-report.json'), JSON.stringify({ ...report, plan: DRY ? plan : undefined }, null, 2));

if (DRY) { console.log('DRY RUN: nothing was written.\n' + plan.map((l) => '  ' + l).join('\n')); }
console.log(`\n${DRY ? 'Plan' : 'Result'} per table (inserted / updated / unchanged / skipped_modified):`);
for (const [name, c] of Object.entries(report.tables)) {
  console.log(`  ${name.padEnd(17)} ${String(c.inserted).padStart(4)} / ${String(c.updated).padStart(3)} / ${String(c.unchanged).padStart(4)} / ${c.skipped_modified}`);
}
for (const n of report.notes) console.log('  note:', n);
if (report.ingest) console.log('  ingest:', JSON.stringify({ ...report.ingest, failed: report.ingest.failed?.length }));
console.log(`Total rows ${DRY ? 'that would change' : 'changed'}: ${report.totalChanges}`);
console.log('Report: attached_assets/_scratch/migration-report.json');
