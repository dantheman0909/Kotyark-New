// Server component: the sidebar comes from the database (visible folders), the active
// item is passed in by the page (no usePathname needed).
import Link from 'next/link';
import { listFolders, labelForMime, formatDocDate, documentLandingPath } from '@/lib/documents';

function DownloadArrow() {
  return (
    <svg className="doc-card-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

/** Cards linking to each document's landing page. `folderSlug` is used when rows lack folder_slug. */
export function DocumentList({ documents, folderSlug }) {
  if (!documents || documents.length === 0) return null;
  return (
    <div className="doc-card-grid">
      {documents.map((doc) => (
        <Link key={doc.id || doc.slug} href={documentLandingPath(doc.folder_slug || folderSlug, doc)} className="doc-card">
          <div className="doc-card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div className="doc-card-info">
            <span className="doc-card-title">
              {doc.title}
              {doc.doc_date && (
                <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 400, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {formatDocDate(doc.doc_date)}
                </span>
              )}
            </span>
            <span className="doc-card-badge">{labelForMime(doc.mime)}</span>
          </div>
          <DownloadArrow />
        </Link>
      ))}
    </div>
  );
}

/**
 * @param {string} title           hero heading
 * @param {string} [activeSlug]    folder slug highlighted in the sidebar
 * @param {{name:string, href:string}} [parent]  optional middle breadcrumb (e.g. the folder on a document page)
 */
export default async function InvestorSubPageLayout({ title, activeSlug, parent, children }) {
  let folders = [];
  try { folders = await listFolders({ visibleOnly: true }); } catch (e) { console.error('Sidebar folders failed:', e.message); }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="investor-breadcrumb" aria-label="Breadcrumb">
            <Link href="/investors">Investor Relations</Link>
            <span className="investor-breadcrumb-sep">›</span>
            {parent && (<>
              <Link href={parent.href}>{parent.name}</Link>
              <span className="investor-breadcrumb-sep">›</span>
            </>)}
            <span>{title}</span>
          </nav>
          <h1>{title}</h1>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="investor-layout">
            <aside className="investor-sidebar">
              <h3>Investor Sections</h3>
              <nav>
                <ul>
                  {folders.map((f) => (
                    <li key={f.id}>
                      <Link href={`/investors/${f.slug}`} className={f.slug === activeSlug ? 'active' : ''}>
                        {f.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
            <div className="investor-content">
              {children}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
