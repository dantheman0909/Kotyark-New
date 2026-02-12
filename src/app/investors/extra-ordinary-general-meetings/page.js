import Link from 'next/link';
import InvestorSubPageLayout from '@/components/InvestorSubPageLayout';

export const metadata = {
  title: 'Extra Ordinary General Meetings',
  description: 'Notices and outcomes of Extra Ordinary General Meetings held by Kotyark Industries Limited.',
};

export default function EOGMPage() {
  const meetings = [
    { title: 'EOGM - January 2024', date: 'January 2024', desc: 'Extra Ordinary General Meeting documents and resolutions passed.' },
    { title: 'EOGM - September 2022', date: 'September 2022', desc: 'Extra Ordinary General Meeting documents and resolutions passed.' },
  ];

  return (
    <InvestorSubPageLayout title="Extra Ordinary General Meetings">
      <p style={{ marginBottom: '24px', color: 'var(--color-text-secondary)' }}>
        Notices, minutes, and voting results of Extra Ordinary General Meetings held by Kotyark Industries Limited.
      </p>
      <div className="fy-grid">
        {meetings.map((m, i) => (
          <div key={i} className="fy-card">
            <div className="fy-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h3>{m.title}</h3>
            <p>{m.desc}</p>
          </div>
        ))}
      </div>
    </InvestorSubPageLayout>
  );
}
