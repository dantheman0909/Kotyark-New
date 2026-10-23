import { sectionCard } from '@/lib/og-dynamic';
import { OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-image';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const alt = 'Kotyark Industries: disclosure under Regulation 46 of SEBI (LODR)';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return sectionCard('sebi-lodr');
}
