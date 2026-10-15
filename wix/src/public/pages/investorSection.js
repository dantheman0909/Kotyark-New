// Dynamic item page: /investors/{slug}  (Dataset "dynamicDataset" -> InvestorSections)
// Page file snippet:  import { init } from 'public/pages/investorSection';  $w.onReady(() => init($w));
import wixData from 'wix-data';
import wixLocationFrontend from 'wix-location-frontend';
import { resolve$w, siteOrigin, applySeo, showError, hideLoading } from 'public/lib/wixUi';
import { resolveDocLink, groupDocuments, buildSidebar, formatDocDate } from 'public/lib/investor';
import { buildSectionSeo } from 'public/lib/seo';
import { renderReg46 } from 'public/pages/sebiLodr';

const SECTION_COLLECTION = 'InvestorSections';
const DOC_COLLECTION = 'InvestorDocuments';

export function init($wArg) {
  const $w = resolve$w($wArg);
  const dataset = $w('#dynamicDataset');
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    load($w, dataset).catch((e) => { console.error('investorSection failed', e); showError($w, 'This section could not be loaded. Please refresh the page.'); });
  };
  dataset.onReady(start);
  dataset.onError(() => { started = false; start(); }); // load() falls back to a slug query
  // If the dataset element is missing/misnamed, still render via the slug fallback.
  setTimeout(start, 3000);
}

async function resolveSection(dataset) {
  try {
    const item = dataset.getCurrentItem();
    if (item && item._id) return item;
  } catch (e) { /* fall back */ }
  const slug = wixLocationFrontend.path[wixLocationFrontend.path.length - 1];
  if (!slug) return null;
  const res = await wixData.query(SECTION_COLLECTION).eq('slug', slug).limit(1).find();
  return res.items[0] || null;
}

async function load($w, dataset) {
  const section = await resolveSection(dataset);
  if (!section) { showError($w, 'Section not found.'); return; }
  const origin = siteOrigin();
  const heading = section.pageHeading || section.title;

  // Static header content (heading, breadcrumb, intro). Each piece is optional in the design.
  $w('#sectionTitle').text = heading;
  $w('#breadcrumbCurrent').text = heading;
  if (section.introHtml) $w('#sectionIntro').html = section.introHtml;

  const isDisclosures = section.layout === 'disclosures';
  const tasks = [renderSidebar($w, section.slug)];
  let docs = [];
  if (isDisclosures) {
    $w('#docsBox').collapse();
    $w('#reg46Box').expand();
    tasks.push(renderReg46($w));
  } else {
    $w('#reg46Box').collapse();
    $w('#docsBox').expand();
    tasks.push(renderDocuments($w, section, origin).then((d) => { docs = d; }));
  }
  await Promise.all(tasks.map((t) => t.catch((e) => { console.error(e); showError($w, 'Part of this page could not be loaded.'); })));
  hideLoading($w);

  await applySeo(buildSectionSeo(origin, { ...section, heading }, docs.map((d) => ({ title: d.title, url: d.state === 'updating' ? '' : d.url, date: d.rawDate }))));
}

async function renderSidebar($w, currentSlug) {
  const res = await wixData.query(SECTION_COLLECTION).eq('visibleInMenu', true).ascending('sortOrder').limit(100).find();
  const items = buildSidebar(res.items, currentSlug);
  $w('#sidebarRepeater').onItemReady(($item, s) => {
    $item('#sidebarLink').label = s.title;
    $item('#sidebarLink').link = s.url;
    if (s.isCurrent) $item('#sidebarLink').customClassList.add('active');
  });
  $w('#sidebarRepeater').data = items;
}

/** Returns the flat list of view-models (used for JSON-LD). */
async function renderDocuments($w, section, origin) {
  const res = await wixData.query(DOC_COLLECTION)
    .eq('section', section._id)
    .eq('published', true)
    .ascending('sortOrder')
    .limit(1000)
    .find();

  const models = res.items.map((d) => {
    const link = resolveDocLink(d, origin);
    return { _id: d._id, title: d.title, fy: d.fy, sortOrder: d.sortOrder, description: d.description || '',
      date: formatDocDate(d.documentDate), rawDate: d.documentDate, state: link.state, url: link.url, rawUrl: link.rawUrl };
  });

  if (models.length === 0) {
    $w('#emptyState').expand();
    $w('#docGroupsRepeater').collapse();
    return models;
  }
  $w('#emptyState').collapse();
  $w('#docGroupsRepeater').expand();

  const groups = groupDocuments(models, section.groupBy);
  $w('#docGroupsRepeater').onItemReady(($group, group) => {
    if (group.title) { $group('#fyHeader').text = group.title; $group('#fyHeader').expand(); } else { $group('#fyHeader').collapse(); }
    $group('#docsRepeater').onItemReady(($doc, doc) => {
      $doc('#docTitle').text = doc.title;
      if (doc.date) { $doc('#docDate').text = doc.date; $doc('#docDate').expand(); } else { $doc('#docDate').collapse(); }
      if (doc.state === 'updating') {
        $doc('#docLink').collapse();     // no link, ever, for a missing file
        $doc('#docUpdating').expand();   // "File being updated"
      } else {
        $doc('#docUpdating').collapse();
        $doc('#docLink').expand();
        $doc('#docLink').link = doc.rawUrl; // wix:document:// or https
        $doc('#docLink').target = '_blank';
      }
    });
    $group('#docsRepeater').data = group.docs;
  });
  $w('#docGroupsRepeater').data = groups;
  return models;
}
