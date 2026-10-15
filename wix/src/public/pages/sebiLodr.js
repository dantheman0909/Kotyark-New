// Reg. 46 disclosure table. Used (a) embedded in the dynamic section page when layout = "disclosures",
// or (b) standalone on a static /investors/sebi-lodr page:  import { init } from 'public/pages/sebiLodr';  $w.onReady(() => init($w));
import wixData from 'wix-data';
import { resolve$w, siteOrigin, applySeo, showError, hideLoading } from 'public/lib/wixUi';
import { buildReg46Rows } from 'public/lib/investor';
import { buildSectionSeo } from 'public/lib/seo';

/** Fills #reg46Repeater from Reg46Disclosures. Rejects on query failure (caller shows the error). */
export async function renderReg46($w) {
  const res = await wixData.query('Reg46Disclosures').ascending('sortOrder').limit(1000).find();
  const rows = buildReg46Rows(res.items);
  $w('#reg46Repeater').onItemReady(($item, r) => {
    $item('#reg46SrNo').text = r.srNo;
    $item('#reg46Particular').text = r.particular;
    $item('#reg46Regulation').text = r.regulation;
    if (r.hasLink) {
      $item('#reg46Link').link = r.linkUrl;
      $item('#reg46Link').expand();
      $item('#reg46Na').collapse();
    } else {
      $item('#reg46Link').collapse(); // blank = NA, shown as a dash
      $item('#reg46Na').expand();
    }
  });
  $w('#reg46Repeater').data = rows;
}

export function init($wArg) {
  const $w = resolve$w($wArg);
  renderReg46($w)
    .then(async () => {
      hideLoading($w);
      const origin = siteOrigin();
      await applySeo(buildSectionSeo(origin, {
        slug: 'sebi-lodr', title: 'Disclosure under Reg. 46 of SEBI (LODR)', heading: 'Disclosure Under Reg. 46 of SEBI (LODR)',
        seoTitle: 'Disclosure Under Reg. 46 of SEBI (LODR)',
        seoDescription: 'Particulars as per SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015 — Regulation 46(2) website disclosures for Kotyark Industries Limited.',
      }, []));
    })
    .catch((e) => { console.error('sebiLodr failed', e); showError($w, 'The disclosure table could not be loaded. Please refresh the page.'); });
}
