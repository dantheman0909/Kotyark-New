// Pure SEO builders (JSON-LD, meta tags). No Wix imports: unit-tested in Node.

export const ORG = {
  legalName: 'Kotyark Industries Limited',
  name: 'Kotyark Industries',
  email: 'info@kotyark.com',
  streetAddress: 'F-20, RICCO Industrial Area, Swaroopganj',
  locality: 'Sirohi',
  region: 'Rajasthan',
  postalCode: '307026',
  country: 'IN',
  cin: 'L15149RJ2023PLC091598',
  description: "India's approved biodiesel manufacturer. 480,000 KL capacity. Carbon neutral fuel for transport & industry. BSE listed.",
};

const trim = (o) => JSON.parse(JSON.stringify(o)); // drop undefined

export function organizationJsonLd(origin, logoUrl) {
  return trim({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: ORG.name,
    legalName: ORG.legalName,
    url: origin,
    logo: logoUrl || undefined, // pass the public logo URL (Media Manager https URL) when known
    email: ORG.email,
    description: ORG.description,
    identifier: ORG.cin,
    address: {
      '@type': 'PostalAddress',
      streetAddress: ORG.streetAddress,
      addressLocality: ORG.locality,
      addressRegion: ORG.region,
      postalCode: ORG.postalCode,
      addressCountry: ORG.country,
    },
  });
}

export function breadcrumbJsonLd(origin, crumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: `${origin}${c.path}` })),
  };
}

/**
 * ItemList of DigitalDocument for the documents that have a real link.
 * docs: [{ title, url (https), date? (ISO or Date) }]
 */
export function documentListJsonLd(origin, section, docs) {
  const linked = (docs || []).filter((d) => d.url);
  return trim({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: section.heading || section.title,
    description: section.description,
    url: `${origin}/investors/${section.slug}`,
    isPartOf: { '@type': 'WebSite', name: ORG.name, url: origin },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: linked.length,
      itemListElement: linked.map((d, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'DigitalDocument',
          name: d.title,
          url: d.url,
          encodingFormat: 'application/pdf',
          datePublished: d.date ? new Date(d.date).toISOString().slice(0, 10) : undefined,
          publisher: { '@type': 'Organization', name: ORG.name },
        },
      })),
    },
  });
}

/** Everything wix-seo-frontend needs for a section page. */
export function buildSectionSeo(origin, section, docs) {
  const path = `/investors/${section.slug}`;
  const title = section.seoTitle || section.heading || section.title;
  const description = section.seoDescription || section.description || '';
  return {
    title,
    description,
    canonical: `${origin}${path}`,
    metaTags: [
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: `${origin}${path}` },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: ORG.name },
    ],
    structuredData: [
      organizationJsonLd(origin),
      breadcrumbJsonLd(origin, [
        { name: 'Home', path: '/' },
        { name: 'Investor Relations', path: '/investors' },
        { name: section.heading || section.title, path },
      ]),
      documentListJsonLd(origin, section, docs),
    ],
  };
}

export function buildHubSeo(origin) {
  const description = 'Access SEBI filings, board meetings, financial statements & company policies for Kotyark Industries Limited. BSE listed biofuel company.';
  const title = 'Investor Relations - BSE Listed';
  return {
    title,
    description,
    canonical: `${origin}/investors`,
    metaTags: [
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: `${origin}/investors` },
      { property: 'og:type', content: 'website' },
    ],
    structuredData: [
      organizationJsonLd(origin),
      breadcrumbJsonLd(origin, [{ name: 'Home', path: '/' }, { name: 'Investor Relations', path: '/investors' }]),
    ],
  };
}
