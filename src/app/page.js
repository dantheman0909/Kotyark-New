import { CmsOrLegacy } from '@/components/blocks/PageView';
import LegacyHome from '@/components/legacy/Home';
import { overrideMetadata } from '@/lib/pages';
import { absoluteUrl } from '@/lib/site';

// A published CMS page at "/" replaces the hard-coded home page; otherwise the legacy JSX renders unchanged.
export const dynamic = 'force-dynamic';

// Title/description inherit from the root layout; only the canonical is added.
const FALLBACK = { alternates: { canonical: absoluteUrl('/') } };

export async function generateMetadata() {
  return overrideMetadata('/', FALLBACK);
}

export default function HomePage() {
  return <CmsOrLegacy path="/"><LegacyHome /></CmsOrLegacy>;
}
