// Thin Wix-dependent helpers shared by the page modules (not unit-tested: they need the Velo runtime).
import wixSeoFrontend from 'wix-seo-frontend';
import wixLocationFrontend from 'wix-location-frontend';
import { FALLBACK_ORIGIN } from 'public/lib/investor';

/** Resolve the `$w` a page module should use: explicit argument first, then the page global. */
export function resolve$w(arg) {
  if (typeof arg === 'function') return arg;
  // eslint-disable-next-line no-undef
  if (typeof $w !== 'undefined') return $w;
  throw new Error('$w unavailable: call init($w) from the page file');
}

export function siteOrigin() {
  try {
    const base = wixLocationFrontend.baseUrl;
    if (base) return base.replace(/\/$/, '');
  } catch (e) { /* fall through */ }
  return FALLBACK_ORIGIN;
}

/** Applies title, meta tags, canonical and JSON-LD. Never throws: SEO must not break rendering. */
export async function applySeo(seo) {
  const run = async (label, fn) => {
    try { await fn(); } catch (e) { console.error(`SEO ${label} failed`, e); }
  };
  await run('title', () => wixSeoFrontend.setTitle(seo.title));
  await run('meta', () => wixSeoFrontend.setMetaTags(seo.metaTags));
  await run('links', () => wixSeoFrontend.setLinks([{ rel: 'canonical', href: seo.canonical }]));
  await run('structuredData', () => wixSeoFrontend.setStructuredData(seo.structuredData));
}

/** Shows #errorState (and optional message in #errorMessage); hides the loading element. */
export function showError($w, message) {
  try {
    $w('#errorState').expand();
    $w('#errorState').show();
    if (message) $w('#errorMessage').text = message;
    $w('#loadingState').collapse();
  } catch (e) { console.error('showError failed', e); }
}

export function hideLoading($w) {
  try { $w('#loadingState').collapse(); } catch (e) { /* element optional */ }
}
