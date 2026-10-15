#!/usr/bin/env node
// Copy the Kotyark Wix kit into the Wix-created site repo (the one "Connect to GitHub" made).
// Usage: node wix/scripts/sync-to-wix-repo.mjs /path/to/wix-site-repo [--dry-run]
//
// Copies ONLY kit-owned paths. Never touches Wix-generated files:
//   wix.config.json, src/pages/*.js (page code files), velo.dependencies.json, src/backend/permissions.json.
// Never deletes anything in the destination.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [dest, flag] = process.argv.slice(2);
const dry = flag === '--dry-run';

if (!dest) { console.error('Usage: node wix/scripts/sync-to-wix-repo.mjs /path/to/wix-site-repo [--dry-run]'); process.exit(1); }
if (!fs.existsSync(path.join(dest, 'wix.config.json'))) { console.error(`Not a Wix site repo (no wix.config.json): ${dest}`); process.exit(1); }
if (!fs.existsSync(path.join(dest, 'src'))) { console.error(`No src/ in ${dest}`); process.exit(1); }

const MAP = [
  ['src/public/custom-elements', 'src/public/custom-elements'],
  ['src/public/pages', 'src/public/pages'],
  ['src/public/lib', 'src/public/lib'],
  ['src/styles', 'src/styles'],
  ['src/backend', 'src/backend'],
];
const NEVER = new Set(['permissions.json']);
let added = 0, changed = 0, same = 0;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

for (const [from, to] of MAP) {
  const src = path.join(KIT, from);
  if (!fs.existsSync(src)) continue;
  for (const file of walk(src)) {
    if (NEVER.has(path.basename(file))) continue;
    const rel = path.relative(src, file);
    const target = path.join(dest, to, rel);
    const data = fs.readFileSync(file);
    const exists = fs.existsSync(target);
    if (exists && fs.readFileSync(target).equals(data)) { same++; continue; }
    console.log(`${exists ? 'update' : 'add   '} ${path.join(to, rel)}`);
    exists ? changed++ : added++;
    if (!dry) { fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, data); }
  }
}
console.log(`\n${dry ? '[dry run] ' : ''}${added} added, ${changed} updated, ${same} unchanged.`);
console.log(`Next: cd "${dest}" && git status && wix dev   # check in the Local Editor, commit + push, then wix publish`);
