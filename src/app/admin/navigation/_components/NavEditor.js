'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import '@/app/admin/pages/_components/cms.css';
import { beforeUnloadGuard, useApi } from '@/app/admin/pages/_components/api';

const uid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

const fromServer = (items) => items.map((i) => ({
  key: uid(), label: i.label, kind: i.pageId ? 'page' : 'url', pageId: i.pageId || '', url: i.url || '',
  children: (i.children || []).map((c) => ({ key: uid(), label: c.label, kind: c.pageId ? 'page' : 'url', pageId: c.pageId || '', url: c.url || '', children: [] })),
}));

const toServer = (items) => items.map((i) => ({
  label: i.label,
  ...(i.kind === 'page' ? { pageId: i.pageId } : { url: i.url }),
  children: i.children.map((c) => ({ label: c.label, ...(c.kind === 'page' ? { pageId: c.pageId } : { url: c.url }) })),
}));

function ItemRow({ item, pages, onChange, onMove, onRemove, canUp, canDown, child, onAddChild }) {
  return (
    <div className="cmsa-list-item" style={child ? { marginLeft: 28 } : undefined}>
      <div className="cmsa-row" style={{ alignItems: 'end' }}>
        <div className="cmsa-field" style={{ marginBottom: 0 }}>
          <label className="cmsa-label">Label</label>
          <input type="text" value={item.label} onChange={(e) => onChange({ ...item, label: e.target.value })} />
        </div>
        <div className="cmsa-field" style={{ marginBottom: 0 }}>
          <label className="cmsa-label">Links to</label>
          <select value={item.kind === 'page' ? item.pageId : '__url'} onChange={(e) => {
            const v = e.target.value;
            if (v === '__url') onChange({ ...item, kind: 'url', pageId: '' });
            else onChange({ ...item, kind: 'page', pageId: v, url: '' });
          }}>
            {item.kind === 'page' && !item.pageId && <option value="">Select a page…</option>}
            <option value="__url">Custom URL…</option>
            {pages.map((p) => <option key={p.id} value={p.id}>{p.title} ({p.path}){p.status !== 'published' ? ' [draft]' : ''}</option>)}
          </select>
        </div>
        {item.kind === 'url' && (
          <div className="cmsa-field" style={{ marginBottom: 0 }}>
            <label className="cmsa-label">URL</label>
            <input type="text" value={item.url} placeholder="/path or https://…" onChange={(e) => onChange({ ...item, url: e.target.value })} />
          </div>
        )}
      </div>
      <div className="cmsa-actions" style={{ marginTop: 8 }}>
        <button type="button" className="cmsa-btn sm icon" disabled={!canUp} onClick={() => onMove(-1)} aria-label="Move up">↑</button>
        <button type="button" className="cmsa-btn sm icon" disabled={!canDown} onClick={() => onMove(1)} aria-label="Move down">↓</button>
        {!child && <button type="button" className="cmsa-btn sm" onClick={onAddChild}>+ Sub-item</button>}
        <button type="button" className="cmsa-btn sm danger" onClick={onRemove}>Remove</button>
      </div>
    </div>
  );
}

const swap = (arr, i, d) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const n = [...arr];
  [n[i], n[j]] = [n[j], n[i]];
  return n;
};

export default function NavEditor() {
  const api = useApi();
  const [menu, setMenu] = useState('header');
  const [items, setItems] = useState(null);
  const [saved, setSaved] = useState('');
  const [pages, setPages] = useState([]);
  const [pick, setPick] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const dirty = items !== null && JSON.stringify(toServer(items)) !== saved;
  useEffect(() => beforeUnloadGuard(dirty), [dirty]);

  const load = useCallback(async (m) => {
    setItems(null);
    try {
      const [nav, list] = await Promise.all([api(`/api/nav?menu=${m}`), api('/api/pages')]);
      const next = fromServer(nav.items);
      setItems(next);
      setSaved(JSON.stringify(toServer(next)));
      setPages(list.pages);
    } catch (e) { if (e.status !== 401) setMsg({ type: 'error', text: e.message }); }
  }, [api]);
  useEffect(() => { load(menu); }, [load, menu]);

  const switchMenu = (m) => {
    if (m === menu) return;
    if (dirty && !window.confirm('Discard unsaved changes to this menu?')) return;
    setMsg(null);
    setMenu(m);
  };

  const pageById = useMemo(() => new Map(pages.map((p) => [p.id, p])), [pages]);
  const update = (i, v) => setItems(items.map((x, k) => (k === i ? v : x)));
  const updateChild = (i, ci, v) => update(i, { ...items[i], children: items[i].children.map((c, k) => (k === ci ? v : c)) });

  const addPage = () => {
    if (!pick) return;
    setItems([...items, { key: uid(), label: pageById.get(pick)?.title || 'Page', kind: 'page', pageId: pick, url: '', children: [] }]);
    setPick('');
  };

  const save = async () => {
    setBusy(true); setMsg(null);
    try {
      await api(`/api/nav?menu=${menu}`, { method: 'PUT', body: { items: toServer(items) } });
      setSaved(JSON.stringify(toServer(items)));
      setMsg({ type: 'ok', text: `${menu === 'header' ? 'Header' : 'Footer'} menu saved and live.` });
    } catch (e) { if (e.status !== 401) setMsg({ type: 'error', text: e.message }); }
    finally { setBusy(false); }
  };

  return (
    <div className="cmsa">
      <div className="cmsa-head">
        <h1>Navigation</h1>
        <div className="cmsa-actions">
          <Link className="cmsa-btn" href="/admin/pages">Pages</Link>
          <button type="button" className="cmsa-btn primary" onClick={save} disabled={busy || !dirty}>{busy ? 'Saving…' : 'Save menu'}</button>
        </div>
      </div>
      <div className="cmsa-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={menu === 'header'} className={menu === 'header' ? 'on' : ''} onClick={() => switchMenu('header')}>Header menu</button>
        <button type="button" role="tab" aria-selected={menu === 'footer'} className={menu === 'footer' ? 'on' : ''} onClick={() => switchMenu('footer')}>Footer menu</button>
      </div>
      {msg && <div className={`cmsa-alert ${msg.type}`} role="status">{msg.text}</div>}
      <p className="cmsa-hint" style={{ marginBottom: 12 }}>
        {menu === 'header'
          ? 'One level of sub-items shows as a dropdown. If the header menu is empty the original built-in menu is used.'
          : 'Top-level items without sub-items are listed under "Company"; an item with sub-items becomes its own column (up to two columns). If empty, the original footer links are used.'}
        {' '}Links to unpublished pages are hidden from the public site automatically.
      </p>
      {items === null && <p>Loading…</p>}
      {items && (
        <>
          <div className="cmsa-card">
            {items.length === 0 && <p className="cmsa-hint">This menu is empty.</p>}
            {items.map((item, i) => (
              <div key={item.key}>
                <ItemRow item={item} pages={pages} canUp={i > 0} canDown={i < items.length - 1}
                  onChange={(v) => update(i, v)} onMove={(d) => setItems(swap(items, i, d))}
                  onRemove={() => setItems(items.filter((_, k) => k !== i))}
                  onAddChild={() => update(i, { ...item, children: [...item.children, { key: uid(), label: '', kind: 'url', pageId: '', url: '', children: [] }] })} />
                {item.children.map((c, ci) => (
                  <ItemRow key={c.key} item={c} pages={pages} child canUp={ci > 0} canDown={ci < item.children.length - 1}
                    onChange={(v) => updateChild(i, ci, v)}
                    onMove={(d) => update(i, { ...item, children: swap(item.children, ci, d) })}
                    onRemove={() => update(i, { ...item, children: item.children.filter((_, k) => k !== ci) })} />
                ))}
              </div>
            ))}
          </div>
          <div className="cmsa-card">
            <h2 style={{ marginBottom: 10 }}>Add a link</h2>
            <div className="cmsa-actions">
              <select style={{ width: 'auto', minWidth: 260 }} value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Page to add">
                <option value="">Choose a page…</option>
                {pages.map((p) => <option key={p.id} value={p.id}>{p.title} ({p.path}){p.status !== 'published' ? ' [draft]' : ''}</option>)}
              </select>
              <button type="button" className="cmsa-btn" onClick={addPage} disabled={!pick}>+ Add page link</button>
              <button type="button" className="cmsa-btn" onClick={() => setItems([...items, { key: uid(), label: '', kind: 'url', pageId: '', url: '', children: [] }])}>+ Add custom link</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
