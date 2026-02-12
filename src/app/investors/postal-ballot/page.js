import InvestorSubPageLayout, { DocumentList } from '@/components/InvestorSubPageLayout';

export const metadata = {
  title: 'Postal Ballot',
  description: 'Postal ballot notices, voting results, and scrutinizer reports for Kotyark Industries Limited.',
};

export default function PostalBallotPage() {
  const documents = [
    { title: 'Postal Ballot Notice - 24.12.2024', url: 'https://www.kotyark.com/_files/ugd/e196d6_fc211479d9b24b8f8adfd4b61f1719eb.pdf' },
    { title: 'Postal Ballot Voting Results - 25.01.2025', url: 'https://www.kotyark.com/_files/ugd/e196d6_4636ad8f06ea4290a9aae644ca208f6e.pdf' },
    { title: 'Proceeding of Postal Ballot - 25.01.2025', url: 'https://www.kotyark.com/_files/ugd/e196d6_16e47e67cbb7434c81dd3c02b48ff4b8.pdf' },
    { title: 'Postal Ballot Notice - August 2024', url: 'https://www.kotyark.com/_files/ugd/e196d6_c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9.pdf' },
    { title: 'Postal Ballot Voting Results - September 2024', url: 'https://www.kotyark.com/_files/ugd/e196d6_d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0.pdf' },
    { title: 'Scrutinizer Report - Postal Ballot Sept 2024', url: 'https://www.kotyark.com/_files/ugd/e196d6_e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1.pdf' },
  ];

  return (
    <InvestorSubPageLayout title="Postal Ballot">
      <p style={{ marginBottom: '24px', color: 'var(--color-text-secondary)' }}>
        Postal ballot notices, e-voting results, and scrutinizer reports for resolutions passed through postal ballot mechanism.
      </p>
      <DocumentList documents={documents} />
    </InvestorSubPageLayout>
  );
}
