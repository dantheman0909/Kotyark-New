import { CmsOrLegacy } from '@/components/blocks/PageView';
import LegacyBiodiesel from '@/components/legacy/Biodiesel';
import { overrideMetadata } from '@/lib/pages';

export const dynamic = 'force-dynamic';

const FALLBACK = {
  title: 'Biodiesel B100 - Renewable Diesel Fuel',
  description: "Clean-burning B100 biodiesel from non-edible vegetable oil. 86% less greenhouse gas. More power, better mileage. Order biodiesel now.",
};

export async function generateMetadata() {
  return overrideMetadata('/products/biodiesel', FALLBACK);
}

export default function BiodieselPage() {
  return <CmsOrLegacy path="/products/biodiesel"><LegacyBiodiesel /></CmsOrLegacy>;
}
