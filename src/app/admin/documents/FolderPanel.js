'use client';
import { useState } from 'react';
import { api } from './api';
import s from './documents.module.css';

const EMPTY = { name: '', description: '', group_by: 'none', visible: true, intro_html: '' };

function FolderForm({ initial, onSave, onCancel, saving, submitLabel }) {
  const [f, setF] = useState({ ...EMPTY, ...initial });
  const up = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  return (
    <form className={s.folderForm} onSubmit={(e) => { e.preventDefault(); onSave(f); }}>
      <label className={s.field}>Name
        <input className={s.input} value={f.name} onChange={up('name')} required maxLength={200} autoFocus />
      </label>
      <label className={s.field}>Short description (shown on the Investor hub)
        <input className={s.input} value={f.description} onChange={up('description')} maxLength={1000} />
      </label>
      <label className={s.field}>Group documents by
        <select className="admin-select" value={f.group_by} onChange={up('group_by')}>
          <option value="none">No grouping</option>
          <option value="fy">Financial year</option>
          <option value="year">Calendar year of document date</option>
        </select>
      </label>
      <label className={s.field}>Intro (HTML; sanitized on save)
        <textarea className={s.textarea} value={f.intro_html} onChange={up('intro_html')} />
      </label>
      <label className={s.check}><input type="checkbox" checked={f.visible} onChange={up('visible')} /> Visible on the public site</label>
      <div className="admin-inline-actions">
        <button className="admin-save-btn" disabled={saving || !f.name.trim()}>{saving ? 'Saving...' : submitLabel}</button>
        <button type="button" className="admin-cancel-btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function FolderPanel({ folders, selectedId, onSelect, onChanged, onError }) {
  const [mode, setMode] = useState(null); // 'new' | folderId being edited
  const [saving, setSaving] = useState(false);

  const run = async (fn) => {
    setSaving(true); onError('');
    try { await fn(); await onChanged(); setMode(null); } catch (e) { onError(e.message); } finally { setSaving(false); }
  };

  const create = (f) => run(async () => {
    const { folder } = await api('/api/folders', { method: 'POST', json: f });
    onSelect(folder.id);
  });
  const update = (id, f) => run(() => api(`/api/folders/${id}`, {
    method: 'PUT',
    json: { name: f.name, description: f.description, group_by: f.group_by, visible: f.visible, intro_html: f.intro_html },
  }));
  const toggleVisible = (f) => run(() => api(`/api/folders/${f.id}`, { method: 'PUT', json: { visible: !f.visible } }));
  const remove = (f) => {
    if (!window.confirm(`Delete the folder "${f.name}"? This cannot be undone.`)) return;
    run(async () => { await api(`/api/folders/${f.id}`, { method: 'DELETE' }); if (selectedId === f.id) onSelect(null); });
  };
  const move = (idx, dir) => {
    const ids = folders.map((f) => f.id);
    const j = idx + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    run(() => api('/api/folders/reorder', { method: 'POST', json: { ids } }));
  };

  return (
    <div className={s.col}>
      <div className="admin-panel-header">
        <h2>Folders</h2>
        <button className="admin-add-btn" title="New folder" aria-label="New folder" onClick={() => setMode('new')}>+</button>
      </div>
      {mode === 'new' && <FolderForm onSave={create} onCancel={() => setMode(null)} saving={saving} submitLabel="Create folder" />}
      {folders.length === 0 && mode !== 'new' && <div className={s.empty}>No folders yet.</div>}
      {folders.map((f, i) => (
        <div key={f.id}>
          {mode === f.id ? (
            <FolderForm initial={f} onSave={(v) => update(f.id, v)} onCancel={() => setMode(null)} saving={saving} submitLabel="Save" />
          ) : (
            <div className={`${s.folderRow} ${selectedId === f.id ? s.folderRowActive : ''}`} onClick={() => onSelect(f.id)}>
              <div className={s.folderMain}>
                <div className={s.folderName}>{f.name} {!f.visible && <span className="admin-tag hidden-tag">Hidden</span>}</div>
                <div className={s.folderMeta}>/investors/{f.slug} · {f.document_count} doc{f.document_count === 1 ? '' : 's'}</div>
              </div>
              <div className={s.folderBtns} onClick={(e) => e.stopPropagation()}>
                <button className="admin-icon-btn" title="Move up" aria-label="Move up" disabled={saving || i === 0} onClick={() => move(i, -1)}>↑</button>
                <button className="admin-icon-btn" title="Move down" aria-label="Move down" disabled={saving || i === folders.length - 1} onClick={() => move(i, 1)}>↓</button>
                <button className="admin-icon-btn" title={f.visible ? 'Hide from public site' : 'Show on public site'} aria-label="Toggle visibility" onClick={() => toggleVisible(f)}>{f.visible ? '◉' : '○'}</button>
                <button className="admin-icon-btn" title="Edit / rename" aria-label="Edit folder" onClick={() => setMode(f.id)}>✎</button>
                <button className="admin-icon-btn admin-delete-btn" title="Delete" aria-label="Delete folder" onClick={() => remove(f)}>✕</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
