import Link from 'next/link';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import InvestorSubPageLayout, { formatFilingDate } from '@/components/InvestorSubPageLayout';
import styles from './doc.module.css';
import JsonLd from '@/components/JsonLd';
import { buildMetadata, breadcrumbJsonLd, documentJsonLd, clampDescription } from '@/lib/seo';
import { findRedirect } from '@/lib/pages';
import {
  getFolderBySlug, getDocumentBySlug, documentFileUrl, documentLandingPath, labelForMime,
} from '@/lib/documents';

export const dynamic = 'force-dynamic';

async function load(section, docSlug) {
  const doc = await getDocumentBySlug(docSlug, { publishedOnly: true });
  if (!doc) return {};
  return { doc, folder: await getFolderBySlug(section, { visibleOnly: true }) };
}

// 30-65 chars: long legal titles are clamped, very short ones get the fuller brand suffix.
function docTitle(t) {
  const base = clampDescription(t, 42);
  const short = `${base} | Kotyark Investors`;
  return short.length >= 30 ? short : `${base} | Kotyark Industries Investor Relations`;
}

export async function generateMetadata({ params }) {
  const { section, doc: docSlug } = await params;
  const { doc, folder } = await load(section, docSlug);
  if (!doc || !folder) return { title: 'Not found', robots: { index: false, follow: false } };
  // Canonical always names the folder the document currently lives in.
  let description = doc.description || `${doc.title} - ${doc.folder_name}, Kotyark Industries Limited.`;
  if (description.length < 90) { // thin: build a richer fallback (stored data is not changed)
    description = clampDescription(`${doc.title}: ${doc.fy ? `${doc.fy} ` : ''}${doc.folder_name} disclosure by Kotyark Industries Limited (NSE listed). View or download ${doc.mime === 'application/pdf' ? 'the PDF' : 'the file'}.`);
  }
  // Long legal titles are clamped so the rendered <title> stays under ~65 chars; og:title keeps the clamp too.
  return buildMetadata({
    title: { absolute: docTitle(doc.title) },
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

  const sizeStr = !doc.size ? '' : doc.size > 1048576 ? `${(doc.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(doc.size / 1024))} KB`;
  const details = [
    ['Section', doc.folder_name],
    ['Financial year', doc.fy],
    ['Date', doc.doc_date ? formatFilingDate(doc.doc_date) : 'Standing'],
    ['Format', label],
    ['Size', sizeStr],
  ].filter(([, v]) => v);
  const openLabel = `Open ${isPdf ? 'PDF' : label} ↗`;

  return (
    <InvestorSubPageLayout title={doc.title} activeSlug={doc.folder_slug}
      parent={{ name: doc.folder_name, href: `/investors/${doc.folder_slug}` }}
      stats={[label, doc.doc_date ? formatFilingDate(doc.doc_date) : 'Standing']}>
      <JsonLd data={[
        documentJsonLd(doc, landing, fileUrl),
        breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Investor Relations', path: '/investors' },
          { name: doc.folder_name, path: `/investors/${doc.folder_slug}` },
          { name: doc.title, path: landing },
        ]),
      ]} />

      <div className={styles.panel}>
        {doc.description && <p className={styles.desc}>{doc.description}</p>}
        <dl className={styles.details}>
          {details.map(([k, v]) => (
            <div key={k} className={styles.detail}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <div className={styles.actions}>
          <a href={fileUrl} className="kd-btn kd-btn-dark" {...(stored ? { download: `${doc.slug}.${fileUrl.split('.').pop()}` } : { target: '_blank', rel: 'noopener noreferrer' })}>
            {openLabel}
          </a>
          <Link href={`/investors/${doc.folder_slug}`} className="kd-ulink">Back to {doc.folder_name}</Link>
        </div>
      </div>

      {stored && isPdf && (
        <iframe src={fileUrl} title={doc.title} className={styles.frame} />
      )}
      {stored && isImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fileUrl} alt={doc.title} className={styles.img} />
      )}
    </InvestorSubPageLayout>
  );
}
