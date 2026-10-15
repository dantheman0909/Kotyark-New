import { notFound, permanentRedirect, redirect } from 'next/navigation';
import InvestorSubPageLayout from '@/components/InvestorSubPageLayout';
import JsonLd from '@/components/JsonLd';
import { buildMetadata, breadcrumbJsonLd, documentJsonLd, clampDescription } from '@/lib/seo';
import { findRedirect } from '@/lib/pages';
import {
  getFolderBySlug, getDocumentBySlug, documentFileUrl, documentLandingPath, labelForMime, formatDocDate,
} from '@/lib/documents';

export const dynamic = 'force-dynamic';

async function load(section, docSlug) {
  const doc = await getDocumentBySlug(docSlug, { publishedOnly: true });
  if (!doc) return {};
  return { doc, folder: await getFolderBySlug(section, { visibleOnly: true }) };
}

export async function generateMetadata({ params }) {
  const { section, doc: docSlug } = await params;
  const { doc, folder } = await load(section, docSlug);
  if (!doc || !folder) return { title: 'Not found', robots: { index: false, follow: false } };
  // Canonical always names the folder the document currently lives in.
  let description = doc.description || `${doc.title} - ${doc.folder_name}, Kotyark Industries Limited.`;
  if (description.length < 90) { // thin: build a richer fallback (stored data is not changed)
    description = clampDescription(`${doc.title}: ${doc.fy ? `${doc.fy} ` : ''}${doc.folder_name} disclosure by Kotyark Industries Limited (BSE listed). View or download ${doc.mime === 'application/pdf' ? 'the PDF' : 'the file'}.`);
  }
  return buildMetadata({
    title: doc.title,
    description,
    path: documentLandingPath(doc.folder_slug, doc),
    type: 'article',
  });
}

export default async function DocumentPage({ params }) {
  const { section, doc: docSlug } = await params;
  const { doc, folder } = await load(section, docSlug);
  if (!doc || !folder) {
    const r = await findRedirect(`/investors/${section}/${docSlug}`);
    if (r) (r.code === 301 || r.code === 308 ? permanentRedirect : redirect)(r.to);
    notFound();
  }
  // Moved to another folder: send old URLs to the current canonical one.
  if (doc.folder_slug !== section) permanentRedirect(documentLandingPath(doc.folder_slug, doc));

  const landing = documentLandingPath(doc.folder_slug, doc);
  const fileUrl = documentFileUrl(doc);
  const stored = Boolean(doc.storage_key);
  const isPdf = doc.mime === 'application/pdf';
  const isImage = doc.mime.startsWith('image/');
  const label = labelForMime(doc.mime);

  return (
    <InvestorSubPageLayout title={doc.title} activeSlug={doc.folder_slug}
      parent={{ name: doc.folder_name, href: `/investors/${doc.folder_slug}` }}>
      <JsonLd data={[
        documentJsonLd(doc, landing, fileUrl),
        breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Investor Relations', path: '/investors' },
          { name: doc.folder_name, path: `/investors/${doc.folder_slug}` },
          { name: doc.title, path: landing },
        ]),
      ]} />

      {doc.description && (
        <p style={{ marginBottom: '16px', color: 'var(--color-text-secondary)' }}>{doc.description}</p>
      )}
      <p style={{ marginBottom: '20px', fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
        {[doc.fy, doc.doc_date ? formatDocDate(doc.doc_date) : null, label].filter(Boolean).join(' · ')}
      </p>

      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <a href={fileUrl} className="btn btn-primary" {...(stored ? { download: `${doc.slug}.${fileUrl.split('.').pop()}` } : { target: '_blank', rel: 'noopener noreferrer' })}>
          {stored ? `Download ${label}` : 'Open document'}
        </a>
        <a href={`/investors/${doc.folder_slug}`} className="btn btn-secondary">Back to {doc.folder_name}</a>
      </div>

      {stored && isPdf && (
        <iframe src={fileUrl} title={doc.title}
          style={{ width: '100%', height: '80vh', minHeight: 480, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', background: '#fff' }} />
      )}
      {stored && isImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fileUrl} alt={doc.title} style={{ maxWidth: '100%', height: 'auto', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }} />
      )}
    </InvestorSubPageLayout>
  );
}
