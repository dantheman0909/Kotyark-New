'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import '@/app/admin/pages/_components/cms.css';
import { formatDate, useApi } from '@/app/admin/pages/_components/api';

const CODES = [301, 302, 308];
const empty = { fromPath: '', toPath: '', code: 301 };

function CodeSelect({ value, onChange, id }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: 'auto' }}>
      {CODES.map((c) => <option key={c} value={c}>{c}{c === 301 || c === 308 ? ' permanent' : ' temporary'}</option>)}
    </select>
  );
}

export default function RedirectsManager() {
  const api = useApi();
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null); // original fromPath of the row being edited
  const [draft, setDraft] = useState(empty);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setRows((await api('/api/redirects')).redirects); }
    catch (e) { if (e.status !== 401) setMsg({ type: 'error', text: e.message }); }
  }, [api]);
  useEffect(() => { load(); }, [load]);

  const run = async (fn, ok) => {
    setBusy(true); setMsg(null);
    try { await fn(); setMsg({ type: 'ok', text: ok }); await load(); return true; }
    catch (e) { if (e.status !== 401) setMsg({ type: 'error', text: e.message }); return false; }
    finally { setBusy(false); }
  };

  const add = async (e) => {
    e.preventDefault();
    if (await run(() => api('/api/redirects', { method: 'POST', body: form }), 'Redirect added.')) setForm(empty);
  };
  const saveEdit = async () => {
    if (await run(() => api(`/api/redirects?from=${encodeURIComponent(editing)}`, { method: 'PUT', body: draft }), 'Redirect updated.')) setEditing(null);
  };
  const remove = (r) => {
    if (!window.confirm(`Delete the redirect from ${r.fromPath}?`)) return;
    run(() => api(`/api/redirects?from=${encodeURIComponent(r.fromPath)}`, { method: 'DELETE' }), 'Redirect deleted.');
  };

  return (
    <div className="cmsa">
      <div className="cmsa-head">
        <h1>Redirects</h1>
        <Link className="cmsa-btn" href="/admin/pages">Pages</Link>
      </div>
      <p className="cmsa-hint" style={{ marginBottom: 12 }}>
        Renaming or moving a published page adds a permanent redirect automatically. Add manual ones here (for example for an old URL that no longer exists).
        A redirect only runs when no published page lives at the &ldquo;from&rdquo; path.
      </p>
      {msg && <div className={`cmsa-alert ${msg.type}`} role="status">{msg.text}</div>}

      <form className="cmsa-card" onSubmit={add}>
        <h2 style={{ marginBottom: 12 }}>Add a redirect</h2>
        <div className="cmsa-row">
          <div className="cmsa-field">
            <label className="cmsa-label" htmlFor="rd-from">From path</label>
            <input id="rd-from" type="text" value={form.fromPath} placeholder="/old-page" onChange={(e) => setForm({ ...form, fromPath: e.target.value })} />
          </div>
          <div className="cmsa-field">
            <label className="cmsa-label" htmlFor="rd-to">To (path or https URL)</label>
            <input id="rd-to" type="text" value={form.toPath} placeholder="/new-page" onChange={(e) => setForm({ ...form, toPath: e.target.value })} />
          </div>
        </div>
        <div className="cmsa-actions">
          <CodeSelect id="rd-code" value={form.code} onChange={(code) => setForm({ ...form, code })} />
          <button type="submit" className="cmsa-btn primary" disabled={busy || !form.fromPath || !form.toPath}>Add redirect</button>
        </div>
      </form>

      <div className="cmsa-card cmsa-scroll">
        {!rows && <p>Loading…</p>}
        {rows && rows.length === 0 && <p className="cmsa-hint">No redirects yet.</p>}
        {rows && rows.length > 0 && (
          <table className="cmsa-table">
            <thead><tr><th>From</th><th>To</th><th>Code</th><th>Created</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => (editing === r.fromPath ? (
                <tr key={r.fromPath}>
                  <td><input type="text" aria-label="From path" value={draft.fromPath} onChange={(e) => setDraft({ ...draft, fromPath: e.target.value })} /></td>
                  <td><input type="text" aria-label="To" value={draft.toPath} onChange={(e) => setDraft({ ...draft, toPath: e.target.value })} /></td>
                  <td><CodeSelect value={draft.code} onChange={(code) => setDraft({ ...draft, code })} /></td>
                  <td />
                  <td className="cmsa-actions">
                    <button type="button" className="cmsa-btn sm primary" disabled={busy} onClick={saveEdit}>Save</button>
                    <button type="button" className="cmsa-btn sm" onClick={() => setEditing(null)}>Cancel</button>
                  </td>
                </tr>
              ) : (
                <tr key={r.fromPath}>
                  <td><code>{r.fromPath}</code></td>
                  <td><code>{r.toPath}</code></td>
                  <td>{r.code}</td>
                  <td>{formatDate(r.createdAt)}</td>
                  <td className="cmsa-actions">
                    <button type="button" className="cmsa-btn sm" disabled={busy} onClick={() => { setEditing(r.fromPath); setDraft({ fromPath: r.fromPath, toPath: r.toPath, code: r.code }); }}>Edit</button>
                    <button type="button" className="cmsa-btn sm danger" disabled={busy} onClick={() => remove(r)}>Delete</button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
