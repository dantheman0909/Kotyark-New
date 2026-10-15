import { CmsOrLegacy } from '@/components/blocks/PageView';
import LegacyAbout from '@/components/legacy/About';
import { overrideMetadata } from '@/lib/pages';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const FALLBACK = buildMetadata({
  path: '/about',

  title: "About Kotyark Industries - India's Biofuel Pioneer",
  description: "Learn about Kotyark Industries Limited, a BSE-listed biodiesel manufacturer with 480,000 KL capacity. Zero discharge facilities in Rajasthan & Gujarat.",
});

export async function generateMetadata() {
  return overrideMetadata('/about', FALLBACK);
}

export default function AboutPage() {
  return <CmsOrLegacy path="/about"><LegacyAbout /></CmsOrLegacy>;
}
