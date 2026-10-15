import { SITE_URL, absoluteUrl } from '@/lib/site';

// Evaluated per request so REPLIT_DEPLOYMENT is read at runtime, not frozen at build.
export const dynamic = 'force-dynamic';

export default function robots() {
  const live = Boolean(process.env.REPLIT_DEPLOYMENT) || process.env.NODE_ENV === 'production';
  if (!live) {
    // Dev and preview hosts must never be indexed.
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/preview/'] }],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL,
  };
}
