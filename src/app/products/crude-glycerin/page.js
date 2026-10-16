import { CmsOrLegacy } from '@/components/blocks/PageView';
import ProductPage from '@/components/site/ProductPage';
import { overrideMetadata } from '@/lib/pages';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const FALLBACK = buildMetadata({
  path: '/products/crude-glycerin',

  title: { absolute: 'Crude Glycerin Supplier India | Kotyark' },
  description: 'Crude glycerin recovered during biodiesel production at Kotyark, supplied in bulk to food, pharmaceutical, cosmetic and industrial buyers across India.',
});

export async function generateMetadata() {
  return overrideMetadata('/products/crude-glycerin', FALLBACK);
}

export default function CrudeGlycerinPage() {
  return <CmsOrLegacy path="/products/crude-glycerin"><ProductPage kind="glycerin" /></CmsOrLegacy>;
}
