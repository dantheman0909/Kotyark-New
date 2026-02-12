import InvestorSubPageLayout, { DocumentList } from '@/components/InvestorSubPageLayout';

export const metadata = {
  title: 'Misc Disclosure under SEBI',
  description: 'Miscellaneous disclosures under SEBI regulations for Kotyark Industries Limited including corporate governance reports, credit ratings, and newspaper publications.',
};

export default function MiscSebiDisclosurePage() {
  const documents = [
    { title: 'Certificate under Regulation 74(5) H1 FY 2024-25', url: 'https://www.kotyark.com/_files/ugd/510267_f1c84deafc7d4e47bec07eef04b22eff.pdf' },
    { title: 'Secretarial Compliance Report FY 2023-2024', url: 'https://www.kotyark.com/_files/ugd/510267_f741683e098243cf8b7b522e2bb3a64b.pdf' },
    { title: 'Certificate under Regulation 74(5) H2 FY 2023-24', url: 'https://www.kotyark.com/_files/ugd/510267_b3520e65133e453985b56e9acf2206eb.pdf' },
    { title: 'Certificate under Regulation 74(5) H1 FY 2023-24', url: 'https://www.kotyark.com/_files/ugd/510267_b3520e65133e453985b56e9acf2206eb.pdf' },
    { title: 'Corporate Governance Report Q3 FY 2024-25', url: 'https://www.kotyark.com/_files/ugd/e196d6_bcef2a33b8d54f4e9a9e1f5c236d2b5c.pdf' },
    { title: 'Corporate Governance Report Q2 FY 2024-25', url: 'https://www.kotyark.com/_files/ugd/e196d6_050c0c9d8e3f4ec699aa4ac32a12cae4.pdf' },
    { title: 'Corporate Governance Report Q1 FY 2024-25', url: 'https://www.kotyark.com/_files/ugd/e196d6_c9e4a6fc0a0545efbe8d72b8e26ae9f2.pdf' },
    { title: 'Corporate Governance Report Q4 FY 2023-24', url: 'https://www.kotyark.com/_files/ugd/e196d6_bfa9a1f3d09c4bb3b89b9c5aec41b3be.pdf' },
    { title: 'Corporate Governance Report Q3 FY 2023-24', url: 'https://www.kotyark.com/_files/ugd/e196d6_6c0f3a5e31be44d6b45f4ca11e03fa5f.pdf' },
    { title: 'Corporate Governance Report Q2 FY 2023-24', url: 'https://www.kotyark.com/_files/ugd/e196d6_7f5fa2f9cfc3482aabf21b3c2e7c12e0.pdf' },
    { title: 'Corporate Governance Report Q1 FY 2023-24', url: 'https://www.kotyark.com/_files/ugd/e196d6_d283a2d0e88e4f2c97ea47f78f1a4ee6.pdf' },
    { title: 'Secretarial Compliance Report FY 2022-2023', url: 'https://www.kotyark.com/_files/ugd/510267_d9c0a2e3b01c4a3ba97e4b5dd9f4c6a7.pdf' },
    { title: 'Certificate under Regulation 74(5) H2 FY 2022-23', url: 'https://www.kotyark.com/_files/ugd/510267_22d2f8f0cf6f4c39ab5b9a22c7ee2d29.pdf' },
  ];

  return (
    <InvestorSubPageLayout title="Misc Disclosure under SEBI">
      <p style={{ marginBottom: '24px', color: 'var(--color-text-secondary)' }}>
        Miscellaneous regulatory disclosures including corporate governance reports, secretarial compliance reports, and certificates filed as per SEBI regulations.
      </p>
      <DocumentList documents={documents} />
    </InvestorSubPageLayout>
  );
}
