import { CmsOrLegacy } from '@/components/blocks/PageView';
import LegacyCrudeGlycerin from '@/components/legacy/CrudeGlycerin';
import { overrideMetadata } from '@/lib/pages';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const FALLBACK = buildMetadata({
  path: '/products/crude-glycerin',

  title: 'Crude Glycerin Supplier India',
  description: "High-quality crude glycerin from biodiesel production. Applications in food, pharmaceuticals & cosmetics. 210 KL/day capacity at Sirohi.",
});

export async function generateMetadata() {
  return overrideMetadata('/products/crude-glycerin', FALLBACK);
}

export default function CrudeGlycerinPage() {
  return <CmsOrLegacy path="/products/crude-glycerin"><LegacyCrudeGlycerin /></CmsOrLegacy>;
}
