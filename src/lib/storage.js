// File storage. Server-only.
// Driver: STORAGE_DRIVER=local|replit wins. Otherwise Replit App Storage only in a production
// deployment (REPLIT_DEPLOYMENT set); dev workspaces use a local directory so they never write into
// the production bucket. The local directory is outside /public.
// Never write uploads to /public: next start does not serve files added after build.
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const LOCAL_ROOT = process.env.LOCAL_STORAGE_DIR || path.join(process.cwd(), '.storage');

function driverName() {
  if (process.env.STORAGE_DRIVER) return process.env.STORAGE_DRIVER;
  return process.env.REPLIT_DEPLOYMENT ? 'replit' : 'local';
}

let replitClient;
/** Test hook: substitute the App Storage client (use with STORAGE_DRIVER=replit). Not used in production. */
export function __setReplitClientForTests(c) {
  if (process.env.REPLIT_DEPLOYMENT) throw new Error('__setReplitClientForTests must not be used in a deployment');
  replitClient = c;
}
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

/** Store a Node Readable under key without buffering it. */
export async function putObjectStream(key, readable) {
  safeKey(key);
  if (driverName() === 'replit') {
    const c = await replit();
    // The SDK pipes `readable` into the bucket write stream and only listens for DESTINATION errors, so a source
    // error would leave its promise pending forever. Race it against the source's own 'error'.
    // Known limit: the SDK does not expose its bucket write stream, so after a source error we cannot abort it. The
    // request to the bucket is left to time out without finalising an object (nothing becomes visible at `key`);
    // the caller still deletes `key` defensively.
    let onErr;
    const sourceFailed = new Promise((_, rej) => { onErr = rej; readable.on('error', onErr); });
    const upload = c.uploadFromStream(key, readable);
    upload.catch(() => {}); // it may settle after the race is lost; never an unhandled rejection
    try { await Promise.race([upload, sourceFailed]); }
    catch (e) { readable.destroy(); throw e; }
    finally { readable.off('error', onErr); }
    return;
  }
  const p = path.join(LOCAL_ROOT, key);
  await fs.promises.mkdir(path.dirname(p), { recursive: true });
  try { await pipeline(readable, fs.createWriteStream(p)); }
  catch (e) { await fs.promises.rm(p, { force: true }); throw e; }
}

/** Read an object fully into a Buffer, or null if it does not exist. Any other failure throws (so it is a 5xx, not "missing"). */
export async function getObject(key) {
  safeKey(key);
  if (driverName() === 'replit') {
    const c = await replit();
    const r = await c.downloadAsBytes(key); // Result<[Buffer]>
    if (!r) throw new Error('App Storage read returned nothing');
    if (r.ok === false) {
      if (r.error?.statusCode === 404) return null;
      throw new Error(`App Storage read failed: ${r.error?.message || 'unknown'}`);
    }
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
    if (!r.ok) throw new Error(`App Storage exists check failed: ${r.error?.message || 'unknown'}`);
    return r.value;
  }
  return fs.existsSync(path.join(LOCAL_ROOT, key));
}

/**
 * Object keys under `prefix` (at most `max`). Replit: the bucket listing; local: a walk of the directory.
 */
export async function listObjects(prefix, max = 500) {
  safeKey(prefix);
  if (driverName() === 'replit') {
    const c = await replit();
    const r = await c.list({ prefix, maxResults: max });
    if (!r.ok) throw new Error(`App Storage list failed: ${r.error?.message || 'unknown'}`);
    return r.value.map((o) => o.name).slice(0, max);
  }
  const out = [];
  const walk = async (dir) => {
    let ents;
    try { ents = await fs.promises.readdir(path.join(LOCAL_ROOT, dir), { withFileTypes: true }); }
    catch (e) { if (e.code === 'ENOENT') return; throw e; }
    for (const e of ents) {
      if (out.length >= max) return;
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) await walk(rel); else out.push(rel);
    }
  };
  await walk(prefix.replace(/\/$/, ''));
  return out;
}

/** Local driver only (App Storage has no directories): remove empty directories under `prefix`, deepest first. */
export async function removeEmptyDirs(prefix) {
  if (driverName() === 'replit') return;
  safeKey(prefix);
  const walk = async (dir) => {
    let ents;
    try { ents = await fs.promises.readdir(dir, { withFileTypes: true }); } catch { return false; }
    for (const e of ents) if (e.isDirectory()) await walk(path.join(dir, e.name));
    try { await fs.promises.rmdir(dir); return true; } catch { return false; } // fails (ENOTEMPTY) when not empty
  };
  const root = path.join(LOCAL_ROOT, prefix);
  let ents;
  try { ents = await fs.promises.readdir(root, { withFileTypes: true }); } catch { return; }
  for (const e of ents) if (e.isDirectory()) await walk(path.join(root, e.name));
}
