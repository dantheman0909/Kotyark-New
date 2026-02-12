import InvestorSubPageLayout, { DocumentList } from '@/components/InvestorSubPageLayout';

export const metadata = {
  title: 'Company Policies',
  description: 'Corporate governance policies of Kotyark Industries Limited including Code of Conduct, Whistle Blower Policy, CSR Policy, and more.',
};

export default function CompanyPoliciesPage() {
  const documents = [
    { title: 'Code Of Conduct for Prevention of Insider Trading', url: 'https://www.kotyark.com/_files/ugd/510267_7d735d5bd9f24e118ad7a3e3dbdb23c1.pdf' },
    { title: 'HR & Remuneration Policy', url: 'https://www.kotyark.com/_files/ugd/510267_5e4f2a9bfc7245c0a8bf09d2af75ba79.pdf' },
    { title: 'Code of Conduct for Board & Senior Management', url: 'https://www.kotyark.com/_files/ugd/510267_6c1e11acbc7c4697a3e26a7b7b85e92f.pdf' },
    { title: 'Vigil Mechanism / Whistle Blower Policy', url: 'https://www.kotyark.com/_files/ugd/510267_fd41f2e8c27f43cbb98d6b6e35e10bea.pdf' },
    { title: 'Related Party Transaction Policy', url: 'https://www.kotyark.com/_files/ugd/510267_0b79ab697d814f178d68db8d3dcebf8c.pdf' },
    { title: 'Criteria for Making Payment to Non-Executive Directors', url: 'https://www.kotyark.com/_files/ugd/510267_4d33cf8b6da0464a960b4f979a27d7be.pdf' },
    { title: 'Familiarization Programme for Independent Directors', url: 'https://www.kotyark.com/_files/ugd/510267_5419cbc6e7ae4c8f8f1de5f53a05f8e0.pdf' },
    { title: 'Policy on Material Subsidiaries', url: 'https://www.kotyark.com/_files/ugd/510267_a0f26b58fadb4f2c8c7dac95a26c7f4f.pdf' },
    { title: 'Terms & Conditions of Appointment of Independent Directors', url: 'https://www.kotyark.com/_files/ugd/510267_f30fc83d57d04bd29ee2d27e5ae39f0c.pdf' },
    { title: 'Dividend Distribution Policy', url: 'https://www.kotyark.com/_files/ugd/510267_e5db2c82a8084abcb3c18cb6bcfcb2c3.pdf' },
    { title: 'CSR Policy', url: 'https://www.kotyark.com/_files/ugd/510267_d3c9c7f77e7444a58dae23c3b4f91e0c.pdf' },
    { title: 'Board Diversity Policy', url: 'https://www.kotyark.com/_files/ugd/510267_d27c04f8f00e4b3e8ffaae42e4f685b8.pdf' },
    { title: 'Policy on Determination of Materiality', url: 'https://www.kotyark.com/_files/ugd/510267_3d9c4c889a1d4d94a3f15d25a3eceaaa.pdf' },
    { title: 'Preservation of Documents and Archival Policy', url: 'https://www.kotyark.com/_files/ugd/510267_d4cfba0ecc444b2d92f8d3b5f8b3b3d5.pdf' },
    { title: 'Risk Management Policy', url: 'https://www.kotyark.com/_files/ugd/510267_e9f84e85f6234e079b44b3281ec1a6cf.pdf' },
    { title: 'Policy for Procedure of Inquiry in Case of Leak of UPSI', url: 'https://www.kotyark.com/_files/ugd/510267_5f5a1d0e10664f0a9b4fd59c2f6bc2c0.pdf' },
    { title: 'Policy on Succession Planning', url: 'https://www.kotyark.com/_files/ugd/510267_bfa44e1b5cbf47ae8ed8dbed4ab8c0f8.pdf' },
    { title: 'Fair Disclosure Policy', url: 'https://www.kotyark.com/_files/ugd/510267_ad5ea2f4c96b4e6d896b4cf5b7c4d5b3.pdf' },
    { title: 'Code of Practices & Procedures for Fair Disclosure of UPSI', url: 'https://www.kotyark.com/_files/ugd/510267_afc2fb2d02d842a7bcf39d3d5f8c6e3c.pdf' },
    { title: 'Sexual Harassment Policy (POSH)', url: 'https://www.kotyark.com/_files/ugd/510267_72f89a41dbbd46058bf3f621e42e0e3d.pdf' },
    { title: 'Quality Control Policy', url: 'https://www.kotyark.com/_files/ugd/510267_c7f4f9e3a8b0417ba35e2c5f8d8c1e0a.pdf' },
    { title: 'Environment & Sustainability Policy', url: 'https://www.kotyark.com/_files/ugd/510267_a3b8d1d5f0c64a3e91e4d8c7b5f2a1e0.pdf' },
    { title: 'Data Privacy Policy', url: 'https://www.kotyark.com/_files/ugd/510267_b2c9e0d4f1a74b3f92f5e9d8c6a3b0f1.pdf' },
  ];

  return (
    <InvestorSubPageLayout title="Company Policies">
      <p style={{ marginBottom: '24px', color: 'var(--color-text-secondary)' }}>
        Corporate governance policies adopted by Kotyark Industries Limited in compliance with the Companies Act, 2013 and SEBI (LODR) Regulations, 2015.
      </p>
      <DocumentList documents={documents} />
    </InvestorSubPageLayout>
  );
}
