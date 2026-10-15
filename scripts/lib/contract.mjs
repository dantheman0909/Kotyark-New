// Loads the shared, dependency-free modules from src/lib so the scripts reuse the
// app's own block contract, slug and sanitizer rules (never re-implemented here).
// The files are ESM syntax in a typeless package, so Node warns once per file;
// the warning is filtered because it is expected and harmless.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const origEmit = process.emitWarning;
process.emitWarning = function (w, ...rest) {
  const msg = typeof w === 'string' ? w : w?.message || '';
  const code = rest[0]?.code || rest[1] || w?.code;
  if (code === 'MODULE_TYPELESS_PACKAGE_JSON' || /MODULE_TYPELESS_PACKAGE_JSON|Module type of file/.test(msg)) return;
  return origEmit.call(process, w, ...rest);
};

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const load = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);

export const blocks = await load('src/lib/blocks/schemas.js');
export const { slugify, uniqueSlug } = await load('src/lib/slug.js');
export const { sanitizeRichText, htmlToText } = await load('src/lib/sanitize.js');
export const { extractPdfText, autoDescription } = await load('src/lib/pdf-text.js');
export const { validateBlock, blocksToText, mapRichText } = blocks;
export const { putObject, objectExists } = await load('src/lib/storage.js');

/** Same connection rules as scripts/migrate.mjs. Returns a connected pg.Client. */
export async function connect() {
  const { default: pg } = await import('pg');
  const url = process.env.KOTYARK_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) { console.error('No database configured (KOTYARK_DATABASE_URL / DATABASE_URL).'); process.exit(1); }
  const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  const client = new pg.Client({ connectionString: url, ssl: isLocal ? false : { rejectUnauthorized: false } });
  await client.connect();
  return client;
}

export function scratchPath(name) {
  return path.join(ROOT, 'attached_assets', '_scratch', name);
}
