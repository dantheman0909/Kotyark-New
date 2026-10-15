// ONE-TIME builder for scripts/legacy/content-snapshot.json.
//
// Reads the legacy, hard-coded site as it was at the time of the CMS migration
// (investor sub-pages, legacy seed, Navbar/Footer/layout metadata) and writes a
// structured JSON snapshot. The committed snapshot is the source of truth for
// scripts/migrate-to-cms.mjs; this builder cannot be rerun once the legacy page
// files are deleted from the repo (it fails loudly if they are missing).
//
//   node scripts/lib/build-content-snapshot.mjs            # build + validate + coverage check
//   node scripts/lib/build-content-snapshot.mjs --check    # validate the committed snapshot only
//
// Copy is transcribed verbatim from the JSX (entities decoded, JSX line wrapping
// collapsed to single spaces). The coverage check re-reads the JSX and fails if any
// visible text fragment is absent from the snapshot.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT, validateBlock } from './contract.mjs';
import { SEED_FOLDERS, SEED_DOCUMENTS } from '../legacy/legacy-seed.mjs';

const OUT = path.join(ROOT, 'scripts', 'legacy', 'content-snapshot.json');
const INV = path.join(ROOT, 'src', 'app', 'investors');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// ---------------------------------------------------------------- helpers
const ENT = { '&apos;': "'", '&amp;': '&', '&mdash;': '—', '&middot;': '·', '&quot;': '"', '&lt;': '<', '&gt;': '>', '&nbsp;': ' ' };
const decode = (s) => s.replace(/&(apos|amp|mdash|middot|quot|lt|gt|nbsp);/g, (m) => ENT[m]);
const collapse = (s) => s.replace(/\s+/g, ' ').trim();
const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Deterministic uuid-shaped id so re-running the builder never changes block ids. */
function blockId(pagePath, index, type) {
  const h = crypto.createHash('sha1').update(`${pagePath}#${index}#${type}`).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
const B = (type, props) => ({ type, props });

// ---------------------------------------------------------------- folders + documents
function extractMetadata(src) {
  const m = src.match(/export const metadata = \{\s*title:\s*(['"])([\s\S]*?)\1,\s*description:\s*(['"])([\s\S]*?)\3,?\s*\};/);
  if (!m) throw new Error('metadata block not found');
  return { title: decode(m[2].replace(/\\'/g, "'")), description: decode(m[4].replace(/\\'/g, "'")) };
}

function extractIntro(src) {
  const m = src.match(/<p style=\{\{ marginBottom: '24px', color: 'var\(--color-text-secondary\)' \}\}>\s*([\s\S]*?)\s*<\/p>/);
  return m ? collapse(decode(m[1])) : null;
}

function extractDocuments(src) {
  const m = src.match(/const documents = (\[[\s\S]*?\n {2}\]);/);
  if (!m) return [];
  // eslint-disable-next-line no-new-func
  return new Function(`return ${m[1]}`)().map((d) => ({ title: d.title, url: d.url }));
}

/** 'FY 2023-2024' -> 'FY 2023-24'; only when the title states a financial year explicitly. */
function parseFy(title) {
  const m = title.match(/\bFY\s*(\d{4})\s*-\s*(\d{2}|\d{4})\b/);
  if (!m) return null;
  const a = Number(m[1]);
  const b = m[2].length === 4 ? Number(m[2]) : Number(`${String(a).slice(0, 2)}${m[2]}`);
  if (b !== a + 1) return null; // not a real FY span: leave unset
  return `FY ${a}-${String(b).slice(2)}`;
}

/** dd.mm.yyyy (Indian convention, evidenced by 27.01.2025 / 14.11.2024 in the same sets) -> ISO date, only if a real date. */
function parseDocDate(title) {
  const m = title.match(/\b(\d{2})\.(\d{2})\.(\d{4})\b/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
  if (d.getUTCFullYear() !== Number(yyyy) || d.getUTCMonth() !== Number(mm) - 1 || d.getUTCDate() !== Number(dd)) return null;
  return `${yyyy}-${mm}-${dd}`;
}

function buildFoldersAndDocs() {
  // Sidebar (the investor nav) is the authority for the 15 sections' order and labels.
  const layoutSrc = read('src/components/InvestorSubPageLayout.js');
  const sidebar = [...layoutSrc.matchAll(/\{ href: '\/investors\/([a-z0-9-]+)', label: '([^']+)' \}/g)].map((m) => ({ slug: m[1], label: m[2] }));
  if (sidebar.length !== 15) throw new Error(`expected 15 sidebar sections, found ${sidebar.length}`);

  const sections = SEED_FOLDERS.filter((f) => f.id !== 'inv-root');
  const notes = [];
  const bySlug = new Map(sections.map((f) => [f.slug, f]));
  sidebar.forEach((s, i) => {
    const f = bySlug.get(s.slug);
    if (!f) throw new Error(`sidebar slug ${s.slug} has no legacy folder`);
    if (f.name !== s.label) notes.push(`name differs for ${s.slug}: seed "${f.name}" vs sidebar "${s.label}" (seed kept)`);
    if (f.sort_order !== i + 1) notes.push(`order differs for ${s.slug}: seed ${f.sort_order} vs sidebar ${i + 1} (seed kept)`);
  });

  // Hub card descriptions (one per section) become document_folders.description.
  const hubSrc = fs.readFileSync(path.join(INV, 'page.js'), 'utf8');
  const hubDesc = {};
  for (const m of hubSrc.matchAll(/\{ title: '[^']*(?:\\'[^']*)*', desc: (['"])([\s\S]*?)\1, href: '\/investors\/([a-z0-9-]+)' \}/g)) hubDesc[m[3]] = decode(m[2]);
  for (const f of sections) if (!hubDesc[f.slug]) throw new Error(`no hub description for ${f.slug}`);
  const FY_GRID = new Set(['inv-board', 'inv-audited', 'inv-eogm', 'inv-filling']);

  const folders = [];
  const folderIntros = {};
  const folderIntroExtraHtml = {};
  const folderPlaceholders = {};
  const documents = [];
  const conflicts = [];

  for (const f of sections) {
    const pagePath = path.join(INV, f.slug, 'page.js');
    if (!fs.existsSync(pagePath)) throw new Error(`legacy page missing: ${pagePath}`);
    const src = fs.readFileSync(pagePath, 'utf8');
    const meta = extractMetadata(src);
    const intro = extractIntro(src);
    if (!intro) throw new Error(`no intro paragraph in ${f.slug}`);
    const h1 = (src.match(/<InvestorSubPageLayout title="([^"]+)">/) || [])[1];
    folders.push({
      id: f.id,
      parent_id: null,
      slug: f.slug,
      name: f.name,
      description: hubDesc[f.slug],
      group_by: FY_GRID.has(f.id) ? 'fy' : 'none',
      visible: true,
      sort_order: f.sort_order,
      seo: { metaTitle: meta.title, metaDescription: meta.description },
      pageHeading: h1 || f.name,
    });
    folderIntros[f.slug] = intro;

    // Smart ODR carries a how-to box beside the paragraph; keep it as extra intro HTML.
    if (f.slug === 'smart-odr') {
      const h3 = (src.match(/<h3[^>]*>([^<]+)<\/h3>/) || [])[1];
      const lis = [...src.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
      folderIntroExtraHtml[f.slug] = `<h3>${escHtml(h3)}</h3><ol>${lis.map((li) => {
        const withLink = li.replace(/<a href="([^"]+)" target="_blank" rel="noopener noreferrer">([^<]+)<\/a>/, '<a href="$1">$2</a>');
        return `<li>${decode(withLink)}</li>`;
      }).join('')}</ol>`;
    }

    // Card grids on pages that have no documents (placeholders only).
    if (f.slug === 'board-meetings') {
      folderPlaceholders[f.slug] = [...src.matchAll(/\{ fy: '([^']+)', slug: '([^']+)' \}/g)].map((m) => ({ title: m[1], body: `Board meeting documents for ${m[1]}` }));
    } else if (f.slug === 'audited-financial-statements') {
      folderPlaceholders[f.slug] = [...src.matchAll(/\{ name: '([^']+)', slug: '([^']+)' \}/g)].map((m) => ({ title: m[1], body: 'View audited financial statements' }));
    } else if (f.slug === 'extra-ordinary-general-meetings') {
      folderPlaceholders[f.slug] = [...src.matchAll(/\{ title: '([^']+)', date: '([^']+)', desc: '([^']+)' \}/g)].map((m) => ({ title: m[1], body: m[3] }));
    } else if (f.slug === 'integrated-filling') {
      folderPlaceholders[f.slug] = [...src.matchAll(/\{ title: '([^']+)', desc: '([^']+)' \}/g)].map((m) => ({ title: m[1], body: m[2] }));
    }

    // Documents: page array first (what the live site shows, in its order), then seed-only rows.
    const pageDocs = extractDocuments(src).map((d) => ({ ...d, source: ['page'] }));
    const seedDocs = SEED_DOCUMENTS.filter((d) => d.folder_id === f.id).map((d) => ({ title: d.title, url: d.url, source: ['seed'] }));
    const merged = new Map();
    for (const d of [...pageDocs, ...seedDocs]) {
      const prev = merged.get(d.url);
      if (!prev) { merged.set(d.url, { ...d, alt_titles: [] }); continue; }
      for (const s of d.source) if (!prev.source.includes(s)) prev.source.push(s);
      if (d.title !== prev.title && !prev.alt_titles.includes(d.title)) {
        prev.alt_titles.push(d.title);
        conflicts.push({ folder: f.slug, url: d.url, kept: prev.title, dropped: d.title, keptFrom: prev.source[0], droppedFrom: d.source[0] });
      }
    }
    let order = 0;
    for (const d of merged.values()) {
      order += 1;
      documents.push({
        folder_id: f.id,
        folder_slug: f.slug,
        title: d.title,
        external_url: d.url,
        fy: parseFy(d.title),
        doc_date: parseDocDate(d.title),
        sort_order: order,
        sources: d.source,
        alt_titles: d.alt_titles,
      });
    }
  }

  // Titles that appear twice in one folder (different URLs) are legitimate; same URL is merged above.
  return { folders, folderIntros, folderIntroExtraHtml, folderPlaceholders, documents, conflicts, notes };
}

// ---------------------------------------------------------------- pages
const SEC = (title) => ({ title });

function buildPages(investorsHub, sebi) {
  const pages = [];
  const add = (p) => pages.push(p);

  // ----- Home
  add({
    path: '/', slug: '', parentPath: null, title: 'Home', show_in_nav: true, nav_order: 1, template: 'default',
    seo: {
      metaTitle: 'Kotyark Industries - Leading Biodiesel Manufacturer India',
      metaDescription: "India's approved biodiesel manufacturer. 480,000 KL capacity. Carbon neutral fuel for transport & industry. BSE listed. Get a quote today.",
    },
    blocks: [
      B('hero', {
        variant: 'full',
        eyebrow: 'BSE Listed · Government Approved Biofuel Manufacturer',
        heading: "Powering India's Future With Clean Biodiesel",
        subheading: "India's leading biodiesel manufacturer with 480,000 KL annual capacity. We convert non-edible vegetable oils into premium B100 biodiesel — delivering 86% less greenhouse emissions and a carbon-neutral fuel alternative.",
        image: '/images/hero-forest.jpg',
        imageAlt: 'Aerial view of lush green forest canopy representing renewable energy',
        ctas: [
          { label: 'Contact Our Team →', href: '/contact', style: 'primary' },
          { label: 'Explore Products', href: '/products', style: 'outline' },
        ],
      }),
      // CarbonCreditBadge (floating, pulsing badge over the hero): no block equivalent.
      B('rich_text', {
        width: 'narrow',
        html: '<p><strong>First Indian Company</strong> to receive <strong>Verra Carbon Credits</strong></p>',
      }),
      // Trust bar (aria-label "Trust indicators").
      B('card_grid', {
        columns: '4',
        items: [
          { title: 'Government Approved', body: 'Bio-Fuel Authority, Govt. of Rajasthan' },
          { title: 'BSE Listed', body: 'Publicly traded, SEBI compliant' },
          { title: '480,000 KL Capacity', body: 'Annual biodiesel production' },
          { title: 'Zero Discharge', body: 'Environmentally responsible plants' },
        ],
      }),
      B('image_text', {
        eyebrow: 'What is Biodiesel?',
        heading: 'A Cleaner Fuel For a Greener Tomorrow',
        html: '<p>Biodiesel is a renewable, clean-burning diesel alternative produced through the trans-esterification of non-edible vegetable oils. As a <strong>mono alkyl ester</strong>, it is chemically similar to conventional High-Speed Diesel (HSD) but produces <strong>86% fewer greenhouse gas emissions</strong>.</p>'
          + '<p>At Kotyark Industries, we manufacture premium <strong>B100 biodiesel</strong> that can be blended at any ratio — from B5 (5%) to B100 (neat) — delivering superior lubricity, higher cetane numbers, more power, and better mileage than conventional diesel.</p>'
          + '<p>Our biodiesel is approved by the <strong>Bio-Fuel Authority under the Rural Development Department and Panchayati Raj, Government of Rajasthan</strong>, ensuring the highest standards of quality and environmental compliance.</p>',
        image: '/images/biodiesel-cycle.png',
        imageAlt: 'Biodiesel production cycle infographic showing feedstocks, biofuel production, renewable fuel usage, and carbon dioxide absorption by biomass',
        imagePosition: 'right',
        cta: [{ label: 'Learn About Biodiesel →', href: '/products/biodiesel' }],
      }),
      B('rich_text', {
        eyebrow: 'Impact at Scale',
        heading: "India's Biofuel Capacity Leader",
        html: '<p>Operating advanced biodiesel manufacturing facilities across Rajasthan and Gujarat with zero-discharge environmental compliance.</p>',
        width: 'normal',
      }),
      B('stats', {
        items: [
          { value: '480K', label: 'KL Annual Capacity' },
          { value: '210', label: 'KL/Day Production' },
          { value: '86%', label: 'Less GHG Emissions' },
          { value: 'Zero', label: 'Discharge Facilities' },
        ],
      }),
      B('card_grid', {
        eyebrow: 'Our Products',
        heading: 'Renewable Energy Products',
        intro: 'High-quality biofuels and by-products manufactured at our state-of-the-art facilities in Sirohi, Rajasthan and Anand, Gujarat.',
        columns: '2',
        items: [
          {
            title: 'Biodiesel (B100)',
            body: 'Premium quality biodiesel manufactured from non-edible vegetable oils through trans-esterification. A clean, renewable diesel alternative with superior lubricity and higher cetane number.',
            image: '/images/biodiesel-product.png', imageAlt: 'Premium B100 Biodiesel fuel', linkLabel: 'Explore Biodiesel', href: '/products/biodiesel',
          },
          {
            title: 'Crude Glycerin',
            body: 'High-quality crude glycerin produced as a valuable by-product of biodiesel manufacturing. Widely used in food processing, pharmaceuticals, cosmetics, and industrial applications.',
            image: '/images/glycerin-product.png', imageAlt: 'Crude Glycerin by-product', linkLabel: 'Explore Glycerin', href: '/products/crude-glycerin',
          },
        ],
      }),
      B('card_grid', {
        eyebrow: 'Why Biodiesel?',
        heading: 'The Advantages of Biofuel Energy',
        intro: 'Biodiesel delivers measurable benefits across environmental, economic, and operational dimensions.',
        columns: '3',
        items: [
          { title: 'Carbon Neutral', body: 'Biodiesel is produced from biomass that absorbs CO₂ during growth, creating a closed carbon cycle that achieves near-zero net emissions.' },
          { title: 'More Power', body: 'Higher cetane number delivers improved combustion efficiency, more torque, and better mileage compared to conventional HSD diesel fuel.' },
          { title: 'Engine Safe', body: 'Superior lubricity protects engine components and reduces wear. Compatible with all diesel engines without modification at B5-B20 blends.' },
          { title: 'Reduces Imports', body: "Domestically produced biodiesel reduces India's dependency on imported crude oil, strengthening energy security and saving foreign exchange." },
          { title: 'Non-Toxic', body: 'Biodegradable and non-toxic. Breaks down naturally in the environment, unlike petroleum diesel, making spills safer to manage.' },
          { title: 'Job Creation', body: 'Biodiesel manufacturing supports rural economies by creating employment in feedstock cultivation, processing, and distribution across India.' },
        ],
      }),
      B('image_text', {
        eyebrow: 'Environmental Impact',
        heading: 'Building a Carbon-Neutral Future',
        html: "<p>Every litre of biodiesel from Kotyark replaces petroleum diesel, reducing greenhouse gas emissions by up to <strong>86%</strong>. With annual capacity of <strong>480,000 kiloliters</strong>, we're making a measurable impact on India's carbon footprint.</p>"
          + '<p>Our zero-discharge manufacturing facilities ensure that the production process itself is environmentally responsible — from feedstock sourcing to final product delivery.</p>'
          + '<p><strong>86%</strong> Less GHG emissions</p>'
          + '<p><strong>100%</strong> Biodegradable fuel</p>',
        image: '/images/save-planet.jpg',
        imageAlt: 'Hands holding a globe made of recycled materials, representing environmental sustainability through biodiesel',
        imagePosition: 'left',
      }),
      B('cta_banner', {
        heading: "Partner With India's Biofuel Leader",
        body: 'Whether you need bulk biodiesel supply, crude glycerin, or want to discuss investment opportunities — our team is ready to help.',
        label: 'Contact Our Team →',
        href: '/contact',
        secondaryLabel: 'Investor Relations',
        secondaryHref: '/investors',
      }),
    ],
  });

  // ----- About
  add({
    path: '/about', slug: 'about', parentPath: null, title: 'About Us', show_in_nav: true, nav_order: 2, template: 'default',
    seo: {
      metaTitle: "About Kotyark Industries - India's Biofuel Pioneer",
      metaDescription: 'Learn about Kotyark Industries Limited, a BSE-listed biodiesel manufacturer with 480,000 KL capacity. Zero discharge facilities in Rajasthan & Gujarat.',
    },
    blocks: [
      B('hero', {
        variant: 'page',
        heading: 'About Kotyark Industries',
        subheading: "Pioneering India's clean energy revolution through biodiesel manufacturing since our foundation.",
      }),
      B('rich_text', {
        eyebrow: 'Our Story',
        heading: "Building India's Biofuel Future",
        html: '<p>Kotyark Industries Limited is a <strong>publicly listed biodiesel manufacturing company</strong> on the Bombay Stock Exchange (BSE). We operate state-of-the-art, zero-discharge biodiesel production facilities in <strong>Sirohi, Rajasthan</strong> and <strong>Anand, Gujarat</strong>.</p>'
          + "<p>With an annual installed capacity of <strong>480,000 kiloliters</strong> and daily production of <strong>210 KL</strong>, Kotyark is one of India's leading biodiesel manufacturers. We convert non-edible vegetable oils into premium B100 biodiesel through advanced trans-esterification processes.</p>"
          + '<p>Our operations are approved by the <strong>Bio-Fuel Authority under the Rural Development Department and Panchayati Raj, Government of Rajasthan</strong>, reflecting our commitment to quality, safety, and environmental responsibility.</p>',
        width: 'normal',
      }),
      B('stats', {
        items: [
          { value: '480K', label: 'KL Annual Capacity' },
          { value: '210', label: 'KL Daily Output' },
          { value: '2', label: 'Manufacturing Plants' },
          { value: 'Zero', label: 'Discharge Facilities' },
        ],
      }),
      B('card_grid', {
        columns: '2',
        items: [
          { title: 'Our Vision', body: "To be India's most trusted producer of sustainable biofuels, leading the nation's transition to carbon-neutral energy and reducing dependency on imported fossil fuels." },
          { title: 'Our Mission', body: 'To manufacture premium-quality biodiesel that exceeds industry standards while maintaining zero-discharge operations, supporting rural employment, and delivering value to our shareholders and communities.' },
        ],
      }),
      B('card_grid', {
        eyebrow: 'Leadership',
        heading: 'Board of Directors',
        intro: "Experienced professionals driving Kotyark's growth and innovation in India's biofuel sector.",
        columns: '3',
        items: [
          { icon: 'GS', title: 'Mr. Gaurang Shah', role: 'Chairman cum Managing Director', body: 'Chairman cum Managing Director\nCommerce Graduate from Maharaja Sayajirao University of Baroda with over 27 years of experience in vegetable oil trading and biofuels. As Promoter and CMD, he leads overall management, strategy formulation, and ensures operations consistently exceed industry standards.' },
          { icon: 'DS', title: 'Mrs. Dhruti Shah', role: 'Whole Time Director & CFO', body: 'Whole Time Director & CFO\nHolds M.Com and MBA degrees with approximately 11 years of industry experience. Appointed CFO and KMP in September 2024, she oversees all financial and operational activities from conceptualization to execution, bringing extensive knowledge of the biofuel industry.' },
          { icon: 'BS', title: 'Mrs. Bhaviniben Shah', role: 'Non-Executive Director', body: "Non-Executive Director\nDiploma in Mechanical Engineering with approximately 10 years of experience in the biofuels sector. Has made important contributions to the company's operations and growth." },
          { icon: 'AS', title: 'Mr. Akshay Jayrajbhai Shah', role: 'Non-Executive Independent Director', body: 'Non-Executive Independent Director\nBachelor of Science with 15 years of professional experience. Provides independent oversight and governance, contributing to strategic decision-making and corporate compliance.' },
          { icon: 'HP', title: 'Mr. Harsh Mukeshbhai Parikh', role: 'Non-Executive Independent Director', body: "Non-Executive Independent Director\nMBA with 21 years of experience across various sectors. Has played an instrumental role in the company's growth since joining, providing strategic and governance guidance." },
          { icon: 'VM', title: 'Mr. Viral Mamtora', role: 'Additional Independent Director', body: 'Additional Independent Director\nB.Com from Saurashtra University and Associate Member of ICAI with over 15 years of experience in Finance and Accounts. Currently Proprietor of M/s. Viral M. Mamtora & Associates.' },
        ],
      }),
      B('card_grid', {
        eyebrow: 'Our Facilities',
        heading: 'Manufacturing Plants',
        columns: '2',
        items: [
          { icon: 'Rajasthan Plant', title: 'Sirohi, Rajasthan', body: 'Primary manufacturing facility located at F-20, RICCO Industrial Area, Swaroopganj, Sirohi District, Rajasthan 307026. Equipped with advanced trans-esterification technology and zero-discharge systems.' },
          { icon: 'Gujarat Plant', title: 'Anand, Gujarat', body: "Second manufacturing facility in Anand, Gujarat, expanding Kotyark's production capacity and geographical reach to serve clients across western India efficiently." },
        ],
      }),
      B('cta_banner', {
        heading: 'Ready to Partner With Us?',
        body: "Join India's biofuel revolution. Contact us for biodiesel supply, partnership opportunities, or investor inquiries.",
        label: 'Contact Us →',
        href: '/contact',
      }),
    ],
  });

  // ----- Products
  add({
    path: '/products', slug: 'products', parentPath: null, title: 'Our Products', show_in_nav: true, nav_order: 3, template: 'default',
    seo: {
      metaTitle: 'Biodiesel & Glycerin Products',
      metaDescription: "Explore Kotyark's range of biofuel products: B100 Biodiesel, Crude Glycerin, and more. Government approved. Available across India.",
    },
    blocks: [
      B('hero', {
        variant: 'page',
        heading: 'Our Products',
        subheading: 'High-quality biofuels and by-products manufactured at our zero-discharge facilities in Rajasthan and Gujarat.',
      }),
      B('card_grid', {
        eyebrow: 'Available Now',
        heading: 'Current Product Range',
        columns: '2',
        items: [
          {
            title: 'Biodiesel (B100)',
            body: 'Premium quality biodiesel manufactured from non-edible vegetable oils through advanced trans-esterification processes. A clean-burning, renewable diesel alternative that delivers 86% fewer greenhouse gas emissions, superior lubricity, and higher cetane number than conventional HSD.',
            image: '/images/biodiesel-product.png', imageAlt: 'Premium B100 Biodiesel fuel',
            tags: ['Carbon Neutral', 'Non-Toxic', 'Engine Safe', 'High Cetane'], linkLabel: 'View Details', href: '/products/biodiesel',
          },
          {
            title: 'Crude Glycerin',
            body: 'High-quality crude glycerin produced as a valuable by-product of biodiesel manufacturing. Also known as glycerol, it finds extensive applications in food processing, pharmaceuticals, cosmetics, and industrial sectors worldwide.',
            image: '/images/glycerin-product.png', imageAlt: 'Crude Glycerin by-product',
            tags: ['Food Grade', 'Pharma Grade', 'Industrial', 'Cosmetics'], linkLabel: 'View Details', href: '/products/crude-glycerin',
          },
        ],
      }),
      B('card_grid', {
        eyebrow: 'Expanding',
        heading: 'Upcoming Products',
        intro: 'Kotyark is expanding its product portfolio to serve broader renewable energy needs.',
        columns: '3',
        items: [
          { title: 'CBFS', body: 'Carbon Black Feed Stock — a high-demand industrial raw material for the rubber and tyre manufacturing industry.' },
          { title: 'Light Petroleum Oil (LPO)', body: 'Light petroleum oil derivatives for specialized industrial and energy applications.' },
          { title: 'Dewatering Fluid', body: 'Specialized dewatering fluids for industrial processes and environmental management applications.' },
        ],
      }),
      B('cta_banner', {
        heading: 'Need Bulk Biodiesel Supply?',
        body: 'Contact us for pricing, availability, and customized supply agreements for your business needs.',
        label: 'Request a Quote →',
        href: '/contact',
      }),
    ],
  });

  // ----- Biodiesel
  const benefits = [
    '86% less greenhouse gas emissions compared to petroleum diesel',
    'Higher cetane number for improved combustion and engine performance',
    'Superior lubricity that protects fuel system components and reduces wear',
    'More power and better mileage than conventional HSD diesel',
    'Carbon neutral — CO₂ absorbed during biomass growth offsets emissions',
    'Non-toxic and biodegradable — environmentally safe in case of spills',
    "Reduces India's dependency on imported crude oil",
    'Creates rural employment through feedstock cultivation and processing',
  ];
  const specs = [
    ['Chemical Type', 'Mono Alkyl Ester (FAME)'],
    ['Feedstock', 'Non-edible vegetable oils'],
    ['Process', 'Trans-esterification'],
    ['GHG Reduction', '86% vs. petroleum diesel'],
    ['Blending Range', 'B5 (5%) to B100 (neat)'],
    ['Engine Compatibility', 'All diesel engines (B5–B20 without modification)'],
    ['Cetane Number', 'Higher than conventional HSD'],
    ['Biodegradability', '100% biodegradable, non-toxic'],
    ['Lubricity', 'Superior to petroleum diesel'],
    ['Approval', 'Bio-Fuel Authority, Govt. of Rajasthan'],
  ];
  add({
    path: '/products/biodiesel', slug: 'biodiesel', parentPath: '/products', title: 'Biodiesel (B100)', show_in_nav: false, nav_order: 1, template: 'default',
    seo: {
      metaTitle: 'Biodiesel B100 - Renewable Diesel Fuel',
      metaDescription: 'Clean-burning B100 biodiesel from non-edible vegetable oil. 86% less greenhouse gas. More power, better mileage. Order biodiesel now.',
    },
    blocks: [
      B('hero', {
        variant: 'page',
        heading: 'Biodiesel (B100)',
        subheading: 'Premium renewable diesel fuel — cleaner burning, carbon neutral, and superior performance.',
      }),
      B('image_text', {
        eyebrow: 'Product Overview',
        heading: 'What is B100 Biodiesel?',
        html: '<p>Biodiesel is a <strong>renewable, clean-burning diesel replacement</strong> produced through the trans-esterification of non-edible vegetable oils. Chemically classified as a mono alkyl ester, biodiesel is functionally equivalent to petroleum-based High-Speed Diesel (HSD) but with dramatically lower environmental impact.</p>'
          + '<p>At Kotyark Industries, we manufacture <strong>B100 (neat/pure) biodiesel</strong> at our Government-approved, zero-discharge facilities. B100 can be used directly or blended with petroleum diesel at varying ratios — from <strong>B5 (5% biodiesel)</strong> to <strong>B20 (20% biodiesel)</strong> — without requiring engine modifications.</p>'
          + '<p>Our biodiesel meets all quality standards set by the Bureau of Indian Standards (BIS) and is approved by the <strong>Bio-Fuel Authority under the Government of Rajasthan</strong>.</p>',
        image: '/images/biodiesel-cycle.png',
        imageAlt: 'Biodiesel production cycle showing feedstocks, biofuel production, renewable fuel, and CO2 absorption',
        imagePosition: 'right',
      }),
      B('rich_text', {
        eyebrow: 'Advantages',
        heading: 'Benefits of Biodiesel',
        html: `<p>Biodiesel delivers measurable advantages across environmental, economic, and operational dimensions.</p><ul>${benefits.map((b) => `<li>${escHtml(b)}</li>`).join('')}</ul>`,
        width: 'normal',
      }),
      B('card_grid', {
        eyebrow: 'Use Cases',
        heading: 'Biodiesel Applications',
        intro: "B100 biodiesel and its blends serve diverse sectors across India's economy.",
        columns: '3',
        items: [
          { title: 'Transport & Logistics', body: 'Commercial fleets, trucks, and heavy vehicles. B5–B20 blends require no engine modifications and provide cleaner emissions.' },
          { title: 'Industrial Power', body: 'Backup power generators, boilers, and industrial heating systems. Biodiesel provides reliable, cleaner-burning energy.' },
          { title: 'Agriculture', body: "Farm equipment, tractors, and irrigation pump sets. Biodiesel supports rural India's energy needs sustainably." },
        ],
      }),
      B('rich_text', {
        eyebrow: 'Specifications',
        heading: 'Technical Data',
        html: `<table><thead><tr><th>Parameter</th><th>Specification</th></tr></thead><tbody>${specs.map(([a, b]) => `<tr><td>${escHtml(a)}</td><td>${escHtml(b)}</td></tr>`).join('')}</tbody></table>`,
        width: 'normal',
      }),
      B('cta_banner', {
        heading: 'Order Biodiesel Today',
        body: 'Get in touch for bulk supply, custom blending ratios, and delivery across India.',
        label: 'Request a Quote →',
        href: '/contact',
        secondaryLabel: 'View Crude Glycerin',
        secondaryHref: '/products/crude-glycerin',
      }),
    ],
  });

  // ----- Crude glycerin
  add({
    path: '/products/crude-glycerin', slug: 'crude-glycerin', parentPath: '/products', title: 'Crude Glycerin', show_in_nav: false, nav_order: 2, template: 'default',
    seo: {
      metaTitle: 'Crude Glycerin Supplier India',
      metaDescription: 'High-quality crude glycerin from biodiesel production. Applications in food, pharmaceuticals & cosmetics. 210 KL/day capacity at Sirohi.',
    },
    blocks: [
      B('hero', {
        variant: 'page',
        heading: 'Crude Glycerin',
        subheading: 'Premium by-product of biodiesel manufacturing — versatile applications across industries.',
      }),
      B('rich_text', {
        eyebrow: 'Product Overview',
        heading: 'What is Crude Glycerin?',
        html: '<p>Crude glycerin (also known as glycerol) is a <strong>valuable by-product</strong> generated during the trans-esterification process of biodiesel manufacturing. For every 10 parts of biodiesel produced, approximately 1 part of crude glycerin is obtained.</p>'
          + '<p>At Kotyark Industries, our crude glycerin is produced alongside our premium B100 biodiesel at our zero-discharge facilities. The glycerin undergoes quality checks to ensure it meets industry standards for various downstream applications.</p>'
          + '<p>Crude glycerin serves as a versatile raw material across multiple industries — from <strong>food processing and pharmaceuticals</strong> to <strong>cosmetics, soaps, and industrial chemicals</strong>. After refinement, it becomes a high-value ingredient in thousands of consumer and industrial products.</p>',
        width: 'normal',
      }),
      B('stats', {
        items: [
          { value: '210', label: 'KL/Day Biodiesel Capacity (glycerin proportional)' },
          { value: '~10%', label: 'Glycerin yield per biodiesel batch' },
        ],
      }),
      B('card_grid', {
        eyebrow: 'Applications',
        heading: 'Crude Glycerin Uses',
        intro: 'Our crude glycerin finds applications across diverse industries after appropriate processing and refinement.',
        columns: '3',
        items: [
          { title: 'Food Processing', body: 'Used as a humectant, sweetener, and solvent in food products. Refined glycerin is GRAS (Generally Recognized As Safe) approved.' },
          { title: 'Pharmaceuticals', body: 'Essential ingredient in syrups, cough medicines, capsules, and topical formulations for its moisturizing and solvent properties.' },
          { title: 'Cosmetics & Personal Care', body: 'Key ingredient in skincare, haircare, and personal hygiene products for its moisturizing, emollient, and humectant properties.' },
          { title: 'Soap & Detergents', body: 'Traditional and modern soap manufacturing uses glycerin as a base ingredient, providing moisturizing properties to the finished product.' },
          { title: 'Industrial Chemicals', body: 'Used as a raw material in producing alkyd resins, polyurethanes, and various industrial chemicals and solvents.' },
          { title: 'Animal Feed', body: 'Crude glycerin is used as an energy supplement in livestock and poultry feed formulations, adding caloric value.' },
        ],
      }),
      B('cta_banner', {
        heading: 'Enquire About Crude Glycerin Supply',
        body: 'Contact us for pricing, specifications, and bulk supply of crude glycerin from our manufacturing facilities.',
        label: 'Contact Sales →',
        href: '/contact',
        secondaryLabel: 'View Biodiesel',
        secondaryHref: '/products/biodiesel',
      }),
    ],
  });

  // ----- Contact
  add({
    path: '/contact', slug: 'contact', parentPath: null, title: 'Contact Us', show_in_nav: true, nav_order: 5, template: 'default',
    seo: {
      metaTitle: 'Contact Kotyark Industries - Biodiesel Enquiries',
      metaDescription: 'Get in touch with Kotyark Industries for biodiesel supply, investor queries or partnerships. Plants in Rajasthan & Gujarat. Reach out today.',
    },
    blocks: [
      B('hero', {
        variant: 'page',
        heading: 'Contact Us',
        subheading: 'Get in touch for biodiesel supply, partnerships, investor queries, or any other enquiries.',
      }),
      B('rich_text', {
        heading: 'Send Us a Message',
        html: '<p>Fill out the form below and our team will respond within 24 business hours.</p>',
        width: 'normal',
      }),
      B('contact_info', {
        heading: 'Our Offices',
        showForm: true,
        items: [
          { label: 'Head Office — Rajasthan', value: 'F-20, RICCO Industrial Area, Swaroopganj,\nSirohi District, Rajasthan 307026, India' },
          { label: 'Gujarat Plant', value: 'Anand, Gujarat, India' },
          { label: 'Email', value: 'info@kotyark.com' },
        ],
      }),
      B('rich_text', {
        heading: 'Company Details',
        html: '<p><strong>Company:</strong> Kotyark Industries Limited</p><p><strong>CIN:</strong> L15149RJ2023PLC091598</p><p><strong>Listed On:</strong> BSE (Bombay Stock Exchange)</p><p><strong>Sector:</strong> Biodiesel &amp; Biofuels</p>',
        width: 'normal',
      }),
      B('rich_text', {
        heading: 'Approved Manufacturer',
        html: '<p>Approved by Bio-Fuel Authority under the Rural Development Department and Panchayati Raj, Government of Rajasthan.</p>',
        width: 'normal',
      }),
    ],
  });

  // ----- Investors container (draft; the static /investors route keeps serving until published)
  add({
    path: '/investors', slug: 'investors', parentPath: null, title: 'Investor Relations', show_in_nav: false, nav_order: 4, template: 'default',
    seo: { metaTitle: investorsHub.title, metaDescription: investorsHub.description },
    blocks: [
      B('rich_text', { html: `<p>${escHtml(investorsHub.intro)}</p>`, width: 'normal' }),
    ],
  });

  // ----- SEBI LODR compliance table
  add({
    path: '/investors/sebi-lodr', slug: 'sebi-lodr', parentPath: '/investors', title: sebi.heading, show_in_nav: false, nav_order: 1, template: 'default',
    seo: { metaTitle: sebi.meta.title, metaDescription: sebi.meta.description },
    blocks: [
      B('hero', { variant: 'page', heading: sebi.heading }),
      B('compliance_table', {
        intro: sebi.intro,
        rows: sebi.rows.map((r) => ({
          sr: r.sr, particular: r.particular, regulation: r.regulation, href: r.link || '',
        })),
      }),
    ],
  });

  // Block ids (deterministic) + attach.
  for (const p of pages) p.blocks = p.blocks.map((b, i) => ({ id: blockId(p.path, i, b.type), type: b.type, props: b.props }));
  return pages;
}

function extractSebi() {
  const src = fs.readFileSync(path.join(INV, 'sebi-lodr', 'page.js'), 'utf8');
  const meta = extractMetadata(src);
  const arr = src.match(/const disclosures = (\[[\s\S]*?\n {2}\]);/);
  // eslint-disable-next-line no-new-func
  const rows = new Function(`return ${arr[1]}`)();
  const heading = src.match(/<InvestorSubPageLayout title="([^"]+)">/)[1];
  const intro = extractIntro(src);
  return { meta, rows, heading, intro, status: rows.map((r) => r.status) };
}

function extractHub() {
  const src = fs.readFileSync(path.join(INV, 'page.js'), 'utf8');
  const meta = extractMetadata(src);
  const intro = collapse(decode(src.match(/<h1>Investor Relations<\/h1>\s*<p>([^<]+)<\/p>/)[1]));
  return { ...meta, intro };
}

// ---------------------------------------------------------------- nav + settings
function buildNav() {
  const nav = read('src/components/Navbar.js');
  const items = [];
  const top = [...nav.matchAll(/\{ label: "([^"]+)", href: "([^"]+)" \}/g)];
  // header: Home, About Us, Products (+children), Investors, Contact in source order
  const productsChildren = [...nav.matchAll(/\{ label: "([^"]+)", href: "(\/products\/[^"]+)" \}/g)].map((m) => ({ label: m[1], url: m[2] }));
  const order = [];
  for (const m of nav.matchAll(/\{\s*label: "([^"]+)",\s*href: "([^"]+)"/g)) if (!m[2].startsWith('/products/')) order.push({ label: m[1], url: m[2] });
  void top;
  for (const o of order) {
    items.push({ menu: 'header', label: o.label, url: o.url, children: o.url === '/products' ? productsChildren : [] });
  }
  if (items.map((i) => i.url).join() !== '/,/about,/products,/investors,/contact') throw new Error('unexpected header nav: ' + items.map((i) => i.url));

  const foot = read('src/components/Footer.js');
  const groups = [...foot.matchAll(/<h5>([^<]+)<\/h5>\s*<ul className="footer-links">([\s\S]*?)<\/ul>/g)];
  for (const g of groups) {
    const links = [...g[2].matchAll(/<Link href="([^"]+)">([^<]+)<\/Link>/g)].map((m) => ({ label: decode(m[2]), url: m[1] }));
    if (links.length) items.push({ menu: 'footer', label: g[1], url: '', children: links });
  }
  return items;
}

function buildSettings() {
  const lay = read('src/app/layout.js');
  const kw = lay.match(/keywords: \[([^\]]+)\]/)[1].split(',').map((s) => s.trim().replace(/^'|'$/g, ''));
  return {
    org: {
      legalName: 'Kotyark Industries Limited',
      name: 'Kotyark Industries',
      cin: 'L15149RJ2023PLC091598',
      listing: 'BSE (Bombay Stock Exchange)',
      sector: 'Biodiesel & Biofuels',
      tagline: "India's leading biodiesel manufacturer committed to building a carbon-neutral future through renewable energy solutions.",
      approval: 'Approved by Bio-Fuel Authority, Govt. of Rajasthan',
      address: 'F-20, RICCO Industrial Area, Swaroopganj, Sirohi, Rajasthan 307026',
      addressContactPage: 'F-20, RICCO Industrial Area, Swaroopganj,\nSirohi District, Rajasthan 307026, India',
      secondaryLocation: 'Anand, Gujarat, India',
      email: 'info@kotyark.com',
      phone: null,
      logo: '/images/kotyark-logo.png',
    },
    social: {},
    seo_defaults: {
      titleDefault: 'Kotyark Industries - Leading Biodiesel Manufacturer India',
      titleTemplate: '%s | Kotyark Industries',
      description: "India's approved biodiesel manufacturer. 480,000 KL capacity. Carbon neutral fuel for transport & industry. BSE listed. Get a quote today.",
      keywords: kw,
      author: 'Kotyark Industries Limited',
      metadataBase: 'https://kotyark.com',
      openGraph: {
        title: 'Kotyark Industries - Leading Biodiesel Manufacturer India',
        description: "India's approved biodiesel manufacturer with 480,000 KL capacity. Carbon neutral fuel solutions.",
        siteName: 'Kotyark Industries',
        locale: 'en_IN',
        type: 'website',
      },
      robots: { index: true, follow: true },
    },
  };
}

// ---------------------------------------------------------------- validation + coverage
function validateSnapshot(snap) {
  const errors = [];
  for (const p of snap.pages) {
    p.blocks.forEach((b, i) => {
      for (const e of validateBlock(b)) errors.push(`${p.path} block #${i + 1} (${b.type}): ${e}`);
    });
  }
  const ids = new Set();
  for (const f of snap.folders) { if (ids.has(f.id)) errors.push(`duplicate folder id ${f.id}`); ids.add(f.id); }
  const keys = new Set();
  for (const d of snap.documents) {
    const k = `${d.folder_id}|${d.external_url}`;
    if (keys.has(k)) errors.push(`duplicate document ${k}`);
    keys.add(k);
    if (!ids.has(d.folder_id)) errors.push(`document ${d.title}: unknown folder ${d.folder_id}`);
  }
  const paths = new Set(snap.pages.map((p) => p.path));
  for (const p of snap.pages) if (p.parentPath && !paths.has(p.parentPath)) errors.push(`${p.path}: missing parent ${p.parentPath}`);
  return errors;
}

/** Flatten every string in a value to one lowercase, whitespace-free haystack (html tags stripped). */
function haystack(v) {
  const out = [];
  const walk = (x) => {
    if (typeof x === 'string') out.push(decode(x.replace(/<[^>]+>/g, ' ')));
    else if (Array.isArray(x)) x.forEach(walk);
    else if (x && typeof x === 'object') Object.values(x).forEach(walk);
  };
  walk(v);
  return out.join(' ').replace(/\s+/g, '').toLowerCase();
}

/** Text fragments visible in a JSX file: element text + string literals in arrays/props worth showing. */
function jsxFragments(src) {
  let s = src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^import .*$/gm, '');
  s = s.replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/style=\{\{[^}]*\}\}/g, ' ');
  const frags = new Set();
  // JSX text nodes
  for (const m of s.matchAll(/>([^<>{}]+)</g)) {
    const t = collapse(decode(m[1]));
    if (/[A-Za-z0-9]/.test(t)) frags.add(t);
  }
  // alt / aria-label attributes
  for (const m of s.matchAll(/\b(?:alt|aria-label)="([^"]+)"/g)) frags.add(collapse(decode(m[1])));
  // string literals (data arrays)
  for (const m of s.matchAll(/'((?:[^'\\\n]|\\.)+)'|"((?:[^"\\\n]|\\.)+)"/g)) {
    const t = collapse(decode((m[1] ?? m[2]).replace(/\\'/g, "'")));
    if (t.length > 3 && /[A-Za-z]/.test(t) && !/^[\w./#:-]+$/.test(t) && !/^(var|rgba?|linear-gradient|\d+px)/.test(t) && !t.includes('@/') && !/^(use client|btn |page-hero|section|container|stat|split|team|feature|footer|navbar|product-card|cta-section|hero|trust|category|doc-|fy-|compliance|contact-|form-group|benefit|investor|dropdown|mobile|fade|visible|carbon)/.test(t)) frags.add(t);
  }
  return [...frags];
}

function coverage(snap) {
  const map = {
    '/': 'src/app/page.js',
    '/about': 'src/app/about/page.js',
    '/products': 'src/app/products/page.js',
    '/products/biodiesel': 'src/app/products/biodiesel/page.js',
    '/products/crude-glycerin': 'src/app/products/crude-glycerin/page.js',
    '/contact': 'src/app/contact/page.js',
  };
  const missing = [];
  for (const [p, file] of Object.entries(map)) {
    const page = snap.pages.find((x) => x.path === p);
    const hay = haystack([page.blocks, page.seo]);
    const extra = file === 'src/app/contact/page.js' ? [] : [];
    void extra;
    let src = read(file);
    if (p === '/contact') src += '\n' + read('src/app/contact/layout.js');
    if (p === '/') src += '\n' + read('src/components/CarbonCreditBadge.js');
    for (const f of jsxFragments(src)) {
      const needle = f.replace(/\s+/g, '').toLowerCase();
      if (needle.length < 3) continue;
      if (!hay.includes(needle)) missing.push({ page: p, fragment: f });
    }
  }
  return missing;
}

// Known, accepted gaps: fragments the coverage check flags that are intentionally not copy.
const ACCEPTED_GAPS = [
  // aria-label on the trust bar section (accessibility only) and useState initialiser noise in the contact form
  /^(Trust indicators|, (email|phone|company|subject|message):)$/,
  // contact form UI strings: not block content; documented in docs/migration.md
  /^(Full Name \*|Email Address \*|Phone Number|Company Name|Subject \*|Message \*|Your full name|you@company\.com|\+91 XXXXX XXXXX|Your company|Select a topic|Biodiesel Supply Enquiry|Crude Glycerin Enquiry|Partnership \/ Distribution|Investor Relations|Careers|Other|Tell us about your requirements\.\.\.|Send Message →|Thank You!|Your message has been received\. Our team will get back to you within 24 business hours\.)$/,
];

function main() {
  if (process.argv.includes('--check')) {
    const snap = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    const errs = validateSnapshot(snap);
    if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
    console.log(`snapshot valid: ${snap.folders.length} folders, ${snap.documents.length} documents, ${snap.pages.length} pages`);
    return;
  }

  const { folders, folderIntros, folderIntroExtraHtml, folderPlaceholders, documents, conflicts, notes } = buildFoldersAndDocs();
  const hub = extractHub();
  const sebi = extractSebi();
  const pages = buildPages(hub, sebi);
  const snap = {
    _meta: {
      generatedBy: 'scripts/lib/build-content-snapshot.mjs',
      note: 'Verbatim extraction of the pre-CMS site. Source of truth for scripts/migrate-to-cms.mjs.',
      sources: ['scripts/legacy/legacy-seed.mjs', 'src/app/**/page.js', 'src/components/{Navbar,Footer,InvestorSubPageLayout,CarbonCreditBadge}.js', 'src/app/layout.js'],
      builderNotes: notes,
    },
    folders,
    folderIntros,
    folderIntroExtraHtml,
    folderPlaceholders,
    documents,
    documentConflicts: conflicts,
    pages,
    nav: buildNav(),
    settings: buildSettings(),
    redirects: [],
  };

  const errors = validateSnapshot(snap);
  if (errors.length) { console.error('SNAPSHOT INVALID:\n' + errors.join('\n')); process.exit(1); }

  const miss = coverage(snap).filter((m) => !ACCEPTED_GAPS.some((re) => re.test(m.fragment)));
  if (miss.length) {
    console.error('COVERAGE: visible JSX text not found in snapshot:');
    for (const m of miss) console.error(`  ${m.page}: ${JSON.stringify(m.fragment)}`);
    process.exit(1);
  }

  fs.writeFileSync(OUT, JSON.stringify(snap, null, 2) + '\n');
  const perPage = pages.map((p) => `${p.path} (${p.blocks.length} blocks)`).join(', ');
  console.log(`wrote ${path.relative(ROOT, OUT)}`);
  console.log(`folders ${folders.length}, documents ${documents.length} (seed ${SEED_DOCUMENTS.length}), conflicts ${conflicts.length}, pages ${pages.length}, nav ${snap.nav.length} top-level`);
  console.log(perPage);
  for (const n of notes) console.log('note:', n);
  for (const c of conflicts) console.log('title conflict:', JSON.stringify(c));
}

main();
