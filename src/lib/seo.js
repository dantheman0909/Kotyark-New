// SEO helpers shared by every public route. Server-only.
import { SITE_URL, SITE_NAME, absoluteUrl } from './site';

// <link rel="alternate" type="text/plain"> to the LLM text files. Repeated here because a page's `alternates`
// replaces the layout's wholesale.
const LLM_ALTERNATES = { 'text/plain': [{ url: '/llms.txt', title: 'llms.txt' }, { url: '/llms-full.txt', title: 'llms-full.txt' }] };

// Routes with a file-based card: src/app/{,about,contact,products,products/biodiesel,products/crude-glycerin,investors,
// investors/[section],investors/[section]/[doc]}/opengraph-image.js
const OG_FILE_PATHS = new Set(['/', '/about', '/contact', '/products', '/products/biodiesel', '/products/crude-glycerin', '/investors']);
function hasOgFile(path) {
  const p = (path || '/').replace(/\/$/, '') || '/';
  if (OG_FILE_PATHS.has(p)) return true;
  const m = p.match(/^\/investors\/[^/]+(\/[^/]+)?$/);
  return Boolean(m);
}

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
  // An explicit image (e.g. a CMS page's SEO image) wins and beats any file-based image in the same segment.
  // Otherwise the segment's own opengraph-image.js supplies og:image / twitter:image. Next does NOT inherit a
  // parent's file once a child sets openGraph, and a catch-all segment cannot hold one, so paths without a
  // file of their own (CMS pages, search) point at the generated site card.
  const img = image ? (image.startsWith('http') ? image : absoluteUrl(image)) : hasOgFile(path) ? null : absoluteUrl('/opengraph-image');
  // A title that already names the brand must not get the layout's " | Kotyark Industries" appended again.
  // { absolute: '...' } is passed through untouched (the exact rendered title).
  const plainTitle = title && typeof title === 'object' ? title.absolute : title;
  const metaTitle = typeof title !== 'string' ? title : title.toLowerCase().includes(SITE_NAME.toLowerCase()) ? { absolute: title } : title;
  return {
    title: metaTitle,
    description: desc || undefined,
    alternates: { canonical: absoluteUrl(path), types: LLM_ALTERNATES },
    openGraph: { title: plainTitle, description: desc || undefined, url: absoluteUrl(path), siteName: SITE_NAME, type, locale: 'en_IN', ...(img ? { images: [{ url: img }] } : {}) },
    twitter: { card: 'summary_large_image', title: plainTitle, description: desc || undefined, ...(img ? { images: [img] } : {}) },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

// ---- Company facts (single source for JSON-LD, llms.txt and page copy checks). ----
export const COMPANY = {
  legalName: 'Kotyark Industries Limited',
  formerName: 'Kotyark Industries Private Limited',
  cin: 'L15149RJ2023PLC091598',
  ticker: 'NSE: KOTYARK',
  email: 'info@kotyark.com',
  foundingDate: '2023',
  address: { streetAddress: 'F-20, RIICO Industrial Area, Swaroopganj', addressLocality: 'Sirohi', addressRegion: 'Rajasthan', postalCode: '307026', addressCountry: 'IN' },
  md: 'Gaurang Rameshchandra Shah',
};

const ORG_ID = `${SITE_URL}/#organization`;

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Corporation',
    '@id': ORG_ID,
    name: COMPANY.legalName,
    legalName: COMPANY.legalName,
    alternateName: ['Kotyark Industries', 'Kotyark', COMPANY.formerName],
    url: SITE_URL,
    logo: absoluteUrl('/images/kil-logo-white.png'),
    image: absoluteUrl('/images/hero-forest.jpg'),
    email: COMPANY.email,
    tickerSymbol: COMPANY.ticker,
    identifier: { '@type': 'PropertyValue', propertyID: 'CIN', value: COMPANY.cin },
    foundingDate: COMPANY.foundingDate,
    address: { '@type': 'PostalAddress', ...COMPANY.address },
    areaServed: { '@type': 'Country', name: 'India' },
    knowsAbout: ['Biodiesel', 'B100 biodiesel', 'Crude glycerin', 'Trans-esterification', 'Biofuels', 'Renewable energy'],
    award: 'Certificate of Excellence, World Book of Records London, House of Commons, Westminster (26 June 2026)',
    employee: { '@type': 'Person', name: COMPANY.md, jobTitle: 'Chairman cum Managing Director' },
    contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer service', email: COMPANY.email, areaServed: 'IN', availableLanguage: ['en', 'hi', 'gu'] }],
  };
}

/** WebPage subtype for a public page: type 'WebPage' | 'AboutPage' | 'ContactPage' | 'CollectionPage'. */
export function webPageJsonLd({ type = 'WebPage', name, path, description }) {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${absoluteUrl(path)}#webpage`,
    name,
    url: absoluteUrl(path),
    description: description || undefined,
    inLanguage: 'en-IN',
    isPartOf: { '@type': 'WebSite', '@id': `${SITE_URL}/#website` },
    about: { '@id': ORG_ID },
  };
}

const B100_SPECS = [['Chemical type', 'Mono alkyl ester (FAME)'], ['Feedstock', 'Non-edible vegetable oils'], ['Process', 'Trans-esterification'], ['GHG reduction', '86% vs. petroleum diesel'], ['Blending range', 'B5 (5%) to B100 (neat)'], ['Engine compatibility', 'All diesel engines; B5–B20 without modification'], ['Cetane number', 'Higher than conventional HSD'], ['Biodegradability', '100% biodegradable, non-toxic'], ['Lubricity', 'Superior to petroleum diesel'], ['Approval', 'Bio-Fuel Authority, Govt. of Rajasthan']];

/** kind: 'biodiesel' | 'glycerin'. No price (prices are quoted per order). */
export function productJsonLd(kind) {
  const base = { '@context': 'https://schema.org', '@type': 'Product', brand: { '@id': ORG_ID }, manufacturer: { '@id': ORG_ID } };
  if (kind === 'glycerin') {
    return { ...base, name: 'Crude Glycerin', url: absoluteUrl('/products/crude-glycerin'), image: absoluteUrl('/images/glycerin-product.png'), category: 'Industrial chemicals',
      description: 'Crude glycerin recovered during trans-esterification and supplied to food processing, pharmaceutical, cosmetic and industrial buyers.' };
  }
  return { ...base, name: 'Biodiesel (B100)', url: absoluteUrl('/products/biodiesel'), image: absoluteUrl('/images/biodiesel-product.png'), category: 'Biofuel',
    description: 'A renewable, clean-burning replacement for High-Speed Diesel with higher cetane, superior lubricity and 86% lower greenhouse-gas emissions.',
    additionalProperty: B100_SPECS.map(([name, value]) => ({ '@type': 'PropertyValue', name, value })) };
}

/** The two manufacturing plants. */
export function plantsJsonLd() {
  const plant = (name, address, desc) => ({ '@type': 'Place', name, description: desc, address: { '@type': 'PostalAddress', ...address }, containedInPlace: { '@type': 'Country', name: 'India' } });
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Kotyark Industries manufacturing plants',
    itemListElement: [
      { '@type': 'ListItem', position: 1, item: plant('Plant I, Sirohi, Rajasthan', COMPANY.address, 'Primary zero-discharge biodiesel facility at RIICO Industrial Area, Swaroopganj.') },
      { '@type': 'ListItem', position: 2, item: plant('Plant II, Anand, Gujarat', { addressLocality: 'Anand', addressRegion: 'Gujarat', addressCountry: 'IN' }, 'Second facility extending capacity and reach to clients across western India.') },
    ],
  };
}

/** people: [{ name, jobTitle, description }] */
export function peopleJsonLd(people) {
  return people.map((p) => ({ '@context': 'https://schema.org', '@type': 'Person', name: p.name, jobTitle: p.jobTitle, description: p.description, worksFor: { '@id': ORG_ID } }));
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

/** Trim to `max` chars at a word boundary (no ellipsis). */
export function clampDescription(text, max = 160) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max + 1);
  const i = cut.lastIndexOf(' ');
  return (i > 40 ? cut.slice(0, i) : t.slice(0, max)).replace(/[\s,;:.-]+$/, '');
}
