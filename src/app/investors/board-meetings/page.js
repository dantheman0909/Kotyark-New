import Link from 'next/link';
import InvestorSubPageLayout from '@/components/InvestorSubPageLayout';

export const metadata = {
  title: 'Board Meetings',
  description: 'Board meeting notices, outcomes, and financial results for Kotyark Industries Limited across financial years.',
};

export default function BoardMeetingsPage() {
  const financialYears = [
    { fy: 'FY 2025-26', slug: 'fy-2025-26' },
    { fy: 'FY 2024-25', slug: 'fy-2024-25' },
    { fy: 'FY 2023-24', slug: 'fy-2023-24' },
    { fy: 'FY 2022-23', slug: 'fy-2022-23' },
    { fy: 'FY 2021-22', slug: 'fy-2021-22' },
  ];

  return (
    <InvestorSubPageLayout title="Board Meetings">
      <p style={{ marginBottom: '24px', color: 'var(--color-text-secondary)' }}>
        Board meeting notices, outcomes, and financial results filed with BSE. Select a financial year to view related documents.
      </p>
      <div className="fy-grid">
        {financialYears.map((fy) => (
          <div key={fy.slug} className="fy-card">
            <div className="fy-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3>{fy.fy}</h3>
            <p>Board meeting documents for {fy.fy}</p>
          </div>
        ))}
      </div>
    </InvestorSubPageLayout>
  );
}
