import Link from 'next/link';
import { getCurrentUser, can } from '@/lib/auth';
import { loadDashboard } from '@/app/api/dashboard/stats';
import styles from '@/components/admin/admin.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dashboard' };

const fmt = (d) => d
  ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(d))
  : '';

export default async function Dashboard() {
  const user = await getCurrentUser();
  const canAudit = can(user, 'audit:read');
  const { counts, recent, broken, staleDrafts } = await loadDashboard({ includeAudit: canAudit });

  const cards = [
    { label: 'Published pages', value: counts.published_pages, href: '/admin/pages' },
    { label: 'Draft pages', value: counts.draft_pages, href: '/admin/pages' },
    { label: 'Documents', value: counts.documents, href: '/admin/documents' },
    { label: 'Broken links', value: counts.broken_links, href: '/admin/documents', warn: counts.broken_links > 0 },
    ...(can(user, 'enquiries:read') ? [{ label: 'New enquiries', value: counts.new_enquiries, href: '/admin/enquiries' }] : []),
    ...(can(user, 'users:manage') ? [{ label: 'Active users', value: counts.users, href: '/admin/users' }] : []),
  ];

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSub}>Welcome back, {user.name || user.email}.</p>
        </div>
      </div>

      <div className={styles.cards}>
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className={`${styles.card} ${styles.statCard} ${c.warn ? styles.statWarn : ''}`}>
            <div className={styles.statValue}>{c.value}</div>
            <div className={styles.statLabel}>{c.label}</div>
          </Link>
        ))}
      </div>

      <div className={styles.grid2}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Needs attention</h2>

          <h3 className={styles.label}>Broken document links ({counts.broken_links})</h3>
          {broken.length === 0 ? <p className={styles.empty}>No broken links.</p> : (
            <ul className={styles.list}>
              {broken.map((d) => (
                <li key={d.id}>
                  <strong>{d.title}</strong>
                  <div className={styles.muted}>
                    {d.folder_name || 'No folder'}{d.link_http_code ? ` · HTTP ${d.link_http_code}` : ''}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <h3 className={styles.label} style={{ marginTop: 16 }}>Drafts not updated in 14+ days</h3>
          {staleDrafts.length === 0 ? <p className={styles.empty}>No stale drafts.</p> : (
            <ul className={styles.list}>
              {staleDrafts.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/pages/${p.id}`}>{p.title}</Link>
                  <div className={styles.muted}>{p.path} · last updated {fmt(p.updated_at)}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {canAudit && recent && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Recent activity</h2>
          {recent.length === 0 ? <p className={styles.empty}>Nothing yet.</p> : (
            <ul className={styles.list}>
              {recent.map((r) => (
                <li key={r.id}>
                  <span className={styles.badge}>{r.action}</span>{' '}
                  {r.summary || `${r.entity} ${r.entity_id || ''}`}
                  <div className={styles.muted}>{r.user_email || 'system'} · {fmt(r.created_at)}</div>
                </li>
              ))}
            </ul>
          )}
          {canAudit && <p style={{ margin: '12px 0 0' }}><Link href="/admin/audit" className={styles.linkBtn}>View full audit log</Link></p>}
        </section>
        )}
      </div>
    </>
  );
}
