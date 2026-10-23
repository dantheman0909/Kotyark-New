import { renderOg, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-image';

export const runtime = 'nodejs';
export const alt = 'About Kotyark Industries: built in India, measured in kilolitres';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOg({ eyebrow: 'About Kotyark', headline: 'Built in India. Measured in kilolitres.', sub: 'Sirohi, Rajasthan and Anand, Gujarat' });
}
