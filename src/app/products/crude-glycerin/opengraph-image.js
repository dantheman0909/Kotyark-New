import { renderOg, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-image';

export const runtime = 'nodejs';
export const alt = 'Kotyark Crude Glycerin for food, pharma, cosmetic and industrial buyers';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOg({ eyebrow: 'Product 02 · Co-product', headline: 'Crude Glycerin', sub: 'Food, pharma, cosmetics and industry' });
}
