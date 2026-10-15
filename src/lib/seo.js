// SEO helpers shared by every public route. Server-only.
import { SITE_URL, SITE_NAME, absoluteUrl } from './site';

/**
 * Build a Next.js Metadata object.
 * @param {object} o
 * @param {string} o.title            page title (layout template appends "| Kotyark Industries")
 * @param {string} [o.description]
 * @param {string} o.path             canonical path on our domain, e.g. '/investors/company-policies'
 * @param {string} [o.image]          absolute or root-relative OG image
 * @param {boolean} [o.noindex]
 * @param {string} [o.type]           'website' | 'article'
 */
export function buildMetadata({ title, description = '', path = '/', image, noindex = false, type = 'website' }) {
  const desc = String(description || '').slice(0, 300);
  const img = image ? (image.startsWith('http') ? image : absoluteUrl(image)) : absoluteUrl('/images/hero-forest.jpg');
  return {
    title,
    description: desc || undefined,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: { title, description: desc || undefined, url: absoluteUrl(path), siteName: SITE_NAME, type, images: [{ url: img }], locale: 'en_IN' },
    twitter: { card: 'summary_large_image', title, description: desc || undefined, images: [img] },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Kotyark Industries Limited',
    url: SITE_URL,
    logo: absoluteUrl('/images/kotyark-logo.png'),
  };
}

/** crumbs: [{ name, path }] from root to current page. */
export function breadcrumbJsonLd(crumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: absoluteUrl(c.path) })),
  };
}

/** doc: { title, description, slug, doc_date, fy, mime, updated_at }, landingPath, fileUrl */
export function documentJsonLd(doc, landingPath, fileUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DigitalDocument',
    name: doc.title,
    description: doc.description || undefined,
    url: absoluteUrl(landingPath),
    encodingFormat: doc.mime || 'application/pdf',
    contentUrl: fileUrl.startsWith('http') ? fileUrl : absoluteUrl(fileUrl),
    datePublished: doc.doc_date ? new Date(doc.doc_date).toISOString().slice(0, 10) : undefined,
    dateModified: doc.updated_at ? new Date(doc.updated_at).toISOString() : undefined,
    publisher: { '@type': 'Organization', name: 'Kotyark Industries Limited', url: SITE_URL },
  };
}

/** items: [{ question, answerText }] (answer as plain text) */
export function faqJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(i => ({ '@type': 'Question', name: i.question, acceptedAnswer: { '@type': 'Answer', text: i.answerText } })),
  };
}
