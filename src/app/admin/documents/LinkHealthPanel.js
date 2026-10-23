'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api, progressText } from './api';
import { uploadFile, deleteUpload, useUnloadGuard, MAX_FILE_BYTES } from './uploader';
import ProgressBar from './ProgressBar';
import { useToast } from '@/components/admin/Toast';
import s from './documents.module.css';

// Prefix cells that spreadsheets would evaluate as formulas (CSV injection), then quote.
const csvCell = (v) => {
  const t = String(v ?? '');
  const safe = /^[=+\-@\t\r]/.test(t) ? `'${t}` : t;
  return `"${safe.replace(/"/g, '""')}"`;
};

function downloadCsv(rows) {
  const head = ['Section', 'Title', 'Legacy URL', 'Status', 'HTTP code'];
  const lines = [head, ...rows.map((d) => [d.folder_name, d.title, d.external_url, d.link_status || d.status, d.link_http_code ?? d.http_code ?? ''])]
    .map((r) => r.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([lines], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = `links-needing-attention-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Neutral summary of the last link check plus the persisted list of documents whose legacy URL is dead.
 * `result` is the latest POST /link-check response (or null); `version` bumps whenever documents changed elsewhere.
 */
export default function LinkHealthPanel({ result, version, onOpen, onChanged, onError }) {
  const toast = useToast();
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(() => new Set());
  const [busyId, setBusyId] = useState(null);
  const fileRef = useRef(null);
  const targetRef = useRef(null);
  const [prog, setProg] = useState(null); // { id, loaded, total, processing }
  useUnloadGuard(busyId !== null);

  // Persisted broken set: survives reloads without re-probing every URL.
  useEffect(() => {
    let live = true;
    api('/api/documents?linkStatus=broken')
      .then(({ documents }) => { if (live) setRows(documents); })
      .catch((e) => { if (live) onError(e.message); });
    return () => { live = false; };
  }, [version, result, onError]);

  const groups = useMemo(() => {
    const m = new Map();
    for (const d of rows || []) {
      if (!m.has(d.folder_id)) m.set(d.folder_id, { name: d.folder_name, items: [] });
      m.get(d.folder_id).items.push(d);
    }
    return [...m.entries()];
  }, [rows]);

  if (rows === null) return null;
  if (!result && rows.length === 0) return null;

  const attention = rows.length;
  const checkedAt = result?.checkedAt || rows.map((d) => d.link_checked_at).filter(Boolean).sort().pop();
  const toggle = (id) => setOpen((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const replace = async (file) => {
    const d = targetRef.current;
    if (!file || !d) return;
    if (file.size > MAX_FILE_BYTES) { onError('File is larger than 100 MB'); if (fileRef.current) fileRef.current.value = ''; return; }
    setBusyId(d.id); onError('');
    let uploadId = null;
    try {
      uploadId = await uploadFile(file, { onProgress: ({ loaded, total }) => setProg({ id: d.id, loaded, total }) });
      setProg({ id: d.id, loaded: file.size, total: file.size, processing: true });
      const res = await api(`/api/documents/${d.id}`, { method: 'PUT', json: { uploadId } });
      setRows((cur) => (cur || []).filter((x) => x.id !== d.id));
      toast(res.warning ? `Stored "${d.title}". ${res.warning}` : `Stored "${d.title}". It is no longer flagged.`);
      await onChanged();
    } catch (e) {
      if (uploadId && e.status === 404) { // the replace may have gone through and only its response was lost
        onError('This file may already be saved. Refreshing the list; check it before uploading again.');
        await onChanged();
      } else { if (uploadId) deleteUpload(uploadId); onError(e.message); }
    } finally { setBusyId(null); setProg(null); if (fileRef.current) fileRef.current.value = ''; }
  };

  const parts = [];
  if (result) parts.push(`${result.ok} OK`);
  const unreachable = rows.filter((d) => (d.link_status || d.status) === 'error').length;
  parts.push(`${attention - unreachable} need the original PDF`);
  if (unreachable) parts.push(`${unreachable} unreachable (retry later)`);
  if (result) parts.push(`${result.stored} stored in App Storage`);

  return (
    <div className={`${s.health} ${attention ? s.healthWarn : s.healthOk}`} style={{ gridColumn: '1 / -1' }}>
      <div className={s.healthHead}>
        <div>
          <strong>{attention ? 'Links needing attention' : 'All checked links are healthy'}</strong>
          <div className={s.healthSummary}>
            {parts.join(' · ')}{checkedAt ? ` · checked ${new Date(checkedAt).toLocaleString()}` : ''}
          </div>
          {attention > 0 && <div className={s.healthSummary}>These documents still point at the old site. Upload the original file and the flag clears immediately.</div>}
        </div>
        {attention > 0 && <button className="admin-cancel-btn" onClick={() => downloadCsv(rows)}>Download CSV</button>}
      </div>
      {groups.map(([fid, g]) => (
        <div key={fid} className={s.healthGroup}>
          <button className={s.healthGroupBtn} aria-expanded={open.has(fid)} onClick={() => toggle(fid)}>
            <span>{open.has(fid) ? '▾' : '▸'} {g.name}</span><span className={s.healthCount}>{g.items.length}</span>
          </button>
          {open.has(fid) && (
            <ul className={s.healthList}>
              {g.items.map((d) => (
                <li key={d.id}>
                  <span className={s.healthTitle}>{d.title}<small>{d.link_http_code ? `HTTP ${d.link_http_code}` : d.link_status}</small></span>
                  <span className={s.actions}>
                    <button className={s.textBtn} onClick={() => onOpen(d)}>Open</button>
                    <button className={s.textBtn} disabled={busyId === d.id} onClick={() => { targetRef.current = d; fileRef.current?.click(); }}>
                      {busyId === d.id ? 'Uploading...' : 'Replace file'}
                    </button>
                  </span>
                  {prog?.id === d.id && (
                    <div style={{ flexBasis: '100%' }}>
                      <ProgressBar percent={prog.processing ? 100 : (prog.loaded / prog.total) * 100} label={prog.processing ? 'Processing…' : progressText(prog.loaded, prog.total)} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
      <input ref={fileRef} type="file" hidden accept=".pdf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg" onChange={(e) => replace(e.target.files?.[0])} />
    </div>
  );
}
