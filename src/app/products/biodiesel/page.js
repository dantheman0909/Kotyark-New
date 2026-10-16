import { CmsOrLegacy } from '@/components/blocks/PageView';
import ProductPage from '@/components/site/ProductPage';
import { overrideMetadata } from '@/lib/pages';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const FALLBACK = buildMetadata({
  path: '/products/biodiesel',

  title: { absolute: 'B100 Biodiesel Manufacturer India | Kotyark' },
  description: 'Kotyark B100 biodiesel: mono alkyl ester from non-edible oils, 86% lower GHG than diesel, B5 to B100 blends, Bio-Fuel Authority approved. Request bulk supply.',
});

export async function generateMetadata() {
  return overrideMetadata('/products/biodiesel', FALLBACK);
}

export default function BiodieselPage() {
  return <CmsOrLegacy path="/products/biodiesel"><ProductPage kind="biodiesel" /></CmsOrLegacy>;
}
