import { CmsOrLegacy } from '@/components/blocks/PageView';
import About from '@/components/site/About';
import { overrideMetadata } from '@/lib/pages';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const FALLBACK = buildMetadata({
  path: '/about',

  title: { absolute: 'About Kotyark | Biodiesel Manufacturer in India' },
  description: 'Kotyark Industries Limited (NSE: KOTYARK): board, vision and milestones of an Indian B100 biodiesel manufacturer with zero-discharge plants in Sirohi and Anand.',
});

export async function generateMetadata() {
  return overrideMetadata('/about', FALLBACK);
}

export default function AboutPage() {
  return <CmsOrLegacy path="/about"><About /></CmsOrLegacy>;
}
