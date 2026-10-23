import { docCard } from '@/lib/og-dynamic';
import { OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-image';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const alt = 'Kotyark Industries investor document';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }) {
  const { section, doc } = await params;
  return docCard(section, doc);
}
