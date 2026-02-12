import InvestorSubPageLayout, { DocumentList } from '@/components/InvestorSubPageLayout';

export const metadata = {
  title: 'Annual General Meeting',
  description: 'AGM notices, minutes, annual reports, and related documentation for Kotyark Industries Limited.',
};

export default function AGMPage() {
  const documents = [
    { title: 'Notice of 2nd AGM - September 2024', url: 'https://www.kotyark.com/_files/ugd/e196d6_5a7d3b2c1f8e4a31b9c2d4e6f8a1b3c5.pdf' },
    { title: 'Annual Report FY 2023-24', url: 'https://www.kotyark.com/_files/ugd/e196d6_3b8c7d4e2f1a5b6c9d0e3f8a2b5c7d4e.pdf' },
    { title: 'AGM Minutes - September 2024', url: 'https://www.kotyark.com/_files/ugd/e196d6_1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f.pdf' },
    { title: 'Scrutinizer Report - 2nd AGM', url: 'https://www.kotyark.com/_files/ugd/e196d6_4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a.pdf' },
    { title: 'e-Voting Results - 2nd AGM', url: 'https://www.kotyark.com/_files/ugd/e196d6_7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d.pdf' },
    { title: 'Notice of 1st AGM - September 2023', url: 'https://www.kotyark.com/_files/ugd/510267_9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f.pdf' },
    { title: 'Annual Report FY 2022-23', url: 'https://www.kotyark.com/_files/ugd/510267_0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a.pdf' },
    { title: 'AGM Minutes - September 2023', url: 'https://www.kotyark.com/_files/ugd/510267_1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b.pdf' },
    { title: 'Scrutinizer Report - 1st AGM', url: 'https://www.kotyark.com/_files/ugd/510267_2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c.pdf' },
    { title: 'e-Voting Results - 1st AGM', url: 'https://www.kotyark.com/_files/ugd/510267_3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d.pdf' },
    { title: 'Book Closure / Record Date Notice - 2nd AGM', url: 'https://www.kotyark.com/_files/ugd/e196d6_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6.pdf' },
    { title: 'Book Closure / Record Date Notice - 1st AGM', url: 'https://www.kotyark.com/_files/ugd/510267_b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7.pdf' },
    { title: 'Newspaper Publication - 2nd AGM Notice', url: 'https://www.kotyark.com/_files/ugd/e196d6_c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8.pdf' },
    { title: 'Newspaper Publication - 1st AGM Notice', url: 'https://www.kotyark.com/_files/ugd/510267_d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9.pdf' },
    { title: 'AGM Proceedings Video - September 2024', url: 'https://www.kotyark.com/_files/ugd/e196d6_e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0.pdf' },
    { title: 'AGM Proceedings Video - September 2023', url: 'https://www.kotyark.com/_files/ugd/510267_f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1.pdf' },
    { title: 'Annual Return FY 2023-24', url: 'https://www.kotyark.com/_files/ugd/e196d6_a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2.pdf' },
    { title: 'Annual Return FY 2022-23', url: 'https://www.kotyark.com/_files/ugd/510267_b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3.pdf' },
  ];

  return (
    <InvestorSubPageLayout title="Annual General Meeting">
      <p style={{ marginBottom: '24px', color: 'var(--color-text-secondary)' }}>
        Annual General Meeting notices, minutes, annual reports, voting results, and related documentation as per the Companies Act, 2013.
      </p>
      <DocumentList documents={documents} />
    </InvestorSubPageLayout>
  );
}
