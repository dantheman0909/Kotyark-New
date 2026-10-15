import Link from 'next/link';
import { searchSite, MAX_QUERY_LENGTH } from '@/lib/search';
import { absoluteUrl } from '@/lib/site';
import styles from './search.module.css';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export const metadata = {
  title: 'Search',
  description: 'Search Kotyark Industries pages and investor documents.',
  alternates: { canonical: absoluteUrl('/search') },
  robots: { index: false, follow: true },
};

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pages', label: 'Pages' },
  { key: 'documents', label: 'Documents' },
];

function href(q, type, page) {
  const p = new URLSearchParams();
  if (q) p.set('q', q);
  if (type !== 'all') p.set('type', type);
  if (page > 1) p.set('page', String(page));
  const s = p.toString();
  return s ? `/search?${s}` : '/search';
}

function first(v) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function SearchPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const q = String(first(sp.q) || '').slice(0, MAX_QUERY_LENGTH).trim();
  const type = ['pages', 'documents'].includes(first(sp.type)) ? first(sp.type) : 'all';
  const page = Math.min(Math.max(parseInt(first(sp.page) || '1', 10) || 1, 1), 500);

  let data = null;
  let failed = false;
  if (q) {
    try {
      data = await searchSite(q, { type, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
    } catch (e) {
      console.error('[search page] failed:', e?.message);
      failed = true;
    }
  }
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const counts = data?.counts || { pages: 0, documents: 0 };
  const tabCount = { all: counts.pages + counts.documents, pages: counts.pages, documents: counts.documents };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Search</h1>
          <p>Find pages and investor documents across the Kotyark Industries website.</p>
          <form className={styles.heroForm} action="/search" method="get" role="search">
            {type !== 'all' && <input type="hidden" name="type" value={type} />}
            <label htmlFor="site-search" className="sr-only" style={{ position: 'absolute', left: -9999 }}>Search the site</label>
            <input id="site-search" className={styles.input} type="search" name="q" defaultValue={q}
              maxLength={MAX_QUERY_LENGTH} placeholder="Search policies, notices, reports..." autoComplete="off" />
            <button type="submit" className="btn btn-primary">Search</button>
          </form>
        </div>
      </section>

      <section className="section">
        <div className="container-narrow">
          {!q && (
            <div className={styles.empty}>
              <p>Enter a word or phrase above to search. Use quotes for an exact phrase and a minus sign to exclude a word.</p>
              <div className={styles.links}>
                <Link href="/investors" className="btn btn-secondary">Investor Relations</Link>
                <Link href="/products" className="btn btn-secondary">Products</Link>
                <Link href="/contact" className="btn btn-secondary">Contact</Link>
              </div>
            </div>
          )}

          {q && failed && (
            <div className={styles.empty}>
              <p>Search is temporarily unavailable. Please try again in a moment.</p>
              <div className={styles.links}>
                <Link href="/investors" className="btn btn-secondary">Investor Relations</Link>
                <Link href="/contact" className="btn btn-secondary">Contact</Link>
              </div>
            </div>
          )}

          {q && data && (
            <>
              <nav className={styles.tabs} aria-label="Result type">
                {TABS.map(t => (
                  <Link key={t.key} href={href(q, t.key, 1)}
                    className={`${styles.tab} ${type === t.key ? styles.tabActive : ''}`}
                    aria-current={type === t.key ? 'page' : undefined}>
                    {t.label} ({tabCount[t.key]})
                  </Link>
                ))}
              </nav>

              {data.total === 0 ? (
                <div className={styles.empty}>
                  <h2>No results for &ldquo;{q}&rdquo;</h2>
                  <p>Check the spelling, try fewer or more general words, or browse these sections.</p>
                  <div className={styles.links}>
                    <Link href="/investors" className="btn btn-primary">Investor Relations</Link>
                    <Link href="/contact" className="btn btn-secondary">Contact us</Link>
                  </div>
                </div>
              ) : (
                <>
                  <p className={styles.summary} aria-live="polite">
                    {data.total} result{data.total === 1 ? '' : 's'} for &ldquo;{q}&rdquo;
                    {totalPages > 1 ? ` (page ${page} of ${totalPages})` : ''}
                  </p>
                  <ol className={styles.list}>
                    {data.results.map(r => (
                      <li key={r.url} className={styles.result}>
                        <div className={styles.meta}>
                          <span className={styles.badge}>{r.type === 'page' ? 'Page' : 'Document'}</span>
                          {r.folderName && <span>{r.folderName}</span>}
                          {r.date && <span>{r.date}</span>}
                        </div>
                        <h2 className={styles.title}><Link href={r.url}>{r.title}</Link></h2>
                        <div className={styles.url}>{r.url}</div>
                        {/* Snippet is HTML-escaped server-side; only <mark> tags are produced by searchSite(). */}
                        {r.snippet && <p className={styles.snippet} dangerouslySetInnerHTML={{ __html: r.snippet }} />}
                      </li>
                    ))}
                  </ol>

                  {totalPages > 1 && (
                    <nav className={styles.pager} aria-label="Pagination">
                      {page > 1 && <Link className={styles.pageLink} href={href(q, type, page - 1)} rel="prev">Previous</Link>}
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
                        .map(n => (
                          <Link key={n} href={href(q, type, n)}
                            className={`${styles.pageLink} ${n === page ? styles.pageCurrent : ''}`}
                            aria-current={n === page ? 'page' : undefined}>{n}</Link>
                        ))}
                      {page < totalPages && <Link className={styles.pageLink} href={href(q, type, page + 1)} rel="next">Next</Link>}
                    </nav>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
