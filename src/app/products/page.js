import { CmsOrLegacy } from '@/components/blocks/PageView';
import Platform from '@/components/site/Platform';
import JsonLd from '@/components/JsonLd';
import { overrideMetadata } from '@/lib/pages';
import { buildMetadata, productJsonLd, webPageJsonLd } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const FALLBACK = buildMetadata({
  path: '/products',

  title: { absolute: 'Biodiesel and Crude Glycerin Products | Kotyark' },
  description: 'B100 biodiesel and crude glycerin from non-edible oils, made at Kotyark zero-discharge plants in Rajasthan and Gujarat. Specs and bulk supply enquiries.',
});

export async function generateMetadata() {
  return overrideMetadata('/products', FALLBACK);
}

export default function ProductsPage() {
  return (
    <CmsOrLegacy path="/products">
      <JsonLd data={[
        webPageJsonLd({ type: 'CollectionPage', name: 'Biodiesel & Glycerin Products', path: '/products', description: 'B100 biodiesel and crude glycerin, produced by trans-esterification of non-edible vegetable oils at zero-discharge plants.' }),
        productJsonLd('biodiesel'),
        productJsonLd('glycerin'),
      ]} />
      <Platform />
    </CmsOrLegacy>
  );
}
