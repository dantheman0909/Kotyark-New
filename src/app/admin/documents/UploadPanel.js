'use client';
import { useRef, useState } from 'react';
import { api, formatBytes, fyOf, DATE_RE, DATE_PATTERN } from './api';
import s from './documents.module.css';

const ACCEPT = '.pdf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg';
const MAX = 25 * 1024 * 1024;

const stripExt = (n) => n.replace(/\.[A-Za-z0-9]{2,5}$/, '').replace(/_+/g, ' ').trim();
let seq = 0;

/** Multi-file drag-and-drop: every file becomes an editable row; nothing uploads until "Upload all". */
export default function UploadPanel({ folderId, onUploaded, onError }) {
  const [rows, setRows] = useState([]);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const inputRef = useRef(null);

  const addFiles = (fileList) => {
    const next = [...fileList].map((file) => ({
      key: ++seq, file, title: stripExt(file.name), fy: '', doc_date: '', status: 'published', error: file.size > MAX ? 'Larger than 25 MB' : '', done: false,
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
    for (const r of rows) {
      if (r.done) continue;
      if (r.doc_date && !DATE_RE.test(r.doc_date)) { patch(r.key, { error: 'Date must be YYYY-MM-DD' }); continue; }
      if (r.error === 'Larger than 25 MB') continue;
      const fd = new FormData();
      fd.append('folderId', folderId);
      if (r.title.trim()) fd.append('title', r.title.trim());
      if (r.fy.trim()) fd.append('fy', r.fy.trim());
      if (r.doc_date) fd.append('doc_date', r.doc_date);
      fd.append('status', r.status);
      if (r.file) fd.append('file', r.file); else fd.append('externalUrl', r.url);
      try { await api('/api/documents', { method: 'POST', formData: fd }); patch(r.key, { done: true, error: '' }); uploaded++; }
      catch (e) { patch(r.key, { error: e.message }); }
    }
    setBusy(false);
    if (uploaded) { setRows((r) => r.filter((x) => !x.done)); await onUploaded(uploaded); }
  };

  const pending = rows.filter((r) => !r.done);

  return (
    <>
      <div className={`${s.dropzone} ${over ? s.over : ''}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={drop}
        onClick={() => inputRef.current?.click()} role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}>
        Drag &amp; drop files here, or click to choose (PDF, DOCX, XLSX, PPTX, PNG, JPG, max 25 MB each)
        <input ref={inputRef} type="file" multiple accept={ACCEPT} hidden
          onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
      </div>
      <div className={s.toolbar} style={{ borderBottom: 'none', paddingTop: 0 }}>
        <input className={s.input} style={{ flex: 1, minWidth: 220 }} placeholder="...or paste an external link (https://...)"
          value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }} />
        <button className="admin-cancel-btn" onClick={addLink}>Add link</button>
      </div>

      {pending.length > 0 && (
        <div className={s.staged}>
          {pending.map((r) => (
            <div className={s.stagedRow} key={r.key}>
              <div className={s.stagedHead}>
                <span>{r.file ? `${r.file.name} · ${formatBytes(r.file.size)}` : r.url}</span>
                <button className={s.textBtn} onClick={() => setRows((x) => x.filter((y) => y.key !== r.key))}>Remove</button>
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
              {r.error && <div className={s.rowError}>{r.error}</div>}
            </div>
          ))}
          <div className="admin-inline-actions">
            <button className="admin-save-btn" disabled={busy || pending.some((r) => r.url && !r.title.trim())} onClick={submit}>
              {busy ? 'Uploading...' : `Upload ${pending.length} item${pending.length === 1 ? '' : 's'}`}
            </button>
            <button className="admin-cancel-btn" disabled={busy} onClick={() => setRows([])}>Clear</button>
          </div>
        </div>
      )}
    </>
  );
}
