import { renderOg, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-image';

export const runtime = 'nodejs';
export const alt = 'Contact Kotyark Industries: bulk biodiesel supply, crude glycerin, investor relations';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOg({ eyebrow: 'Contact', headline: 'Talk to the people who make the fuel.', sub: 'info@kotyark.com' });
}
