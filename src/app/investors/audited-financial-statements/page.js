import Link from 'next/link';
import InvestorSubPageLayout from '@/components/InvestorSubPageLayout';

export const metadata = {
  title: 'Audited Financial Statements of Subsidiaries',
  description: 'Audited financial statements of subsidiary companies of Kotyark Industries Limited.',
};

export default function AuditedFinancialStatementsPage() {
  const subsidiaries = [
    { name: 'Kotyark Agro Pvt Ltd', slug: 'kotyarkagropvtltd' },
    { name: 'Kotyark Bio Specialities Ltd', slug: 'kotyarkbiospecialitiesltd' },
    { name: 'Semani Industries Ltd', slug: 'semaniindustriesltd' },
  ];

  return (
    <InvestorSubPageLayout title="Audited Financial Statements of Subsidiaries">
      <p style={{ marginBottom: '24px', color: 'var(--color-text-secondary)' }}>
        Audited financial statements of subsidiary companies as per Regulation 46(2)(l)(iv) of SEBI (LODR) Regulations, 2015.
      </p>
      <div className="fy-grid">
        {subsidiaries.map((sub) => (
          <div key={sub.slug} className="fy-card">
            <div className="fy-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <h3>{sub.name}</h3>
            <p>View audited financial statements</p>
          </div>
        ))}
      </div>
    </InvestorSubPageLayout>
  );
}
