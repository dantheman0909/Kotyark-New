'use client';
import { useCallback, useEffect, useState } from 'react';
import FormField from '@/components/admin/FormField';
import { useToast } from '@/components/admin/Toast';
import { api } from '@/components/admin/api';
import styles from '@/components/admin/admin.module.css';
import { SUBJECTS } from '@/lib/enquiry-rules';

const fmt = (d) => new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(d));
const STATUS_LABEL = { new: 'New', handled: 'Handled', spam: 'Spam' };
const PAGE_SIZE = 50;

export default function EnquiriesClient({ canWrite, canDelete }) {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [subject, setSubject] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ enquiries: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);
  const [notes, setNotes] = useState({});
  const [busyId, setBusyId] = useState(null);

  const qs = useCallback((extra = {}) => {
    const sp = new URLSearchParams();
    if (status) sp.set('status', status);
    if (subject) sp.set('subject', subject);
    for (const [k, v] of Object.entries(extra)) sp.set(k, v);
    return sp.toString();
  }, [status, subject]);

  useEffect(() => {
    let live = true;
    setLoading(true); setError('');
    api(`/api/enquiries?${qs({ page })}`)
      .then((d) => live && setData(d))
      .catch((e) => live && setError(e.message))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [qs, page]);

  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  const update = async (row, patch, okMsg) => {
    setBusyId(row.id);
    try {
      const { enquiry } = await api(`/api/enquiries/${row.id}`, { method: 'PATCH', body: patch });
      setData((d) => ({ ...d, enquiries: d.enquiries.map((r) => (r.id === row.id ? { ...r, ...enquiry } : r)) }));
      toast(okMsg);
    } catch (e) { toast(e.message, 'error'); } finally { setBusyId(null); }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete the enquiry from ${row.name}? This cannot be undone.`)) return;
    setBusyId(row.id);
    try {
      await api(`/api/enquiries/${row.id}`, { method: 'DELETE' });
      setData((d) => ({ ...d, enquiries: d.enquiries.filter((r) => r.id !== row.id), total: Math.max(0, d.total - 1) }));
      setOpenId(null);
      toast('Enquiry deleted');
    } catch (e) { toast(e.message, 'error'); } finally { setBusyId(null); }
  };

  const noteOf = (r) => (notes[r.id] !== undefined ? notes[r.id] : r.note || '');

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Enquiries</h1>
          <p className={styles.pageSub}>Messages from the website contact form. Times are IST.</p>
        </div>
        <a className={`${styles.btn} ${styles.btnGhost}`} href={`/api/enquiries/export?${qs()}`}>Export CSV</a>
      </div>

      <div className={styles.filters}>
        <FormField label="Status" as="select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </FormField>
        <FormField label="Subject" as="select" value={subject} onChange={(e) => { setSubject(e.target.value); setPage(1); }}>
          <option value="">All</option>
          {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
        </FormField>
        <span className={styles.muted} style={{ paddingBottom: 10 }}>{data.total} enquir{data.total === 1 ? 'y' : 'ies'}</span>
      </div>

      {error && <div className={styles.alert} role="alert">{error}</div>}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>Received</th><th>From</th><th>Subject</th><th>Status</th><th /></tr></thead>
          <tbody>
            {data.enquiries.map((r) => {
              const open = openId === r.id;
              return [
                <tr key={r.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmt(r.created_at)}</td>
                  <td><strong>{r.name}</strong><div className={styles.muted}>{r.email}</div></td>
                  <td>{r.subject}</td>
                  <td><span className={`${styles.badge} ${r.status === 'new' ? styles.badgeNew : r.status === 'spam' ? styles.badgeOff : ''}`}>{STATUS_LABEL[r.status]}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button type="button" className={styles.linkBtn} aria-expanded={open} onClick={() => setOpenId(open ? null : r.id)}>
                      {open ? 'Hide' : 'Read'}
                    </button>
                  </td>
                </tr>,
                open && (
                  <tr key={`${r.id}-d`}>
                    <td colSpan={5}>
                      <div className={styles.formRow}>
                        <div><div className={styles.label}>Email</div><a href={`mailto:${encodeURIComponent(r.email)}`}>{r.email}</a></div>
                        <div><div className={styles.label}>Phone</div>{r.phone || <span className={styles.muted}>-</span>}</div>
                        <div><div className={styles.label}>Company</div>{r.company || <span className={styles.muted}>-</span>}</div>
                        <div><div className={styles.label}>Monthly volume (KL)</div>{r.volume || <span className={styles.muted}>-</span>}</div>
                      </div>
                      <div className={styles.label} style={{ marginTop: 12 }}>Message</div>
                      <p style={{ whiteSpace: 'pre-wrap', margin: '4px 0 14px', overflowWrap: 'anywhere' }}>{r.message}</p>
                      {r.handled_at && <p className={styles.muted}>Handled {fmt(r.handled_at)}{r.handled_by_name || r.handled_by_email ? ` by ${r.handled_by_name || r.handled_by_email}` : ''}</p>}
                      <FormField label="Internal note" as="textarea" maxLength={2000} value={noteOf(r)} disabled={!canWrite}
                        onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))} />
                      {canWrite && (
                        <div className={styles.actions}>
                          {r.status !== 'handled' && <button type="button" className={styles.btn} disabled={busyId === r.id}
                            onClick={() => update(r, { status: 'handled', note: noteOf(r) }, 'Marked handled')}>Mark handled</button>}
                          {r.status !== 'spam' && <button type="button" className={`${styles.btn} ${styles.btnGhost}`} disabled={busyId === r.id}
                            onClick={() => update(r, { status: 'spam', note: noteOf(r) }, 'Marked spam')}>Mark spam</button>}
                          {r.status !== 'new' && <button type="button" className={`${styles.btn} ${styles.btnGhost}`} disabled={busyId === r.id}
                            onClick={() => update(r, { status: 'new', note: noteOf(r) }, 'Reopened')}>Reopen</button>}
                          <button type="button" className={`${styles.btn} ${styles.btnGhost}`} disabled={busyId === r.id || noteOf(r) === (r.note || '')}
                            onClick={() => update(r, { note: noteOf(r) }, 'Note saved')}>Save note</button>
                          {canDelete && <button type="button" className={`${styles.btn} ${styles.btnGhost}`} disabled={busyId === r.id}
                            onClick={() => remove(r)}>Delete</button>}
                        </div>
                      )}
                    </td>
                  </tr>
                ),
              ];
            })}
            {!loading && data.enquiries.length === 0 && <tr><td colSpan={5} className={styles.empty}>No enquiries match.</td></tr>}
          </tbody>
        </table>
      </div>
      {loading && <p className={styles.empty}>Loading…</p>}
      {pages > 1 && (
        <div className={styles.pager} style={{ gap: 10, alignItems: 'center' }}>
          <button type="button" className={`${styles.btn} ${styles.btnGhost}`} disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>Newer</button>
          <span className={styles.muted}>Page {page} of {pages}</span>
          <button type="button" className={`${styles.btn} ${styles.btnGhost}`} disabled={page >= pages || loading} onClick={() => setPage(page + 1)}>Older</button>
        </div>
      )}
    </>
  );
}
