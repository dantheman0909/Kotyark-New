import InvestorSubPageLayout, { DocumentList } from '@/components/InvestorSubPageLayout';

export const metadata = {
  title: 'Memorandum & Articles of Association (MOA - AOA)',
  description: 'Memorandum of Association and Articles of Association of Kotyark Industries Limited.',
};

export default function MoaAoaPage() {
  const documents = [
    { title: 'MOA - AOA (Memorandum & Articles of Association)', url: 'https://www.kotyark.com/_files/ugd/510267_e38ad21a33454ce1b57355f32228f284.pdf' },
  ];

  return (
    <InvestorSubPageLayout title="Memorandum & Articles of Association">
      <p style={{ marginBottom: '24px', color: 'var(--color-text-secondary)' }}>
        The Memorandum of Association (MOA) and Articles of Association (AOA) are the founding constitutional documents of Kotyark Industries Limited, defining the company&apos;s objectives, powers, and internal governance rules.
      </p>
      <DocumentList documents={documents} />
    </InvestorSubPageLayout>
  );
}
