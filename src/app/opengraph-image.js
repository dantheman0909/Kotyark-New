import { renderOg, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-image';

export const runtime = 'nodejs';
export const alt = "Kotyark Industries: India's next barrel is grown, not drilled. B100 biodiesel from non-edible oils.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOg({ eyebrow: 'Kotyark Industries Limited · NSE: KOTYARK', headline: "India's next barrel is grown, not drilled.", sub: 'B100 biodiesel · 480,000 KL a year · two zero-discharge plants' });
}
