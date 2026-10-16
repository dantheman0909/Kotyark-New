'use client';
import { useCallback, useEffect, useState } from 'react';
import FormField from '@/components/admin/FormField';
import { api } from '@/components/admin/api';
import styles from '@/components/admin/admin.module.css';

const ENTITIES = ['page', 'document', 'folder', 'media', 'nav', 'redirect', 'setting', 'user', 'session', 'enquiry'];
const ACTIONS = ['create', 'update', 'delete', 'publish', 'unpublish', 'restore', 'upload', 'login', 'logout'];
const fmt = (d) => new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(new Date(d));
const EMPTY = { entity: '', action: '', user: '', from: '', to: '' };

export default function AuditClient() {
  const [filters, setFilters] = useState(EMPTY);
  const [applied, setApplied] = useState(EMPTY);
  const [rows, setRows] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(() => new Set());

  const fetchPage = useCallback(async (f, before) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(f)) if (v) sp.set(k, v);
    if (before) sp.set('before', before);
    return api(`/api/audit?${sp}`);
  }, []);

  useEffect(() => {
    let live = true;
    setLoading(true); setError('');
    fetchPage(applied).then((d) => {
      if (!live) return;
      setRows(d.rows); setCursor(d.nextCursor); if (d.users) setUsers(d.users);
    }).catch((e) => live && setError(e.message)).finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [applied, fetchPage]);

  const more = async () => {
    setLoading(true);
    try { const d = await fetchPage(applied, cursor); setRows((r) => [...r, ...d.rows]); setCursor(d.nextCursor); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const toggle = (id) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const set = (k) => (e) => setFilters((s) => ({ ...s, [k]: e.target.value }));

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Audit log</h1>
          <p className={styles.pageSub}>Every change made in the admin. Times are IST.</p>
        </div>
      </div>

      <form className={styles.filters} onSubmit={(e) => { e.preventDefault(); setApplied(filters); }}>
        <FormField label="Entity" as="select" value={filters.entity} onChange={set('entity')}>
          <option value="">All</option>{ENTITIES.map((x) => <option key={x}>{x}</option>)}
        </FormField>
        <FormField label="Action" as="select" value={filters.action} onChange={set('action')}>
          <option value="">All</option>{ACTIONS.map((x) => <option key={x}>{x}</option>)}
        </FormField>
        <FormField label="User" as="select" value={filters.user} onChange={set('user')}>
          <option value="">All</option>{users.map((x) => <option key={x}>{x}</option>)}
        </FormField>
        <FormField label="From" type="date" value={filters.from} max={filters.to || undefined} onChange={set('from')} />
        <FormField label="To" type="date" value={filters.to} min={filters.from || undefined} onChange={set('to')} />
        <button type="submit" className={styles.btn}>Apply</button>
        <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => { setFilters(EMPTY); setApplied(EMPTY); }}>Clear</button>
      </form>

      {error && <div className={styles.alert}>{error}</div>}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>When</th><th>User</th><th>Action</th><th>Entity</th><th>Summary</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ whiteSpace: 'nowrap' }}>{fmt(r.created_at)}</td>
                <td>{r.user_email || <span className={styles.muted}>system</span>}</td>
                <td><span className={styles.badge}>{r.action}</span></td>
                <td>{r.entity}{r.entity_id ? <div className={styles.muted}>{String(r.entity_id).slice(0, 36)}</div> : null}</td>
                <td>
                  {r.summary}
                  {r.diff ? (
                    <div>
                      <button type="button" className={styles.linkBtn} onClick={() => toggle(r.id)} aria-expanded={open.has(r.id)}>
                        {open.has(r.id) ? 'Hide changes' : 'Show changes'}
                      </button>
                      {open.has(r.id) && <pre className={styles.diff}>{JSON.stringify(r.diff, null, 2)}</pre>}
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && <tr><td colSpan={5} className={styles.empty}>No entries match.</td></tr>}
          </tbody>
        </table>
      </div>
      {loading && <p className={styles.empty}>Loading…</p>}
      {cursor && !loading && (
        <div className={styles.pager}><button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={more}>Load older entries</button></div>
      )}
    </>
  );
}
