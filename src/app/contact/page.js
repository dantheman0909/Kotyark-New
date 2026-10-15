import { CmsOrLegacy } from '@/components/blocks/PageView';
import LegacyContact from '@/components/legacy/Contact';
import { overrideMetadata } from '@/lib/pages';

export const dynamic = 'force-dynamic';

const FALLBACK = {
  title: 'Contact Kotyark Industries - Biodiesel Enquiries',
  description: 'Get in touch with Kotyark Industries for biodiesel supply, investor queries or partnerships. Plants in Rajasthan & Gujarat. Reach out today.',
};

export async function generateMetadata() {
  return overrideMetadata('/contact', FALLBACK);
}

export default function ContactPage() {
  return <CmsOrLegacy path="/contact"><LegacyContact /></CmsOrLegacy>;
}
