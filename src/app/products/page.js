import { CmsOrLegacy } from '@/components/blocks/PageView';
import LegacyProducts from '@/components/legacy/Products';
import { overrideMetadata } from '@/lib/pages';

export const dynamic = 'force-dynamic';

const FALLBACK = {
  title: 'Biodiesel & Glycerin Products',
  description: "Explore Kotyark's range of biofuel products: B100 Biodiesel, Crude Glycerin, and more. Government approved. Available across India.",
};

export async function generateMetadata() {
  return overrideMetadata('/products', FALLBACK);
}

export default function ProductsPage() {
  return <CmsOrLegacy path="/products"><LegacyProducts /></CmsOrLegacy>;
}
