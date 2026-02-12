import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata = {
  title: 'Investor Relations - BSE Listed',
  description: "Access SEBI filings, board meetings, financial statements & company policies for Kotyark Industries Limited. BSE listed biofuel company.",
};

export default function InvestorsPage() {
  const regulatoryDocs = [
    { title: 'Disclosure under Reg. 46 of SEBI (LODR)', desc: 'Particulars as per SEBI (LODR) Regulations, 2015 — Regulation 46(2) website disclosures.', href: '/investors/sebi-lodr' },
    { title: 'Board Meetings', desc: 'Formal notices and outcomes of all board meetings as per SEBI LODR regulations.', href: '/investors/board-meetings' },
    { title: 'Closing of Trading Window', desc: 'Trading window closure notices for designated persons as per SEBI Insider Trading Regulations.', href: '/investors/closing-trading-window' },
    { title: 'Misc Disclosure under SEBI', desc: 'Corporate governance reports, compliance certificates, and miscellaneous SEBI disclosures.', href: '/investors/misc-sebi-disclosure' },
  ];

  const financialDocs = [
    { title: 'Annual General Meeting', desc: 'AGM notices, minutes, annual reports, and related documentation.', href: '/investors/annual-general-meeting' },
    { title: 'Extra Ordinary General Meeting', desc: 'EOGM notices, minutes, and resolutions documentation.', href: '/investors/extra-ordinary-general-meetings' },
    { title: 'Audited Financial Statements', desc: 'Audited financial statements of subsidiary companies.', href: '/investors/audited-financial-statements' },
    { title: 'Unpaid Dividend', desc: 'Details of unpaid and unclaimed dividends for shareholders.', href: '/investors/unpaid-dividend' },
  ];

  const governanceDocs = [
    { title: 'Company Policies', desc: 'Full set of corporate policies governing operations and governance.', href: '/investors/company-policies' },
    { title: 'Memorandum & Articles of Association', desc: "Founding documents defining the company's constitution and governance.", href: '/investors/moa-aoa' },
    { title: 'Merger & Amalgamation', desc: 'Documents related to merger and amalgamation proceedings.', href: '/investors/merger-and-amalgamation' },
    { title: 'Migration To Main Board', desc: 'Documents related to migration from BSE SME Platform to Main Board.', href: '/investors/migration-to-main-board' },
  ];

  const otherDocs = [
    { title: 'Postal Ballot', desc: 'Postal ballot notices, e-voting results, and scrutinizer reports.', href: '/investors/postal-ballot' },
    { title: 'Integrated Filling', desc: 'Consolidated view of governance and financial compliance filings.', href: '/investors/integrated-filling' },
    { title: 'Smart ODR', desc: 'Online Dispute Resolution portal for investor complaints.', href: '/investors/smart-odr' },
  ];

  const docIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  );

  const finIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );

  const govIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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

      {/* Regulatory Filings */}
      <section className="section section-alt">
        <div className="container">
          <ScrollReveal>
            <div className="section-header">
              <span className="section-tag">Regulatory</span>
              <h2>Regulatory Filings</h2>
              <p>Mandatory filings and disclosures as per SEBI Listing Obligations and Disclosure Requirements (LODR).</p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            {renderCards(regulatoryDocs, docIcon)}
          </ScrollReveal>
        </div>
      </section>

      {/* Financial Statements */}
      <section className="section">
        <div className="container">
          <ScrollReveal>
            <div className="section-header">
              <span className="section-tag">Financial</span>
              <h2>Financial Statements</h2>
              <p>Annual and quarterly financial reports, including audited statements and subsidiary financials.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            {renderCards(financialDocs, finIcon)}
          </ScrollReveal>
        </div>
      </section>

      {/* Governance */}
      <section className="section section-alt">
        <div className="container">
          <ScrollReveal>
            <div className="section-header">
              <span className="section-tag">Governance</span>
              <h2>Corporate Governance</h2>
              <p>Company constitution, policies, and governance framework ensuring transparency and compliance.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            {renderCards(governanceDocs, govIcon)}
          </ScrollReveal>
        </div>
      </section>

      {/* Other */}
      <section className="section">
        <div className="container">
          <ScrollReveal>
            <div className="section-header">
              <span className="section-tag">Other</span>
              <h2>Other Filings</h2>
              <p>Additional regulatory filings, postal ballots, and dispute resolution.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            {renderCards(otherDocs, docIcon)}
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
