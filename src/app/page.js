import { CmsOrLegacy } from '@/components/blocks/PageView';
import Home from '@/components/site/Home';
import JsonLd from '@/components/JsonLd';
import { overrideMetadata } from '@/lib/pages';
import { absoluteUrl } from '@/lib/site';
import { webPageJsonLd, plantsJsonLd } from '@/lib/seo';
import { getQuote, getHistory } from '@/lib/stock';

// A published CMS page at "/" replaces the hard-coded home page; otherwise the redesigned home renders.
export const dynamic = 'force-dynamic';

// Exact title (no layout suffix), description and canonical; a published CMS page at "/" overrides them.
const FALLBACK = {
  title: { absolute: 'Kotyark Industries | B100 Biodiesel Manufacturer India' },
  description: 'Kotyark Industries Limited (NSE: KOTYARK) manufactures B100 biodiesel from non-edible oils: 480,000 KL a year, two zero-discharge plants, 86% lower GHG.',
  alternates: { canonical: absoluteUrl('/') },
};

export async function generateMetadata() {
  return overrideMetadata('/', FALLBACK);
}

// Only rendered when no CMS page overrides "/", so the quote is not fetched for CMS-driven homes.
async function LiveHome() {
  // Quote and history are independent: fetch them together (both are stale-while-revalidate and never throw).
  const [quote, history] = await Promise.all([
    getQuote().catch(() => null),
    getHistory('1Y').catch(() => ({ range: '1Y', points: [] })),
  ]);
  return (
    <>
      <JsonLd data={[
        webPageJsonLd({ name: 'Kotyark Industries Limited: India\'s B100 biodiesel manufacturer', path: '/', description: 'Kotyark Industries turns non-edible vegetable oils into B100 biodiesel, with 480,000 KL of annual capacity across two zero-discharge plants in Rajasthan and Gujarat.' }),
        plantsJsonLd(),
      ]} />
      <Home quote={quote} history={history} />
    </>
  );
}

export default function HomePage() {
  return <CmsOrLegacy path="/"><LiveHome /></CmsOrLegacy>;
}
