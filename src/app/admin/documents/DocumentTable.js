'use client';
import { useEffect, useRef, useState } from 'react';
import { api, formatBytes, DATE_RE, DATE_PATTERN } from './api';
import s from './documents.module.css';

const LINK_BADGE = { ok: ['ok', 'OK'], broken: ['broken', 'Broken: upload original'], error: ['err', 'Unreachable'], unchecked: ['muted', 'Unchecked'], 'n/a': ['muted', 'Stored'] };

function LinkBadge({ doc }) {
  const [cls, label] = LINK_BADGE[doc.link_status] || LINK_BADGE.unchecked;
  const title = doc.link_checked_at ? `Checked ${new Date(doc.link_checked_at).toLocaleString()}${doc.link_http_code ? ` (HTTP ${doc.link_http_code})` : ''}` : '';
  return <span className={`${s.badge} ${s[cls]}`} title={title}>{label}</span>;
}

function EditRow({ doc, onDone, onError }) {
  const [f, setF] = useState({
    title: doc.title, description: doc.description, fy: doc.fy || '', doc_date: doc.doc_date || '',
    status: doc.status, sort_order: doc.sort_order, externalUrl: doc.external_url || '',
  });
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const up = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    if (f.doc_date && !DATE_RE.test(f.doc_date)) { onError('Date must be YYYY-MM-DD'); return; }
    setBusy(true); onError('');
    try {
      const json = { title: f.title, description: f.description, fy: f.fy, doc_date: f.doc_date, status: f.status, sort_order: Number(f.sort_order) || 0 };
      if (!doc.storage_key || f.externalUrl !== (doc.external_url || '')) json.externalUrl = f.externalUrl;
      await api(`/api/documents/${doc.id}`, { method: 'PUT', json });
      await onDone(true);
    } catch (e) { onError(e.message); setBusy(false); }
  };
  const replace = async (file) => {
    if (!file) return;
    setBusy(true); onError('');
    try {
      const fd = new FormData(); fd.append('file', file);
      await api(`/api/documents/${doc.id}`, { method: 'PUT', formData: fd });
      await onDone(true);
    } catch (e) { onError(e.message); setBusy(false); }
  };

  return (
    <tr className={s.editRow}>
      <td colSpan={8}>
        <div className={s.formGrid}>
          <label className={s.field} style={{ gridColumn: 'span 2' }}>Title
            <input className={s.input} value={f.title} onChange={up('title')} maxLength={300} />
          </label>
          <label className={s.field}>Date (YYYY-MM-DD)
            <input className={s.input} value={f.doc_date} onChange={up('doc_date')} pattern={DATE_PATTERN} placeholder="2025-02-11" inputMode="numeric" />
          </label>
          <label className={s.field}>Financial year
            <input className={s.input} value={f.fy} onChange={up('fy')} placeholder="FY 2024-25" />
          </label>
          <label className={s.field}>Status
            <select className="admin-select" value={f.status} onChange={up('status')}>
              <option value="published">Published</option><option value="draft">Draft</option>
            </select>
          </label>
          <label className={s.field}>Sort order
            <input className={s.input} type="number" value={f.sort_order} onChange={up('sort_order')} />
          </label>
          <label className={s.field} style={{ gridColumn: 'span 2' }}>Description
            <input className={s.input} value={f.description} onChange={up('description')} maxLength={2000} />
          </label>
          <label className={s.field} style={{ gridColumn: 'span 2' }}>External link {doc.storage_key ? '(optional fallback)' : ''}
            <input className={s.input} value={f.externalUrl} onChange={up('externalUrl')} placeholder="https://..." />
          </label>
        </div>
        <div className="admin-inline-actions" style={{ marginTop: 10 }}>
          <button className="admin-save-btn" disabled={busy || !f.title.trim()} onClick={save}>{busy ? 'Saving...' : 'Save'}</button>
          <button className="admin-cancel-btn" disabled={busy} onClick={() => onDone(false)}>Cancel</button>
          <button className="admin-cancel-btn" disabled={busy} onClick={() => fileRef.current?.click()}>Replace file...</button>
          <input ref={fileRef} type="file" hidden accept=".pdf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg" onChange={(e) => replace(e.target.files?.[0])} />
        </div>
        <div className={s.folderMeta} style={{ marginTop: 6 }}>Replacing a file keeps the same public URL ({doc.url}).</div>
      </td>
    </tr>
  );
}

export default function DocumentTable({ docs: allDocs, folders, folderId, onChanged, onError, highlightId }) {
  const [selected, setSelected] = useState(new Set());
  const [editing, setEditing] = useState(null);
  const [moveTo, setMoveTo] = useState('');
  const [onlyIssues, setOnlyIssues] = useState(false);
  const scrolled = useRef(null);
  const docs = onlyIssues ? allDocs.filter((d) => d.link_status === 'broken' || d.link_status === 'error') : allDocs;

  useEffect(() => {
    if (!highlightId || scrolled.current === highlightId) return;
    const el = document.getElementById(`doc-row-${highlightId}`);
    if (el) { scrolled.current = highlightId; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }, [highlightId, allDocs]);

  const toggle = (id) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = docs.length > 0 && docs.every((d) => selected.has(d.id));

  const remove = async (d) => {
    if (!window.confirm(`Delete "${d.title}"? The file is removed and its public URL will stop working.`)) return;
    onError('');
    try { await api(`/api/documents/${d.id}`, { method: 'DELETE' }); setSelected((p) => { const n = new Set(p); n.delete(d.id); return n; }); await onChanged(); }
    catch (e) { onError(e.message); }
  };
  const bulkMove = async () => {
    onError('');
    try { await api('/api/documents/bulk', { method: 'POST', json: { ids: [...selected], folderId: moveTo } }); setSelected(new Set()); setMoveTo(''); await onChanged(); }
    catch (e) { onError(e.message); }
  };

  if (allDocs.length === 0) return <div className={s.empty}>No documents in this folder yet. Drop files above to add some.</div>;

  return (
    <>
      <div className={s.toolbar}>
        <label className={s.filterToggle}>
          <input type="checkbox" checked={onlyIssues} onChange={(e) => setOnlyIssues(e.target.checked)} /> Show only links needing attention
        </label>
      </div>
      {onlyIssues && docs.length === 0 && <div className={s.empty}>No links need attention in this folder.</div>}
      {selected.size > 0 && (
        <div className={s.toolbar}>
          <strong style={{ fontSize: '0.85rem' }}>{selected.size} selected</strong>
          <select className="admin-select" style={{ width: 'auto', minWidth: 220 }} value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
            <option value="">Move to folder...</option>
            {folders.filter((f) => f.id !== folderId).map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <button className="admin-save-btn" disabled={!moveTo} onClick={bulkMove}>Move</button>
          <button className="admin-cancel-btn" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th><input type="checkbox" aria-label="Select all" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(docs.map((d) => d.id)))} /></th>
              <th>Title</th><th>FY</th><th>Date</th><th>Status</th><th>Link</th><th>Size</th><th />
            </tr>
          </thead>
          <tbody>
            {docs.flatMap((d) => [
              <tr key={d.id} id={`doc-row-${d.id}`} className={d.id === highlightId ? s.rowHighlight : undefined}>
                <td><input type="checkbox" aria-label={`Select ${d.title}`} checked={selected.has(d.id)} onChange={() => toggle(d.id)} /></td>
                <td className={s.titleCell}>
                  {d.title}
                  <small>{d.storage_key ? `/files/${d.slug}` : 'External link'}</small>
                </td>
                <td>{d.fy || '-'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{d.doc_date || '-'}</td>
                <td><span className={`${s.badge} ${s[d.status]}`}>{d.status}</span></td>
                <td><LinkBadge doc={d} /></td>
                <td style={{ whiteSpace: 'nowrap' }}>{d.storage_key ? formatBytes(d.size) : '-'}</td>
                <td>
                  <div className={s.actions}>
                    <a className={s.textBtn} href={d.url || '#'} target="_blank" rel="noopener noreferrer">View</a>
                    <button className={s.textBtn} onClick={() => setEditing(editing === d.id ? null : d.id)}>Edit</button>
                    <button className={`${s.textBtn} ${s.dangerBtn}`} onClick={() => remove(d)}>Delete</button>
                  </div>
                </td>
              </tr>,
              editing === d.id && (
                <EditRow key={`${d.id}-edit`} doc={d} onError={onError}
                  onDone={async (changed) => { setEditing(null); if (changed) await onChanged(); }} />
              ),
            ])}
          </tbody>
        </table>
      </div>
    </>
  );
}
