import { renderOg, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-image';

export const runtime = 'nodejs';
export const alt = 'Kotyark Investor Relations: every regulatory filing and disclosure';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOg({ eyebrow: 'Investor Relations · NSE: KOTYARK', headline: 'Every filing, in the open.', sub: 'SEBI LODR disclosures, AGM, board meetings, policies' });
}
