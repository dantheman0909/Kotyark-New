// File storage. Server-only.
// Replit App Storage in production (REPLIT_DEPLOYMENT / REPL_ID present and
// STORAGE_DRIVER!=local); a local directory outside /public otherwise.
// Never write uploads to /public: next start does not serve files added after build.
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';

const LOCAL_ROOT = process.env.LOCAL_STORAGE_DIR || path.join(process.cwd(), '.storage');

function driverName() {
  if (process.env.STORAGE_DRIVER) return process.env.STORAGE_DRIVER;
  return process.env.REPL_ID ? 'replit' : 'local';
}

let replitClient;
async function replit() {
  if (!replitClient) {
    const { Client } = await import('@replit/object-storage');
    replitClient = process.env.REPLIT_BUCKET_ID
      ? new Client({ bucketId: process.env.REPLIT_BUCKET_ID })
      : new Client();
  }
  return replitClient;
}

function safeKey(key) {
  if (!key || key.includes('..') || key.startsWith('/')) throw new Error(`Invalid storage key: ${key}`);
  return key;
}

/** Store a Buffer under key. */
export async function putObject(key, buffer) {
  safeKey(key);
  if (driverName() === 'replit') {
    const c = await replit();
    const r = await c.uploadFromBytes(key, buffer);
    if (!r.ok) throw new Error(`App Storage upload failed: ${r.error?.message || 'unknown'}`);
    return;
  }
  const p = path.join(LOCAL_ROOT, key);
  await fs.promises.mkdir(path.dirname(p), { recursive: true });
  await fs.promises.writeFile(p, buffer);
}

/** Read an object fully into a Buffer, or null if missing. */
export async function getObject(key) {
  safeKey(key);
  if (driverName() === 'replit') {
    const c = await replit();
    const r = await c.downloadAsBytes(key);
    if (!r.ok) return null;
    const v = r.value;
    return Buffer.isBuffer(v) ? v : Buffer.from(Array.isArray(v) ? v[0] : v);
  }
  try { return await fs.promises.readFile(path.join(LOCAL_ROOT, key)); }
  catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}

/** Web ReadableStream for a Response body, or null if missing. */
export async function getObjectStream(key) {
  safeKey(key);
  if (driverName() === 'replit') {
    const buf = await getObject(key);
    return buf ? new Blob([buf]).stream() : null;
  }
  const p = path.join(LOCAL_ROOT, key);
  if (!fs.existsSync(p)) return null;
  return Readable.toWeb(fs.createReadStream(p));
}

export async function deleteObject(key) {
  safeKey(key);
  if (driverName() === 'replit') {
    const c = await replit();
    await c.delete(key, { ignoreNotFound: true });
    return;
  }
  await fs.promises.rm(path.join(LOCAL_ROOT, key), { force: true });
}

export async function objectExists(key) {
  safeKey(key);
  if (driverName() === 'replit') {
    const c = await replit();
    const r = await c.exists(key);
    return r.ok && r.value;
  }
  return fs.existsSync(path.join(LOCAL_ROOT, key));
}
