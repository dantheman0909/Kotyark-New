import { renderOg, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-image';

export const runtime = 'nodejs';
export const alt = 'Kotyark Biodiesel (B100): 86% lower greenhouse-gas emissions than petroleum diesel';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOg({ eyebrow: 'Product 01 · Fuel', headline: 'Biodiesel (B100)', sub: '86% lower GHG · B5 to B100 · approved by the Bio-Fuel Authority' });
}
