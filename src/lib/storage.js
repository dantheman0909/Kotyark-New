// File storage. Server-only.
// Driver: STORAGE_DRIVER=local|replit wins. Otherwise Replit App Storage only in a production
// deployment (REPLIT_DEPLOYMENT set); dev workspaces use a local directory so they never write into
// the production bucket. The local directory is outside /public.
// Never write uploads to /public: next start does not serve files added after build.
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';

const LOCAL_ROOT = process.env.LOCAL_STORAGE_DIR || path.join(process.cwd(), '.storage');

function driverName() {
  if (process.env.STORAGE_DRIVER) return process.env.STORAGE_DRIVER;
  return process.env.REPLIT_DEPLOYMENT ? 'replit' : 'local';
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
    const r = await c.downloadAsBytes(key); // Result<[Buffer]>
    if (!r || r.ok === false) return null;
    const v = 'value' in r ? r.value : r;
    const b = Array.isArray(v) ? v[0] : v;
    return b == null ? null : Buffer.isBuffer(b) ? b : Buffer.from(b);
  }
  try { return await fs.promises.readFile(path.join(LOCAL_ROOT, key)); }
  catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}

/** Web ReadableStream for a Response body, or null if missing. */
export async function getObjectStream(key) {
  safeKey(key);
  if (driverName() === 'replit') {
    const c = await replit();
    const ex = await c.exists(key);
    if (!ex || ex.ok === false || !ex.value) return null;
    const src = c.downloadAsStream(key); // Node Readable, not a Result
    src.on('error', (e) => console.error('App Storage stream error:', e.message)); // don't crash on a mid-stream failure
    return Readable.toWeb(src);
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
