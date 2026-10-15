import { notFound } from 'next/navigation';
import InvestorSubPageLayout, { DocumentList } from '@/components/InvestorSubPageLayout';
import JsonLd from '@/components/JsonLd';
import { buildMetadata, breadcrumbJsonLd } from '@/lib/seo';
import { sanitizeRichText, htmlToText } from '@/lib/sanitize';
import { getFolderBySlug, listDocuments, groupDocuments } from '@/lib/documents';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { section } = await params;
  const folder = await getFolderBySlug(section, { visibleOnly: true });
  if (!folder) return { title: 'Not found', robots: { index: false, follow: false } };
  const description = folder.description || htmlToText(folder.intro_html).slice(0, 160)
    || `${folder.name} documents and filings of Kotyark Industries Limited.`;
  return buildMetadata({ title: folder.name, description, path: `/investors/${folder.slug}` });
}

export default async function InvestorSectionPage({ params }) {
  const { section } = await params;
  const folder = await getFolderBySlug(section, { visibleOnly: true });
  if (!folder) notFound();

  const documents = await listDocuments(folder.id, { publishedOnly: true });
  const groups = groupDocuments(documents, folder.group_by);
  const intro = sanitizeRichText(folder.intro_html);

  return (
    <InvestorSubPageLayout title={folder.name} activeSlug={folder.slug}>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Investor Relations', path: '/investors' },
        { name: folder.name, path: `/investors/${folder.slug}` },
      ])} />
      {intro && (
        <div style={{ marginBottom: '24px', color: 'var(--color-text-secondary)' }} dangerouslySetInnerHTML={{ __html: intro }} />
      )}
      {documents.length === 0 ? (
        <div className="fy-card" style={{ textAlign: 'center' }}>
          <h3>No documents yet</h3>
          <p>Documents for this section will be published here. Please check back soon.</p>
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.key} style={{ marginBottom: '28px' }}>
            {g.label && <h2 style={{ fontSize: '1.15rem', margin: '0 0 12px', color: 'var(--color-primary)' }}>{g.label}</h2>}
            <DocumentList documents={g.docs} folderSlug={folder.slug} />
          </div>
        ))
      )}
    </InvestorSubPageLayout>
  );
}
