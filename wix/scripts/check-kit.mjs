#!/usr/bin/env node
// Consistency gate for the Wix kit. Exit 1 on any drift.
//  1. Every k- class named in docs/page-build-spec.md is defined in src/styles/global.css.
//  2. Every element ID the Velo page code reads ($w('#id')) is documented in src/pages/README.md,
//     and every ID the spec asks the designer to set exists in that README.
//  3. Every custom element tag in the spec has a file in src/public/custom-elements/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(KIT, p), 'utf8');
const walk = (d) => fs.readdirSync(path.join(KIT, d), { withFileTypes: true })
  .flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const uniq = (a) => [...new Set(a)].sort();
let fail = 0;
const report = (title, items) => { if (items.length) { fail++; console.log(`✗ ${title} (${items.length}):\n  ${items.join(' ')}`); } else console.log(`✓ ${title}`); };

const spec = read('docs/page-build-spec.md');
const css = read('src/styles/global.css');
const readme = read('src/pages/README.md');

const cssClasses = new Set(css.match(/\.k-[a-z0-9]+(?:-[a-z0-9]+)*/g)?.map(c => c.slice(1)) || []);
// Class mentions in the spec: inside backticks only, to skip prose like "k-" prefix explanations.
const specClasses = uniq([...spec.matchAll(/`[^`]*`/g)].flatMap(m => m[0].match(/\bk-[a-z0-9]+(?:-[a-z0-9]+)*\b/g) || [])
  .filter(c => !/^k-x(-y)?$/.test(c)));
report('spec classes defined in global.css', specClasses.filter(c => !cssClasses.has(c)));

const readmeIds = new Set(readme.match(/#[a-z][A-Za-z0-9]+/g) || []);
const codeIds = uniq(walk('src/public/pages').concat(walk('src/public/lib'))
  .flatMap(f => [...read(f).matchAll(/\$w\(\s*['"`](#[A-Za-z][A-Za-z0-9]*)['"`]/g)].map(m => m[1])));
report('Velo-read IDs documented in src/pages/README.md', codeIds.filter(id => !readmeIds.has(id)));
const specIds = uniq((spec.match(/`#[a-z][A-Za-z0-9]+`/g) || []).map(s => s.slice(1, -1)).filter(id => !/^#[0-9a-f]{3,8}$/i.test(id)));
report('spec IDs present in src/pages/README.md', specIds.filter(id => !readmeIds.has(id)));

const ceFiles = new Set(fs.readdirSync(path.join(KIT, 'src/public/custom-elements')).map(f => f.replace(/\.js$/, '')));
const specTags = uniq(spec.match(/\bkotyark-[a-z-]+\b(?![.\w-])/g) || []);
report('spec custom elements exist', specTags.filter(t => !ceFiles.has(t)));

process.exit(fail ? 1 : 0);
