import { notFound, permanentRedirect, redirect } from 'next/navigation';
import InvestorSubPageLayout, { DocumentList } from '@/components/InvestorSubPageLayout';
import JsonLd from '@/components/JsonLd';
import { buildMetadata, breadcrumbJsonLd, clampDescription } from '@/lib/seo';
import { findRedirect } from '@/lib/pages';
import { sanitizeRichText, htmlToText } from '@/lib/sanitize';
import { getFolderBySlug, listDocuments, groupDocuments } from '@/lib/documents';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { section } = await params;
  const folder = await getFolderBySlug(section, { visibleOnly: true });
  if (!folder) return { title: 'Not found', robots: { index: false, follow: false } };
  let description = folder.description || htmlToText(folder.intro_html).slice(0, 160)
    || `${folder.name} documents and filings of Kotyark Industries Limited.`;
  if (description.length < 90) { // thin: build a richer fallback (stored data is not changed)
    const d = (folder.description || '').trim().replace(/[.\s]+$/, '');
    description = clampDescription(`${folder.name}${d ? `: ${d}` : ''}. Official disclosures and documents filed by Kotyark Industries Limited, BSE listed biodiesel manufacturer.`);
  }
  return buildMetadata({ title: folder.name, description, path: `/investors/${folder.slug}` });
}

export default async function InvestorSectionPage({ params }) {
  const { section } = await params;
  const folder = await getFolderBySlug(section, { visibleOnly: true });
  if (!folder) {
    const r = await findRedirect(`/investors/${section}`);
    if (r) (r.code === 301 || r.code === 308 ? permanentRedirect : redirect)(r.to);
    notFound();
  }

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
