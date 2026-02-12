import InvestorSubPageLayout, { DocumentList } from '@/components/InvestorSubPageLayout';

export const metadata = {
  title: 'Migration To Main Board',
  description: 'Documents related to migration from SME platform to Main Board of BSE for Kotyark Industries Limited.',
};

export default function MigrationMainBoardPage() {
  const documents = [
    { title: 'Outcome of Board Meeting held on 24.12.2024', url: 'https://www.kotyark.com/_files/ugd/e196d6_4378176ba9ad4653adc48adad8078009.pdf' },
    { title: 'Postal Ballot Notice - 24.12.2024', url: 'https://www.kotyark.com/_files/ugd/e196d6_fc211479d9b24b8f8adfd4b61f1719eb.pdf' },
    { title: 'Postal Ballot Voting Results - 25.01.2025', url: 'https://www.kotyark.com/_files/ugd/e196d6_4636ad8f06ea4290a9aae644ca208f6e.pdf' },
    { title: 'Proceeding of Postal Ballot - 25.01.2025', url: 'https://www.kotyark.com/_files/ugd/e196d6_16e47e67cbb7434c81dd3c02b48ff4b8.pdf' },
  ];

  return (
    <InvestorSubPageLayout title="Migration To Main Board">
      <p style={{ marginBottom: '24px', color: 'var(--color-text-secondary)' }}>
        Documents related to the migration of Kotyark Industries Limited from BSE SME Platform to the Main Board.
      </p>
      <DocumentList documents={documents} />
    </InvestorSubPageLayout>
  );
}
