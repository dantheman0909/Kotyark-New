import { notFound } from 'next/navigation';
import InvestorSubPageLayout, { DocumentList } from '@/components/InvestorSubPageLayout';
import { getInvestorPage, getInvestorSections, getDocumentsForFolder } from '@/lib/pages';

// Render fresh from the DB so admin edits and new pages appear immediately.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = getInvestorPage(slug);
  if (!page) return { title: 'Investor Relations' };
  return {
    title: page.name,
    description: page.meta_description || `${page.name} — Kotyark Industries Limited investor relations.`,
  };
}

export default async function InvestorDynamicPage({ params }) {
  const { slug } = await params;
  const page = getInvestorPage(slug);
  if (!page) notFound();

  const sections = getInvestorSections().filter((s) => s.visible);
  const documents = getDocumentsForFolder(page.id);

  return (
    <InvestorSubPageLayout title={page.name} sections={sections}>
      {page.content ? (
        <div className="cms-content" dangerouslySetInnerHTML={{ __html: page.content }} />
      ) : null}
      <DocumentList documents={documents} />
    </InvestorSubPageLayout>
  );
}
