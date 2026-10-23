import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd, productJsonLd, webPageJsonLd } from '@/lib/seo';
import { B100Section, BlendSection, ApplicationsSection, GlycerinSection, ProductBackLinks } from './Platform';
import prim from './prim.module.css';
import s from './platform.module.css';

const KINDS = {
  biodiesel: {
    name: 'Biodiesel (B100)',
    path: '/products/biodiesel',
    description: 'Clean-burning B100 biodiesel from non-edible vegetable oil, with 86% lower greenhouse-gas emissions than petroleum diesel.',
    cta: 'Request bulk supply →',
    subject: 'Bulk biodiesel supply',
    other: { href: '/products/crude-glycerin', label: 'Crude Glycerin' },
  },
  glycerin: {
    name: 'Crude Glycerin',
    path: '/products/crude-glycerin',
    description: 'Crude glycerin recovered during trans-esterification and supplied to food processing, pharmaceutical, cosmetic and industrial buyers.',
    cta: 'Enquire about crude glycerin →',
    subject: 'Crude glycerin',
    other: { href: '/products/biodiesel', label: 'Biodiesel (B100)' },
  },
};

/** Inner product page: hero (eyebrow + H1), the matching Platform sections and links back. kind: 'biodiesel' | 'glycerin'. */
export default function ProductPage({ kind }) {
  const k = KINDS[kind];
  return (
    <>
      <JsonLd data={[
        webPageJsonLd({ name: k.name, path: k.path, description: k.description }),
        productJsonLd(kind),
        breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Products', path: '/products' }, { name: k.name, path: k.path }]),
      ]} />
      <section className={`kd-dark kd-hero-pad ${prim.root}`} aria-labelledby="kd-product-title" data-screen-label="Product — Hero">
        <div className="kd-wrap">
          <nav aria-label="Breadcrumb">
            <div className={`kd-eyebrow ${prim.eb}`}><Link href="/products">Products</Link></div>
          </nav>
          <h1 id="kd-product-title" className={`kd-h1 ${prim.hd}`}>
            <span className="kd-line"><span data-kin="0" className="kd-kin">{k.name}</span></span>
          </h1>
          <div data-reveal="1" data-delay="500" className={s.productCta}>
            <Link href={`/contact?subject=${encodeURIComponent(k.subject)}`} className="kd-btn kd-btn-primary">{k.cta}</Link>
          </div>
        </div>
      </section>
      {kind === 'biodiesel' ? (
        <>
          <B100Section title="B100 specifications" eyebrow="Product 01" />
          <BlendSection />
          <ApplicationsSection />
        </>
      ) : (
        <GlycerinSection title="About crude glycerin" eyebrow="Product 02" />
      )}
      <ProductBackLinks otherHref={k.other.href} otherLabel={k.other.label} />
    </>
  );
}
