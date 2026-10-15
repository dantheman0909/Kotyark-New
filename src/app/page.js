import { CmsOrLegacy } from '@/components/blocks/PageView';
import LegacyHome from '@/components/legacy/Home';
import { overrideMetadata } from '@/lib/pages';

// A published CMS page at "/" replaces the hard-coded home page; otherwise the legacy JSX renders unchanged.
export const dynamic = 'force-dynamic';

const FALLBACK = undefined; // inherits the site-wide metadata from the root layout

export async function generateMetadata() {
  return (await overrideMetadata('/', FALLBACK)) ?? {};
}

export default function HomePage() {
  return <CmsOrLegacy path="/"><LegacyHome /></CmsOrLegacy>;
}
