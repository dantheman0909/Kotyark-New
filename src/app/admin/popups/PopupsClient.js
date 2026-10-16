'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '@/components/admin/admin.module.css';
import ConfirmButton from '@/components/admin/ConfirmButton';
import { useToast } from '@/components/admin/Toast';
import { api } from '@/components/admin/api';
import { isoToIstText } from '@/lib/popup-config';

const LAYOUTS = { modal: 'Modal', 'slide-in': 'Slide-in', 'top-bar': 'Top bar', 'bottom-bar': 'Bottom bar', fullscreen: 'Full screen' };

function triggerText(r) {
  if (r.trigger === 'delay') return `After ${r.delaySeconds}s`;
  if (r.trigger === 'scroll') return `Scroll ${r.scrollPercent}%`;
  if (r.trigger === 'exit-intent') return 'Exit intent';
  return 'On load';
}
function pagesText(r) {
  const inc = r.includePaths.length ? r.includePaths.slice(0, 2).join(', ') + (r.includePaths.length > 2 ? ` +${r.includePaths.length - 2}` : '') : 'All pages';
  return r.excludePaths.length ? `${inc} (excl. ${r.excludePaths.length})` : inc;
}
function scheduleText(r) {
  if (!r.startAt && !r.endAt) return 'Always';
  return `${r.startAt ? isoToIstText(r.startAt) : 'Now'} to ${r.endAt ? isoToIstText(r.endAt) : 'no end'} IST`;
}

export default function PopupsClient() {
  const toast = useToast();
  const router = useRouter();
  const [popups, setPopups] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    try { setPopups((await api('/api/popups')).popups); setError(''); } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (key, fn, okMsg) => {
    setBusy(key);
    try { await fn(); toast(okMsg); await load(); } catch (e) { toast(e.message, 'error'); throw e; } finally { setBusy(''); }
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Pop-ups</h1>
          <p className={styles.pageSub}>On-brand announcements, offers and notices. Statistics cover the last 30 days.</p>
        </div>
        <Link href="/admin/popups/new" className={styles.btn}>New pop-up</Link>
      </div>
      {error && <div className={styles.alert} role="alert">{error}</div>}
      {!popups ? <p className={styles.empty}>Loading…</p> : popups.length === 0 ? (
        <div className={styles.card}><p className={styles.empty}>No pop-ups yet. Create one to get started.</p></div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr>
              <th>Name</th><th>Status</th><th>Layout</th><th>Trigger</th><th>Pages</th><th>Schedule</th>
              <th>Views</th><th>Clicks</th><th>CTR</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {popups.map((p) => {
                const ctr = p.stats.views ? `${((p.stats.clicks / p.stats.views) * 100).toFixed(1)}%` : '-';
                return (
                  <tr key={p.id}>
                    <td><Link href={`/admin/popups/${p.id}`}><strong>{p.name}</strong></Link>
                      <div className={styles.muted}>Priority {p.priority}</div></td>
                    <td><span className={`${styles.badge} ${p.status === 'published' ? '' : styles.badgeOff}`}>{p.status}</span></td>
                    <td>{LAYOUTS[p.design.layout]}</td>
                    <td>{triggerText(p.rules)}</td>
                    <td>{pagesText(p.rules)}</td>
                    <td>{scheduleText(p.rules)}</td>
                    <td>{p.stats.views}</td><td>{p.stats.clicks}</td><td>{ctr}</td>
                    <td>
                      <div className={styles.actions}>
                        <button type="button" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} onClick={() => router.push(`/admin/popups/${p.id}`)}>Edit</button>
                        <button type="button" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} disabled={!!busy}
                          onClick={() => act(`dup-${p.id}`, () => api(`/api/popups/${p.id}/duplicate`, { method: 'POST' }), 'Duplicated as a draft').catch(() => {})}>Duplicate</button>
                        <button type="button" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} disabled={!!busy}
                          onClick={() => act(`pub-${p.id}`, () => api(`/api/popups/${p.id}/${p.status === 'published' ? 'unpublish' : 'publish'}`, { method: 'POST' }),
                            p.status === 'published' ? 'Unpublished' : 'Published').catch(() => {})}>
                          {p.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                        <ConfirmButton title="Delete pop-up" confirmLabel="Delete" disabled={!!busy}
                          message={`Delete "${p.name}" and its statistics? This cannot be undone.`}
                          onConfirm={() => act(`del-${p.id}`, () => api(`/api/popups/${p.id}`, { method: 'DELETE' }), 'Deleted')}>Delete</ConfirmButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
