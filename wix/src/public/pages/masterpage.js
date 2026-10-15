// Site-wide code. Master page file snippet:  import { init } from 'public/pages/masterpage';  $w.onReady(() => init($w));
// Sets Organization JSON-LD on pages that do not set their own structured data.
// Investor pages (investorSection, investorsHub, sebiLodr) set their own and re-include the Organization node,
// because setStructuredData overwrites whatever was set earlier; so this skips /investors/** to avoid a race.
import wixSeoFrontend from 'wix-seo-frontend';
import wixLocationFrontend from 'wix-location-frontend';
import { siteOrigin } from 'public/lib/wixUi';
import { organizationJsonLd } from 'public/lib/seo';

export function init() {
  try {
    if (wixLocationFrontend.path[0] === 'investors') return;
    wixSeoFrontend.setStructuredData([organizationJsonLd(siteOrigin())])
      .catch((e) => console.error('Organization JSON-LD failed', e));
  } catch (e) {
    console.error('masterpage init failed', e);
  }
}
