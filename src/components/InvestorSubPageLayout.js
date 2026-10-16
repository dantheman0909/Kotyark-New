// Server component: the sidebar comes from the database (visible folders), the active
// item is passed in by the page (no usePathname needed). Filing-screen chrome: dark hero,
// paper section with a sticky section sidebar (a labelled select below 900px).
import Link from 'next/link';
import { listFolders } from '@/lib/documents';
import { getCurrentUser } from '@/lib/auth';
import FilingSectionSelect from '@/components/site/FilingSectionSelect';
import styles from './InvestorSubPageLayout.module.css';

/** 'YYYY-MM-DD' or ISO -> '04 Oct 2025' (en-GB, UTC-safe). */
export function formatFilingDate(v) {
  if (!v) return '';
  const s = v instanceof Date ? v.toISOString() : String(v);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return '';
  const t = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return t.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/**
 * @param {string} title           hero heading (h1)
 * @param {string} [activeSlug]    folder slug highlighted in the sidebar
 * @param {{name:string, href:string}} [parent]  document pages: the folder, shown as the second breadcrumb
 * @param {string[]} [stats]       small mono line under the h1 (e.g. ['12 published', 'Latest 04 Oct 2025'])
 */
export default async function InvestorSubPageLayout({ title, activeSlug, parent, stats, children }) {
  let folders = [];
  try { folders = await listFolders({ visibleOnly: true }); } catch (e) { console.error('Sidebar folders failed:', e.message); }
  let signedIn = false;
  try { signedIn = Boolean(await getCurrentUser()); } catch { /* anonymous */ }

  const active = folders.find((f) => f.slug === activeSlug);
  const sections = folders.map((f) => ({ slug: f.slug, name: f.name, count: f.document_count }));

  return (
    <div className={styles.root}>
      <section className={`kd-dark ${styles.hero}`} data-screen-label="Filing — Hero">
        <div className="kd-wrap">
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <Link href="/investors">Investor Relations</Link>
            <span className={styles.sep} aria-hidden="true">/</span>
            {parent
              ? <Link href={parent.href}>{parent.name}</Link>
              : <span className={styles.cur}>{active?.category || 'Filings'}</span>}
          </nav>
          <h1 className={styles.h1}>{title}</h1>
          {stats?.length > 0 && <div className={styles.stats}>{stats.map((s) => <span key={s}>{s}</span>)}</div>}
        </div>
      </section>

      <section className={`kd-light ${styles.paper}`} data-screen-label="Filing — Documents">
        <div className={`kd-wrap ${styles.grid}`}>
          <nav className={styles.side} aria-label="Investor sections">
            {sections.map((s) => (
              <Link key={s.slug} href={`/investors/${s.slug}`} aria-current={s.slug === activeSlug ? 'page' : undefined}>
                <span>{s.name}</span><span className={styles.cnt}>{s.count}</span>
              </Link>
            ))}
          </nav>
          <div className={styles.main}>
            <div className={styles.mobileNav}>
              <FilingSectionSelect sections={sections} activeSlug={activeSlug} />
              <noscript>
                <ul className={styles.nojs}>
                  {sections.map((s) => <li key={s.slug}><Link href={`/investors/${s.slug}`}>{s.name} ({s.count})</Link></li>)}
                </ul>
              </noscript>
            </div>
            {children}
            <div className={styles.foot}>
              <span>All documents are PDF filings made under SEBI (LODR) Regulations, 2015.</span>
              {signedIn && <Link href="/admin/documents">Admin: manage documents</Link>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
