// Chunked document upload with progress. Client-only.
// Flow: POST /api/documents/uploads (init) -> PUT each part with XHR (upload.onprogress) -> resolve { uploadId }.
// The caller then sends { uploadId, ...metadata } to POST /api/documents or PUT /api/documents/:id.
import { useEffect } from 'react';
import { api } from './api';

export const MAX_FILE_BYTES = 100 * 1024 * 1024;
const RETRIES = 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const abortError = () => Object.assign(new Error('Upload cancelled'), { name: 'AbortError', cancelled: true });

function putPart(url, blob, { onLoaded, signal }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const onAbort = () => xhr.abort();
    xhr.open('PUT', url);
    xhr.withCredentials = true;
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onLoaded(e.loaded); };
    xhr.onload = () => {
      signal?.removeEventListener('abort', onAbort);
      if (xhr.status === 401) { window.location.href = '/login'; return reject(Object.assign(new Error('Session expired. Redirecting to sign in...'), { status: 401 })); }
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let msg = `Upload failed (${xhr.status})`;
      try { msg = JSON.parse(xhr.responseText).error || msg; } catch { /* keep default */ }
      reject(Object.assign(new Error(msg), { status: xhr.status }));
    };
    xhr.onerror = () => { signal?.removeEventListener('abort', onAbort); reject(Object.assign(new Error('Network error during upload'), { network: true })); };
    xhr.onabort = () => { signal?.removeEventListener('abort', onAbort); reject(abortError()); };
    if (signal) { if (signal.aborted) return reject(abortError()); signal.addEventListener('abort', onAbort); }
    xhr.send(blob);
  });
}

/**
 * Upload `file` in parts. onProgress({ loaded, total, fraction }) fires as bytes are sent.
 * Resolves with the upload session id. Cancelling via `signal` aborts the request and deletes the session.
 */
export async function uploadFile(file, { onProgress, signal } = {}) {
  if (file.size > MAX_FILE_BYTES) throw new Error('File is larger than 100 MB');
  if (signal?.aborted) throw abortError();
  const { id, partBytes, parts } = await api('/api/documents/uploads', { method: 'POST', json: { filename: file.name, size: file.size } });
  const report = (loaded) => onProgress?.({ loaded, total: file.size, fraction: file.size ? Math.min(1, loaded / file.size) : 1 });
  try {
    let done = 0;
    report(0);
    for (let n = 0; n < parts; n++) {
      const blob = file.slice(n * partBytes, Math.min(file.size, (n + 1) * partBytes));
      for (let attempt = 0; ; attempt++) {
        try {
          await putPart(`/api/documents/uploads/${id}/${n}`, blob, { signal, onLoaded: (l) => report(done + l) });
          break;
        } catch (e) {
          // Retry network failures and 5xx only; 4xx (bad part, expired session) will not improve.
          const retryable = !e.cancelled && (e.network || e.status >= 500);
          if (!retryable || attempt >= RETRIES - 1) throw e;
          report(done);
          await sleep(500 * 2 ** attempt);
          if (signal?.aborted) throw abortError();
        }
      }
      done += blob.size;
      report(done);
    }
    return id;
  } catch (e) {
    // Best effort: remove the session and its temp parts.
    await deleteUpload(id);
    throw e;
  }
}

/** Best-effort removal of an upload session (and its temp parts) on the server. */
export async function deleteUpload(id) {
  await fetch(`/api/documents/uploads/${id}`, { method: 'DELETE', credentials: 'same-origin', keepalive: true }).catch(() => {});
}

/** True when a failed save is worth retrying without re-uploading (server/transient/network error, not a 4xx verdict). */
export const isRetryableSave = (e) => !e.cancelled && (!e.status || e.status >= 500);

/** Warn before the tab is closed or reloaded while `active`. */
export function useUnloadGuard(active) {
  useEffect(() => {
    if (!active) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [active]);
}
