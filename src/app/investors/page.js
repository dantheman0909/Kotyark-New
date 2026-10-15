import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';

import { buildMetadata } from '@/lib/seo';
import { listFolders } from '@/lib/documents';

export const dynamic = 'force-dynamic';

export const metadata = buildMetadata({
  title: 'Investor Relations - BSE Listed',
  description: 'Access SEBI filings, board meetings, financial statements & company policies for Kotyark Industries Limited. BSE listed biofuel company.',
  path: '/investors',
});

export default async function InvestorsPage() {
  let folders = [];
  try { folders = await listFolders({ visibleOnly: true }); } catch (e) { console.error('Investor hub folders failed:', e.message); }
  const sections = folders.map((f) => ({
    title: f.name,
    desc: f.description || 'View documents and filings in this section.',
    href: `/investors/${f.slug}`,
  }));

  const docIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  );

  const renderCards = (docs, icon) => (
    <div className="category-grid">
      {docs.map((doc, i) => (
        <Link href={doc.href} key={i} className="category-card-link">
          <div className="category-card">
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div className="doc-icon">{icon}</div>
              <div>
                <h4>{doc.title}</h4>
                <p>{doc.desc}</p>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Investor Relations</h1>
          <p>Complete regulatory filings, financial statements, and governance documents for Kotyark Industries Limited (BSE Listed).</p>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="section">
        <div className="container">
          <ScrollReveal>
            <div className="stats-grid investor-stats">
              <div className="stat-card">
                <div className="stat-number" style={{ fontSize: '24px' }}>BSE Listed</div>
                <div className="stat-label">Stock Exchange</div>
              </div>
              <div className="stat-card">
                <div className="stat-number" style={{ fontSize: '20px', lineHeight: 1.2 }}>L15149RJ2023PLC091598</div>
                <div className="stat-label">CIN Number</div>
              </div>
              <div className="stat-card">
                <div className="stat-number" style={{ fontSize: '24px' }}>SEBI Compliant</div>
                <div className="stat-label">LODR Regulations</div>
              </div>
              <div className="stat-card">
                <div className="stat-number" style={{ fontSize: '24px' }}>480K KL</div>
                <div className="stat-label">Annual Capacity</div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Sections (from the database) */}
      <section className="section section-alt">
        <div className="container">
          <ScrollReveal>
            <div className="section-header">
              <span className="section-tag">Disclosures</span>
              <h2>Investor Sections</h2>
              <p>Regulatory filings, financial statements, governance documents and other disclosures as per SEBI Listing Obligations and Disclosure Requirements (LODR).</p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            {sections.length ? renderCards(sections, docIcon) : (
              <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Sections will appear here shortly.</p>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* Contact */}
      <section className="section section-alt">
        <div className="container">
          <ScrollReveal>
            <div className="cta-section">
              <h2>Investor Queries?</h2>
              <p>For any investor-related queries, please reach out to our compliance team.</p>
              <Link href="/contact" className="btn btn-primary btn-lg">Contact Investor Relations →</Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
