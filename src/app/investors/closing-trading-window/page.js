import InvestorSubPageLayout, { DocumentList } from '@/components/InvestorSubPageLayout';

export const metadata = {
  title: 'Closing of Trading Window',
  description: 'Trading window closure notices for Kotyark Industries Limited as per SEBI Insider Trading Regulations.',
};

export default function ClosingTradingWindowPage() {
  const documents = [
    { title: 'Closing of Trading Window - Board Meeting 11.02.2025', url: 'https://www.kotyark.com/_files/ugd/e196d6_72f5b70b54a2483e892be2b1b2b6eee3.pdf' },
    { title: 'Closing of trading Window - Board Meeting 27.01.2025', url: 'https://www.kotyark.com/_files/ugd/e196d6_ecbcfa5a3ea746bbaaedcc2ac2a2bdbc.pdf' },
    { title: 'Closing of Trading Window - Board meeting 14.11.2024', url: 'https://www.kotyark.com/_files/ugd/e196d6_e24f21f5b0ef41b1a94da25a2ed6e7a9.pdf' },
    { title: 'Closing of Trading Window - Board Meeting 03.09.2024', url: 'https://www.kotyark.com/_files/ugd/e196d6_1daab3b9f7b94cdea81e7dde0b8b5ede.pdf' },
    { title: 'Closing of Trading Window - Board Meeting 14.08.2024', url: 'https://www.kotyark.com/_files/ugd/e196d6_fe9b21e3f9b3452bbb0301e2fe84e5e3.pdf' },
    { title: 'Closing of Trading Window - Board Meeting 30.05.2024', url: 'https://www.kotyark.com/_files/ugd/e196d6_30f32c7b1e3541f1886ecc13ebd5f1f3.pdf' },
    { title: 'Closing of Trading Window - Board Meeting 14.02.2024', url: 'https://www.kotyark.com/_files/ugd/e196d6_ec20b2bb1c3d405fa1f5ef3f24b2e56c.pdf' },
    { title: 'Closing of Trading Window - Board Meeting 10.11.2023', url: 'https://www.kotyark.com/_files/ugd/e196d6_199e2b19e77b4b1a804e8e5e94ac6e5f.pdf' },
    { title: 'Closing of Trading Window - Board Meeting 12.08.2023', url: 'https://www.kotyark.com/_files/ugd/e196d6_da20e2dc0c064ea0b87a06e64e3bc61f.pdf' },
    { title: 'Closing of Trading Window - Board Meeting 29.05.2023', url: 'https://www.kotyark.com/_files/ugd/e196d6_0a5df5b3b75245f18f3b6d94b33fbb88.pdf' },
    { title: 'Closing of Trading Window - Board Meeting 10.02.2023', url: 'https://www.kotyark.com/_files/ugd/e196d6_6a3f3d25d2ea4c7fa2131e18cdfd49da.pdf' },
  ];

  return (
    <InvestorSubPageLayout title="Closing of Trading Window">
      <p style={{ marginBottom: '24px', color: 'var(--color-text-secondary)' }}>
        Notices regarding closure of trading window for designated persons as per SEBI (Prohibition of Insider Trading) Regulations, 2015.
      </p>
      <DocumentList documents={documents} />
    </InvestorSubPageLayout>
  );
}
