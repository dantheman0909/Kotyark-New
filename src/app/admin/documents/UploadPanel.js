'use client';
import { useRef, useState } from 'react';
import { api, formatBytes, fyOf, progressText, DATE_RE, DATE_PATTERN } from './api';
import { uploadFile, deleteUpload, isRetryableSave, useUnloadGuard } from './uploader';
import ProgressBar from './ProgressBar';
import s from './documents.module.css';

const ACCEPT = '.pdf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg';
const MAX = 100 * 1024 * 1024;
const TOO_BIG = 'Larger than 100 MB';

const stripExt = (n) => n.replace(/\.[A-Za-z0-9]{2,5}$/, '').replace(/_+/g, ' ').trim();
let seq = 0;

/** Multi-file drag-and-drop: every file becomes an editable row; nothing uploads until "Upload all". */
export default function UploadPanel({ folderId, onUploaded, onError, onRefresh }) {
  const [rows, setRows] = useState([]);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [overall, setOverall] = useState(null); // { index, count, loaded, total }
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const [processing, setProcessing] = useState(false);
  useUnloadGuard(busy);

  const addFiles = (fileList) => {
    const next = [...fileList].map((file) => ({
      key: ++seq, file, title: stripExt(file.name), fy: '', doc_date: '', status: 'published', error: file.size > MAX ? TOO_BIG : '', done: false,
    }));
    setRows((r) => [...r, ...next]);
  };
  const addLink = () => {
    if (!/^https?:\/\//i.test(linkUrl.trim())) { onError('External link must start with http:// or https://'); return; }
    setRows((r) => [...r, { key: ++seq, url: linkUrl.trim(), title: '', fy: '', doc_date: '', status: 'published', error: '', done: false }]);
    setLinkUrl('');
  };
  const patch = (key, p) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...p } : x)));
  const drop = (e) => { e.preventDefault(); setOver(false); if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files); };

  const submit = async () => {
    setBusy(true); onError('');
    let uploaded = 0;
    const queue = rows.filter((r) => !r.done && r.error !== TOO_BIG);
    const grand = queue.reduce((n, r) => n + (r.file ? r.file.size : 0), 0);
    let before = 0;
    let cancelled = false;
    for (let i = 0; i < queue.length && !cancelled; i++) {
      const r = queue[i];
      if (r.doc_date && !DATE_RE.test(r.doc_date)) { patch(r.key, { error: 'Date must be YYYY-MM-DD' }); continue; }
      const ctl = new AbortController();
      abortRef.current = ctl;
      const bump = (loaded) => setOverall({ index: i + 1, count: queue.length, loaded: before + loaded, total: grand });
      bump(0);
      let uploadId = r.uploadId || null; // set when an earlier attempt uploaded the parts but the save failed
      try {
        let res;
        if (r.file) {
          if (!uploadId) {
            patch(r.key, { error: '', phase: 'uploading', progress: { loaded: 0, total: r.file.size } });
            uploadId = await uploadFile(r.file, {
              signal: ctl.signal,
              onProgress: ({ loaded, total }) => { patch(r.key, { progress: { loaded, total } }); bump(loaded); },
            });
            if (ctl.signal.aborted) { await deleteUpload(uploadId); throw Object.assign(new Error('Upload cancelled'), { cancelled: true }); }
            patch(r.key, { uploadId });
          }
          patch(r.key, { error: '', phase: 'processing' }); setProcessing(true);
          const json = { folderId, status: r.status, uploadId };
          if (r.title.trim()) json.title = r.title.trim();
          if (r.fy.trim()) json.fy = r.fy.trim();
          if (r.doc_date) json.doc_date = r.doc_date;
          res = await api('/api/documents', { method: 'POST', json });
        } else {
          const json = { folderId, status: r.status, externalUrl: r.url };
          if (r.title.trim()) json.title = r.title.trim();
          if (r.fy.trim()) json.fy = r.fy.trim();
          if (r.doc_date) json.doc_date = r.doc_date;
          res = await api('/api/documents', { method: 'POST', json });
        }
        patch(r.key, { done: true, error: '', phase: '', uploadId: null, warning: res.warning || '' }); uploaded++;
      } catch (e) {
        if (e.cancelled) { patch(r.key, { phase: '', progress: null, uploadId: null, error: 'Cancelled' }); cancelled = true; }
        else if (uploadId && e.status === 409 && /^This upload is/.test(e.message)) {
          // Another request is still saving this upload (e.g. a slow first attempt): never re-upload. Show what is there now.
          patch(r.key, { phase: '', progress: null, uploadId, error: 'Still saving this file. Check the list below in a moment, or use Retry save.' });
          onRefresh?.();
        }
        else if (uploadId && e.status === 404) {
          // The save may have completed and only its response was lost (the session is gone once the document exists).
          patch(r.key, { done: true, phase: '', progress: null, uploadId: null, uncertain: true, error: '',
            warning: 'This file may already be saved. Refreshing the list; check it before uploading again.' });
          onRefresh?.();
        }
        else if (uploadId && isRetryableSave(e)) patch(r.key, { phase: '', progress: null, uploadId, error: `${e.message}. The file is uploaded; use Retry save.` });
        else { if (uploadId) deleteUpload(uploadId); patch(r.key, { phase: '', progress: null, uploadId: null, error: e.message }); }
      } finally {
        setProcessing(false);
        if (r.file) before += r.file.size; // the total keeps adding up even when this file failed
      }
    }
    abortRef.current = null;
    setOverall(null);
    setBusy(false);
    if (uploaded) { setRows((r) => r.filter((x) => !x.done || x.warning)); await onUploaded(uploaded); }
  };

  const pending = rows.filter((r) => !r.done);
  const warned = rows.filter((r) => r.done && r.warning);

  return (
    <>
      <div className={`${s.dropzone} ${over ? s.over : ''}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={drop}
        onClick={() => inputRef.current?.click()} role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}>
        Drag &amp; drop files here, or click to choose (PDF, DOCX, XLSX, PPTX, PNG, JPG, max 100 MB each)
        <input ref={inputRef} type="file" multiple accept={ACCEPT} hidden
          onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
      </div>
      <div className={s.toolbar} style={{ borderBottom: 'none', paddingTop: 0 }}>
        <input className={s.input} style={{ flex: 1, minWidth: 220 }} placeholder="...or paste an external link (https://...)"
          value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }} />
        <button className="admin-cancel-btn" onClick={addLink}>Add link</button>
      </div>

      {warned.length > 0 && (
        <div className={s.staged}>
          {warned.map((r) => (
            <div className={s.stagedRow} key={r.key}>
              <div className={s.stagedHead}>
                <span>{r.title || r.file?.name}{r.uncertain ? '' : ' · uploaded'}</span>
                <button className={s.textBtn} onClick={() => setRows((x) => x.filter((y) => y.key !== r.key))}>Dismiss</button>
              </div>
              <div className={s.rowError} role="status">{r.warning}</div>
            </div>
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <div className={s.staged}>
          {overall && (
            <div className={s.stagedRow}>
              <ProgressBar percent={overall.total ? (overall.loaded / overall.total) * 100 : 0}
                label={`Uploading ${overall.index} of ${overall.count} · ${overall.total ? Math.round((overall.loaded / overall.total) * 100) : 0}%`} />
              <div className="admin-inline-actions">
                <button className="admin-cancel-btn" disabled={processing} onClick={() => abortRef.current?.abort()}>Cancel</button>
              </div>
            </div>
          )}
          {pending.map((r) => (
            <div className={s.stagedRow} key={r.key}>
              <div className={s.stagedHead}>
                <span>{r.file ? `${r.file.name} · ${formatBytes(r.file.size)}` : r.url}</span>
                <button className={s.textBtn} disabled={busy} onClick={() => { if (r.uploadId) deleteUpload(r.uploadId); setRows((x) => x.filter((y) => y.key !== r.key)); }}>Remove</button>
              </div>
              <div className={s.formGrid}>
                <label className={s.field} style={{ gridColumn: 'span 2' }}>Title
                  <input className={s.input} value={r.title} placeholder={r.url ? 'Title (required for links)' : ''} onChange={(e) => patch(r.key, { title: e.target.value })} />
                </label>
                <label className={s.field}>Date (YYYY-MM-DD)
                  <input className={s.input} value={r.doc_date} pattern={DATE_PATTERN} placeholder="2025-02-11" inputMode="numeric"
                    onChange={(e) => { const d = e.target.value; patch(r.key, { doc_date: d, ...(r.fy === '' || r.fy === fyOf(r.doc_date) ? { fy: fyOf(d) } : {}) }); }} />
                </label>
                <label className={s.field}>Financial year
                  <input className={s.input} value={r.fy} placeholder="FY 2024-25" onChange={(e) => patch(r.key, { fy: e.target.value })} />
                </label>
                <label className={s.field}>Status
                  <select className="admin-select" value={r.status} onChange={(e) => patch(r.key, { status: e.target.value })}>
                    <option value="published">Published</option><option value="draft">Draft</option>
                  </select>
                </label>
              </div>
              {r.phase === 'uploading' && r.progress && <ProgressBar percent={(r.progress.loaded / r.progress.total) * 100} label={progressText(r.progress.loaded, r.progress.total)} />}
              {r.phase === 'processing' && <ProgressBar percent={100} label="Processing…" />}
              {r.error && <div className={s.rowError}>{r.error}{r.uploadId && !busy && <> <button className={s.textBtn} onClick={submit}>Retry save</button></>}</div>}
            </div>
          ))}
          <div className="admin-inline-actions">
            <button className="admin-save-btn" disabled={busy || pending.some((r) => r.url && !r.title.trim())} onClick={submit}>
              {busy ? 'Uploading...' : `Upload ${pending.length} item${pending.length === 1 ? '' : 's'}`}
            </button>
            <button className="admin-cancel-btn" disabled={busy} onClick={() => { rows.forEach((x) => { if (x.uploadId && !x.done) deleteUpload(x.uploadId); }); setRows([]); }}>Clear</button>
          </div>
        </div>
      )}
    </>
  );
}
