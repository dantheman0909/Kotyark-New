'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sidebarLinks = [
  { href: '/investors/sebi-lodr', label: 'Disclosure under Reg. 46 of SEBI (LODR)' },
  { href: '/investors/closing-trading-window', label: 'Closing of Trading Window' },
  { href: '/investors/misc-sebi-disclosure', label: 'Misc Disclosure under SEBI' },
  { href: '/investors/board-meetings', label: 'Board Meetings' },
  { href: '/investors/audited-financial-statements', label: 'Audited Financial Statements' },
  { href: '/investors/annual-general-meeting', label: 'Annual General Meeting' },
  { href: '/investors/extra-ordinary-general-meetings', label: 'Extra Ordinary General Meeting' },
  { href: '/investors/company-policies', label: 'Company Policies' },
  { href: '/investors/merger-and-amalgamation', label: 'Merger & Amalgamation' },
  { href: '/investors/migration-to-main-board', label: 'Migration To Main Board' },
  { href: '/investors/smart-odr', label: 'Smart ODR' },
  { href: '/investors/unpaid-dividend', label: 'Unpaid Dividend' },
  { href: '/investors/postal-ballot', label: 'Postal Ballot' },
  { href: '/investors/integrated-filling', label: 'Integrated Filling' },
  { href: '/investors/moa-aoa', label: 'MOA - AOA' },
];

function DownloadArrow() {
  return (
    <svg className="doc-card-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export function DocumentList({ documents }) {
  if (!documents || documents.length === 0) return null;
  return (
    <div className="doc-card-grid">
      {documents.map((doc, i) => (
        <a
          key={i}
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="doc-card"
        >
          <div className="doc-card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div className="doc-card-info">
            <span className="doc-card-title">{doc.title}</span>
            <span className="doc-card-badge">PDF</span>
          </div>
          <DownloadArrow />
        </a>
      ))}
    </div>
  );
}

export default function InvestorSubPageLayout({ title, children }) {
  const pathname = usePathname();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="investor-breadcrumb" aria-label="Breadcrumb">
            <Link href="/investors">Investor Relations</Link>
            <span className="investor-breadcrumb-sep">›</span>
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
                  {sidebarLinks.map(link => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={pathname === link.href ? 'active' : ''}
                      >
                        {link.label}
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
