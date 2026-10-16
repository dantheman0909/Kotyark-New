import './globals.css';
import '@/components/site/site.css';
import { Archivo, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import LayoutShell from '@/components/LayoutShell';
import JsonLd from '@/components/JsonLd';
import { organizationJsonLd } from '@/lib/seo';
import { SITE_URL, SITE_NAME, absoluteUrl, getSetting } from '@/lib/site';

// Redesign typefaces, self-hosted at build time (no runtime request to Google).
const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], display: 'swap', variable: '--font-archivo' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], display: 'swap', variable: '--font-mono' });

// The GA4 id lives in site_settings, so the shell is rendered per request (and a change applies immediately).
export const dynamic = 'force-dynamic';

const DEFAULT_TITLE = 'Kotyark Industries - Leading Biodiesel Manufacturer India';
const DEFAULT_DESCRIPTION = "India's approved biodiesel manufacturer. 480,000 KL capacity. Carbon neutral fuel for transport & industry. BSE listed. Get a quote today.";
const OG_IMAGE = absoluteUrl('/images/hero-forest.jpg');

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ['biodiesel manufacturer India', 'biofuel', 'biodiesel', 'crude glycerin', 'renewable energy India', 'Kotyark Industries', 'B100 biodiesel', 'carbon neutral fuel'],
  authors: [{ name: 'Kotyark Industries Limited' }],
  creator: 'Kotyark Industries Limited',
  publisher: 'Kotyark Industries Limited',
  openGraph: {
    title: DEFAULT_TITLE,
    description: "India's approved biodiesel manufacturer with 480,000 KL capacity. Carbon neutral fuel solutions.",
    siteName: SITE_NAME,
    locale: 'en_IN',
    type: 'website',
    images: [{ url: OG_IMAGE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: "India's approved biodiesel manufacturer with 480,000 KL capacity. Carbon neutral fuel solutions.",
    images: [OG_IMAGE],
  },
  icons: { icon: '/favicon.ico', apple: '/images/kotyark-logo.png' },
  robots: { index: true, follow: true },
};

function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

// Short in-process cache: avoids one query per request, and a DB outage costs one bounded wait, not one per page.
let gaCache = { id: null, until: 0 };
async function getGa4Id() {
  if (Date.now() < gaCache.until) return gaCache.id;
  let id = null;
  let ttl = 60_000;
  try {
    const settings = await Promise.race([
      getSetting('analytics', null),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500)),
    ]);
    const v = settings && typeof settings.ga4Id === 'string' ? settings.ga4Id.trim() : '';
    id = /^G-[A-Z0-9]{4,20}$/.test(v) ? v : null;
  } catch {
    ttl = 15_000; // outage: don't retry on every request, and never break the layout
  }
  gaCache = { id, until: Date.now() + ttl };
  return id;
}

export default async function RootLayout({ children }) {
  const ga4Id = await getGa4Id();
  return (
    <html lang="en-IN" className={`${archivo.variable} ${mono.variable}`}>
      <body>
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <LayoutShell>{children}</LayoutShell>
        {ga4Id && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
