import { renderOg, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-image';

export const runtime = 'nodejs';
export const alt = 'Kotyark products: B100 biodiesel and crude glycerin';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOg({ eyebrow: 'Products', headline: 'Two products. One closed loop.', sub: 'B100 biodiesel and crude glycerin from non-edible oils' });
}
