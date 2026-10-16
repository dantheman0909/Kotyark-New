import { notFound, permanentRedirect, redirect } from 'next/navigation';
import InvestorSubPageLayout, { formatFilingDate } from '@/components/InvestorSubPageLayout';
import layoutStyles from '@/components/InvestorSubPageLayout.module.css';
import FilingDocs from '@/components/site/FilingDocs';
import JsonLd from '@/components/JsonLd';
import { buildMetadata, breadcrumbJsonLd, webPageJsonLd, clampDescription } from '@/lib/seo';
import { findRedirect } from '@/lib/pages';
import { sanitizeRichText, htmlToText } from '@/lib/sanitize';
import { getFolderBySlug, listDocuments, groupDocuments, documentLandingPath, labelForMime } from '@/lib/documents';

export const dynamic = 'force-dynamic';

const fmtSize = (b) => (!b ? '' : b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export async function generateMetadata({ params }) {
  const { section } = await params;
  const folder = await getFolderBySlug(section, { visibleOnly: true });
  if (!folder) return { title: 'Not found', robots: { index: false, follow: false } };
  let description = folder.description || htmlToText(folder.intro_html).slice(0, 160)
    || `${folder.name} documents and filings of Kotyark Industries Limited.`;
  if (description.length < 90) { // thin: build a richer fallback (stored data is not changed)
    const d = (folder.description || '').trim().replace(/[.\s]+$/, '');
    description = clampDescription(`${folder.name}${d ? `: ${d}` : ''}. Official disclosures and documents filed by Kotyark Industries Limited, NSE listed biodiesel manufacturer.`);
  }
  const t = `${folder.name} | Investor Relations (NSE: KOTYARK)`;
  return buildMetadata({ title: { absolute: t.length <= 65 ? t : `${clampDescription(folder.name, 44)} | Kotyark Investors` }, description, path: `/investors/${folder.slug}` });
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

  const rows = groups.flatMap((g) => g.docs.map((doc) => ({
    id: doc.id,
    href: documentLandingPath(doc.folder_slug || folder.slug, doc),
    when: formatFilingDate(doc.doc_date) || 'Standing',
    title: doc.title,
    meta: [labelForMime(doc.mime), fmtSize(doc.size), g.label].filter(Boolean).join(' · '),
    group: g.label,
  })));
  const labels = groups.map((g) => g.label).filter(Boolean);
  const latest = documents.reduce((m, d) => {
    const v = d.doc_date || (d.created_at ? new Date(d.created_at).toISOString().slice(0, 10) : '');
    return v > m ? v : m;
  }, '');
  const stats = [`${documents.length} published`, latest ? `Latest ${formatFilingDate(latest)}` : 'No filings yet'];

  return (
    <InvestorSubPageLayout title={folder.name} activeSlug={folder.slug} stats={stats}>
      <JsonLd data={[
        webPageJsonLd({ type: 'CollectionPage', name: folder.name, path: `/investors/${folder.slug}`, description: folder.description || undefined }),
        breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Investor Relations', path: '/investors' },
          { name: folder.name, path: `/investors/${folder.slug}` },
        ]),
      ]} />
      {intro && <div className={layoutStyles.intro} dangerouslySetInnerHTML={{ __html: intro }} />}
      <FilingDocs docs={rows} groups={labels} />
    </InvestorSubPageLayout>
  );
}
