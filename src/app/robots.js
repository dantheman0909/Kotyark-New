import { SITE_URL, absoluteUrl } from '@/lib/site';

// Evaluated per request so REPLIT_DEPLOYMENT is read at runtime, not frozen at build.
export const dynamic = 'force-dynamic';

const DISALLOW = ['/admin', '/api/', '/preview/', '/login'];

// Search engines and AI crawlers are named explicitly so the intent is unambiguous (and survives any
// future change to the "*" group). One group per operator; each allows the site and blocks the CMS.
const AGENT_GROUPS = [
  ['Googlebot', 'Google-Extended', 'Bingbot', 'Applebot', 'Applebot-Extended', 'DuckAssistBot', 'YouBot'],
  ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User'],
  ['ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'anthropic-ai'],
  ['PerplexityBot', 'Perplexity-User', 'CCBot', 'meta-externalagent', 'Amazonbot', 'cohere-ai'],
];

export default function robots() {
  const live = Boolean(process.env.REPLIT_DEPLOYMENT) || process.env.NODE_ENV === 'production';
  if (!live) {
    // Dev and preview hosts must never be indexed.
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }
  return {
    rules: [
      ...AGENT_GROUPS.map((userAgent) => ({ userAgent, allow: '/', disallow: DISALLOW })),
      { userAgent: '*', allow: '/', disallow: DISALLOW },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL,
  };
}
