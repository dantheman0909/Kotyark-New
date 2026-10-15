// /investors hub. Page file snippet:  import { init } from 'public/pages/investorsHub';  $w.onReady(() => init($w));
import wixData from 'wix-data';
import { resolve$w, siteOrigin, applySeo, showError, hideLoading } from 'public/lib/wixUi';
import { buildHubGroups } from 'public/lib/investor';
import { buildHubSeo } from 'public/lib/seo';

export function init($wArg) {
  const $w = resolve$w($wArg);
  wixData.query('InvestorSections').ascending('hubOrder').limit(100).find()
    .then((res) => {
      const groups = buildHubGroups(res.items);
      $w('#hubGroupsRepeater').onItemReady(($group, g) => {
        $group('#groupTag').text = g.tag;
        $group('#groupTitle').text = g.title;
        $group('#groupDescription').text = g.description;
        $group('#sectionsRepeater').onItemReady(($card, s) => {
          $card('#cardTitle').text = s.title;
          $card('#cardDescription').text = s.description;
          $card('#cardLink').link = s.url; // the card/button
        });
        $group('#sectionsRepeater').data = g.sections;
      });
      $w('#hubGroupsRepeater').data = groups;
      hideLoading($w);
      return applySeo(buildHubSeo(siteOrigin()));
    })
    .catch((e) => { console.error('investorsHub failed', e); showError($w, 'Investor sections could not be loaded. Please refresh the page.'); });
}
