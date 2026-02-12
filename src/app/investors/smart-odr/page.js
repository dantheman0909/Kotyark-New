import InvestorSubPageLayout, { DocumentList } from '@/components/InvestorSubPageLayout';

export const metadata = {
  title: 'Smart ODR',
  description: 'Online Dispute Resolution portal information for investors of Kotyark Industries Limited.',
};

export default function SmartODRPage() {
  const documents = [
    { title: 'Smart ODR - Circular & Details', url: 'https://www.kotyark.com/_files/ugd/e196d6_d2e8c3f6a91e4b2f8c7a1d5b3e9f0a4c.pdf' },
  ];

  return (
    <InvestorSubPageLayout title="Smart ODR">
      <p style={{ marginBottom: '24px', color: 'var(--color-text-secondary)' }}>
        SEBI has introduced the Smart Online Dispute Resolution (ODR) portal to facilitate resolution of disputes between investors and listed companies. Investors can file complaints through the ODR mechanism.
      </p>
      <div style={{ marginBottom: '24px', padding: '20px', background: 'var(--color-bg-section-alt)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ marginBottom: '12px' }}>How to file a complaint?</h3>
        <ol style={{ paddingLeft: '20px', lineHeight: 1.8 }}>
          <li>Visit the Smart ODR portal at <a href="https://smartodr.in" target="_blank" rel="noopener noreferrer">smartodr.in</a></li>
          <li>Register as an investor/complainant</li>
          <li>Select the relevant market intermediary</li>
          <li>Submit your complaint with supporting documents</li>
          <li>Track the resolution progress online</li>
        </ol>
      </div>
      <DocumentList documents={documents} />
    </InvestorSubPageLayout>
  );
}
