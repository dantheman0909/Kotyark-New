'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './cms.css';
import { formatDate, useApi } from './api';

function Node({ node, siblings, index, depth, expanded, toggle, onMove, onDelete, onAddChild, busy }) {
  const hasKids = node.children.length > 0;
  const open = expanded.has(node.id);
  return (
    <li>
      <div className="cmsa-node">
        <button type="button" className="cmsa-toggle" onClick={() => toggle(node.id)} disabled={!hasKids}
          aria-label={open ? 'Collapse' : 'Expand'} aria-expanded={hasKids ? open : undefined}>{hasKids ? (open ? '▾' : '▸') : '·'}</button>
        <Link className="title" href={`/admin/pages/${node.id}`}>{node.title}</Link>
        <span className="path">{node.path}</span>
        <span className={`cmsa-badge ${node.status}`}>{node.status}</span>
        {node.showInNav && <span className="cmsa-hint">in nav</span>}
        <span className="cmsa-hint">{formatDate(node.updatedAt)}</span>
        <span className="cmsa-actions">
          <button type="button" className="cmsa-btn sm icon" disabled={busy || index === 0} onClick={() => onMove(siblings, index, -1)} aria-label={`Move ${node.title} up`}>↑</button>
          <button type="button" className="cmsa-btn sm icon" disabled={busy || index === siblings.length - 1} onClick={() => onMove(siblings, index, 1)} aria-label={`Move ${node.title} down`}>↓</button>
          <Link className="cmsa-btn sm" href={`/admin/pages/${node.id}`}>Edit</Link>
          {node.status === 'published' && <a className="cmsa-btn sm" href={node.path} target="_blank" rel="noopener noreferrer">View</a>}
          <button type="button" className="cmsa-btn sm" onClick={() => onAddChild(node)}>Add sub-page</button>
          <button type="button" className="cmsa-btn sm danger" disabled={busy || node.path === '/'} onClick={() => onDelete(node)}>Delete</button>
        </span>
      </div>
      {hasKids && open && (
        <ul className="cmsa-tree">
          {node.children.map((c, i) => (
            <Node key={c.id} node={c} siblings={node.children} index={i} depth={depth + 1} expanded={expanded} toggle={toggle}
              onMove={onMove} onDelete={onDelete} onAddChild={onAddChild} busy={busy} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function PagesTree() {
  const api = useApi();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(new Set());
  const [form, setForm] = useState(null); // { title, parentId } when the "new page" form is open

  const load = useCallback(async () => {
    try {
      const d = await api('/api/pages');
      setData(d);
      setExpanded((cur) => (cur.size ? cur : new Set(d.pages.map((p) => p.id))));
    } catch (e) { if (e.status !== 401) setError(e.message); }
  }, [api]);
  useEffect(() => { load(); }, [load]);

  const toggle = (id) => setExpanded((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const move = async (siblings, index, delta) => {
    const j = index + delta;
    const order = [...siblings];
    [order[index], order[j]] = [order[j], order[index]];
    setBusy(true); setError('');
    try {
      await api('/api/pages/reorder', { method: 'POST', body: { items: order.map((p, i) => ({ id: p.id, navOrder: i })) } });
      await load();
    } catch (e) { if (e.status !== 401) setError(e.message); }
    finally { setBusy(false); }
  };

  const remove = async (node) => {
    if (!window.confirm(`Delete "${node.title}" (${node.path})? This cannot be undone.`)) return;
    setBusy(true); setError('');
    try {
      await api(`/api/pages/${node.id}`, { method: 'DELETE' });
      await load();
    } catch (e) { if (e.status !== 401) setError(e.message); }
    finally { setBusy(false); }
  };

  const create = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setBusy(true); setError('');
    try {
      const d = await api('/api/pages', { method: 'POST', body: { title: form.title.trim(), parentId: form.parentId || null } });
      router.push(`/admin/pages/${d.page.id}`);
    } catch (err) { if (err.status !== 401) setError(err.message); setBusy(false); }
  };

  const options = useMemo(() => (data ? data.pages : []), [data]);

  return (
    <div className="cmsa">
      <div className="cmsa-head">
        <h1>Pages</h1>
        <div className="cmsa-actions">
          <Link className="cmsa-btn" href="/admin/navigation">Navigation</Link>
          <Link className="cmsa-btn" href="/admin/redirects">Redirects</Link>
          <button type="button" className="cmsa-btn primary" onClick={() => setForm({ title: '', parentId: '' })}>+ New page</button>
        </div>
      </div>

      {error && <div className="cmsa-alert error" role="alert">{error}</div>}

      {form && (
        <form className="cmsa-card" onSubmit={create}>
          <h2>New page</h2>
          <div className="cmsa-row" style={{ marginTop: 12 }}>
            <div className="cmsa-field">
              <label className="cmsa-label" htmlFor="np-title">Title</label>
              <input id="np-title" type="text" autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="cmsa-field">
              <label className="cmsa-label" htmlFor="np-parent">Parent page</label>
              <select id="np-parent" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
                <option value="">(none, top level)</option>
                {options.map((p) => <option key={p.id} value={p.id}>{p.title} ({p.path})</option>)}
              </select>
            </div>
          </div>
          <div className="cmsa-actions">
            <button type="submit" className="cmsa-btn primary" disabled={busy || !form.title.trim()}>Create draft</button>
            <button type="button" className="cmsa-btn" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="cmsa-card">
        {!data && !error && <p>Loading…</p>}
        {data && data.tree.length === 0 && <p className="cmsa-hint">No CMS pages yet. The public site is showing its built-in pages. Create a page, or import the existing pages with the content migration.</p>}
        {data && data.tree.length > 0 && (
          <ul className="cmsa-tree">
            {data.tree.map((n, i) => (
              <Node key={n.id} node={n} siblings={data.tree} index={i} depth={0} expanded={expanded} toggle={toggle}
                onMove={move} onDelete={remove} busy={busy} onAddChild={(p) => setForm({ title: '', parentId: p.id })} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
