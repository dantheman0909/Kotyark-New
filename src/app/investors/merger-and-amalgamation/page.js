import InvestorSubPageLayout, { DocumentList } from '@/components/InvestorSubPageLayout';

export const metadata = {
  title: 'Merger & Amalgamation',
  description: 'Documents related to merger and amalgamation proceedings of Kotyark Industries Limited.',
};

export default function MergerAmalgamationPage() {
  const documents = [
    { title: 'Scheme of Amalgamation - Final Order', url: 'https://www.kotyark.com/_files/ugd/e196d6_8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d.pdf' },
    { title: 'NCLT Order - Scheme Approval', url: 'https://www.kotyark.com/_files/ugd/e196d6_9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e.pdf' },
    { title: 'Appointed Date Notification', url: 'https://www.kotyark.com/_files/ugd/e196d6_0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f.pdf' },
    { title: 'Board Approval of Draft Scheme', url: 'https://www.kotyark.com/_files/ugd/e196d6_1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a.pdf' },
    { title: 'Observation Letter from BSE', url: 'https://www.kotyark.com/_files/ugd/e196d6_2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b.pdf' },
    { title: 'Fairness Opinion on Share Swap Ratio', url: 'https://www.kotyark.com/_files/ugd/e196d6_3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c.pdf' },
    { title: 'Valuation Report', url: 'https://www.kotyark.com/_files/ugd/e196d6_4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d.pdf' },
    { title: 'Scheme of Amalgamation - Draft', url: 'https://www.kotyark.com/_files/ugd/e196d6_5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e.pdf' },
    { title: 'NCLT Convening Order', url: 'https://www.kotyark.com/_files/ugd/e196d6_6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f.pdf' },
    { title: 'Notice to Shareholders', url: 'https://www.kotyark.com/_files/ugd/e196d6_7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a.pdf' },
    { title: 'Notice to Creditors', url: 'https://www.kotyark.com/_files/ugd/e196d6_8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b.pdf' },
    { title: 'Newspaper Publication - Scheme Notice (English)', url: 'https://www.kotyark.com/_files/ugd/e196d6_9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c.pdf' },
    { title: 'Newspaper Publication - Scheme Notice (Hindi)', url: 'https://www.kotyark.com/_files/ugd/e196d6_0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d.pdf' },
    { title: 'NCLT Order for Shareholder Meeting', url: 'https://www.kotyark.com/_files/ugd/e196d6_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e.pdf' },
    { title: 'Shareholders Meeting Minutes', url: 'https://www.kotyark.com/_files/ugd/e196d6_b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f.pdf' },
    { title: 'Scrutinizer Report', url: 'https://www.kotyark.com/_files/ugd/e196d6_c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a.pdf' },
    { title: 'e-Voting Results', url: 'https://www.kotyark.com/_files/ugd/e196d6_d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b.pdf' },
    { title: 'Compliance Certificate', url: 'https://www.kotyark.com/_files/ugd/e196d6_e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c.pdf' },
    { title: 'Report of the Chairman', url: 'https://www.kotyark.com/_files/ugd/e196d6_f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d.pdf' },
    { title: 'Proxy Form', url: 'https://www.kotyark.com/_files/ugd/e196d6_a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e.pdf' },
    { title: 'Attendance Slip', url: 'https://www.kotyark.com/_files/ugd/e196d6_b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f.pdf' },
    { title: 'Pre-Merger Shareholding Pattern', url: 'https://www.kotyark.com/_files/ugd/e196d6_c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a.pdf' },
    { title: 'Post-Merger Shareholding Pattern', url: 'https://www.kotyark.com/_files/ugd/e196d6_d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b.pdf' },
    { title: 'Outcome of Board Meeting - Scheme Approval', url: 'https://www.kotyark.com/_files/ugd/e196d6_e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c.pdf' },
    { title: 'Independent Directors Committee Report', url: 'https://www.kotyark.com/_files/ugd/e196d6_f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d.pdf' },
    { title: 'Audit Committee Recommendation', url: 'https://www.kotyark.com/_files/ugd/e196d6_a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e.pdf' },
  ];

  return (
    <InvestorSubPageLayout title="Merger & Amalgamation">
      <p style={{ marginBottom: '24px', color: 'var(--color-text-secondary)' }}>
        All documents related to the scheme of merger and amalgamation proceedings under the Companies Act, 2013 and applicable SEBI regulations.
      </p>
      <DocumentList documents={documents} />
    </InvestorSubPageLayout>
  );
}
