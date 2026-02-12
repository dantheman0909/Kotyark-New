import InvestorSubPageLayout, { DocumentList } from '@/components/InvestorSubPageLayout';

export const metadata = {
  title: 'Unpaid Dividend',
  description: 'Details of unpaid and unclaimed dividends for shareholders of Kotyark Industries Limited.',
};

export default function UnpaidDividendPage() {
  const documents = [
    { title: 'Unpaid / Unclaimed Dividend - FY 2023-24', url: 'https://www.kotyark.com/_files/ugd/e196d6_a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9.pdf' },
    { title: 'Unpaid / Unclaimed Dividend - FY 2022-23', url: 'https://www.kotyark.com/_files/ugd/510267_b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0.pdf' },
  ];

  return (
    <InvestorSubPageLayout title="Unpaid Dividend">
      <p style={{ marginBottom: '24px', color: 'var(--color-text-secondary)' }}>
        Details of unpaid and unclaimed dividends as per Section 124 of the Companies Act, 2013. Shareholders are requested to verify and claim their unpaid dividends.
      </p>
      <DocumentList documents={documents} />
    </InvestorSubPageLayout>
  );
}
