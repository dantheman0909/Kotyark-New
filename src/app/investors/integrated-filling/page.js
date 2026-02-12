import Link from 'next/link';
import InvestorSubPageLayout from '@/components/InvestorSubPageLayout';

export const metadata = {
  title: 'Integrated Filling',
  description: 'Integrated filings for governance and financial compliance by Kotyark Industries Limited.',
};

export default function IntegratedFillingPage() {
  const categories = [
    { title: 'Governance & Compliance Filings', desc: 'Corporate governance reports, compliance certificates, and related regulatory filings.' },
    { title: 'Financial & Annual Filings', desc: 'Annual returns, financial statements, and other periodic filings with regulatory authorities.' },
  ];

  return (
    <InvestorSubPageLayout title="Integrated Filling">
      <p style={{ marginBottom: '24px', color: 'var(--color-text-secondary)' }}>
        Consolidated view of integrated filings made with regulatory authorities covering both governance and financial compliance.
      </p>
      <div className="fy-grid">
        {categories.map((cat, i) => (
          <div key={i} className="fy-card">
            <div className="fy-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h3>{cat.title}</h3>
            <p>{cat.desc}</p>
          </div>
        ))}
      </div>
    </InvestorSubPageLayout>
  );
}
