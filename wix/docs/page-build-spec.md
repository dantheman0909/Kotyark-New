# Kotyark Wix Studio: Page Build Spec

Source of truth: the reference Next.js site in `src/` (run `npm run build && npx next start -p 5202`).
Screenshots: `wix/reference/<slug>-desktop.jpg` (1440 wide) and `<slug>-mobile.jpg` (390 wide). Copy below is verbatim from `src/app/**/page.js` and `src/components/*.js`; do not retype it from memory, copy from here.

## How to use this spec

1. Build the **site-wide master sections first** (Header, Footer, section 1 below), then pages in the order listed.
2. For each page: create the page (name, URL slug, SEO), then build each section top to bottom. Every section lists the Wix Studio layout, the elements with verbatim copy, the image file, alt text, **custom classes**, entrance animation and responsive notes.
3. **Custom classes.** Assign them in the editor's *CSS Classes* panel (Inspector > CSS classes). **Names match `wix/src/styles/global.css` exactly; the stylesheet is authoritative** (for example the reference `section-tag` is `k-eyebrow`, `section-alt` is `k-section--alt`, `team-card` is `k-person-card`, `fade-up` is `k-reveal`). Every class used here is listed in Appendix A, and the full catalog with what each class reproduces is in `wix/docs/design-system.md`. Modifiers use `--` (`k-section--alt`) and card parts use `__` (**k-doc-card__title**; written in bold in this spec because `node wix/scripts/check-kit.mjs` only reads code spans). Layout (column counts, gaps, grids, sticky) is not a class: set it in the editor.
4. **Images** live in `public/images/` in this repo and must be uploaded to Wix Media (Media Manager > Upload) before use. Use the exact alt text given.
5. **Entrance animation** (reference `ScrollReveal`): every `fade-up` block fades in while sliding up 24px, 600 ms, smooth ease, triggered when about 15% of the block is in view. In Wix Studio use the native entrance animation *Fade in* + *Slide* from bottom (or *Float in*), 600 ms, applied to the section's main container (not to every child), trigger "on scroll into view". Respect reduced motion (Wix does by default). Do not apply it to heroes, headers or footers.
6. **Breakpoints.** The reference CSS switches at **1023px** (tablet: grids collapse from 3/4 columns to 2, split layouts stack, nav becomes a hamburger) and **639px** (mobile: 2-column grids go to 1, footer stacks). Map these to Wix Studio's Tablet and Mobile breakpoints; after switching, re-check every grid in the Studio breakpoint editor, because Studio does not inherit CSS media queries.
7. Page width: the reference content container is **max 1280px, 24px side padding**; section vertical padding is **96px** top and bottom (desktop). Use Wix Studio sections with a 1280px centered content area. Mobile gutter 24px.
8. Brand tokens (from the reference CSS, for the Wix site theme): primary `#0d3b24`, primary-light `#1b5e3a`, primary-lighter `#2e8b57`, accent `#d97706` (hover `#b45309`), page background `#fafdf7`, alt section background `#f0f7f1`, surface white, hero background `#071a10`, text `#0c1f13`, secondary text `#3d5a48`, muted text `#6b8a78`, border `#d1e5d8`. Headings: **Plus Jakarta Sans** (700, H1 800); body: **Inter** 17px / 1.65. H1 clamp 36-56px, H2 clamp 28-40px, H3 clamp 22-28px.
9. **SEO.** The reference applies a title template `%s | Kotyark Industries` to every page except Home. The "SEO title" given is the **rendered** title; the raw `metadata.title` is shown in brackets. Set SEO title and description in the page's SEO panel (Pages > page > SEO basics). Also set site-wide: default description as Home, social share (Open Graph) title/description from Home, site name "Kotyark Industries", locale en_IN, robots index/follow.

### Per-page checklist (copy into your tracker)

```
Page: ______   [ ] built   [ ] classes applied   [ ] mobile checked   [ ] SEO set   [ ] compared with screenshot
```

| Page | Built | Classes applied | Mobile checked | SEO set | Compared with screenshot |
|---|---|---|---|---|---|
| Master: Header | [ ] | [ ] | [ ] | n/a | [ ] |
| Master: Footer | [ ] | [ ] | [ ] | n/a | [ ] |
| Home `/` | [ ] | [ ] | [ ] | [ ] | [ ] |
| About `/about` | [ ] | [ ] | [ ] | [ ] | [ ] |
| Products `/products` | [ ] | [ ] | [ ] | [ ] | [ ] |
| Biodiesel `/products/biodiesel` | [ ] | [ ] | [ ] | [ ] | [ ] |
| Crude Glycerin `/products/crude-glycerin` | [ ] | [ ] | [ ] | [ ] | [ ] |
| Contact `/contact` | [ ] | [ ] | [ ] | [ ] | [ ] |
| Investors hub `/investors` | [ ] | [ ] | [ ] | [ ] | [ ] |
| Investor Section (dynamic) `/investors/{slug}`, serves all 15 sections including SEBI LODR | [ ] | [ ] | [ ] | [ ] | [ ] |

### Element ID note (applies to all investor pages)

Set each ID in the Inspector (Properties & Events > ID). The IDs below are **the contract with the Velo code** in `wix/src/public/pages/*.js` and are identical to `wix/src/pages/README.md`, which is authoritative: section 8 lists the hub page IDs, section 10 the dynamic page IDs (including the Reg. 46 table). IDs inside a repeater item are unique per repeater template. Page file snippets (paste into the page file Wix generates; never create or rename those files):

| Wix page | Snippet |
|---|---|
| Master page | `import { init } from 'public/pages/masterpage';` then `$w.onReady(() => init($w));` |
| Investors hub `/investors` | `import { init } from 'public/pages/investorsHub';` then `$w.onReady(() => init($w));` |
| Dynamic page `/investors/{slug}` | `import { init } from 'public/pages/investorSection';` then `$w.onReady(() => init($w));` |

### Page inventory and screenshots

| Wix page | URL | Screenshot desktop | Screenshot mobile |
|---|---|---|---|
| Home | `/` | `wix/reference/home-desktop.jpg` | `home-mobile.jpg` |
| About Us | `/about` | `about-desktop.jpg` | `about-mobile.jpg` |
| Products | `/products` | `products-desktop.jpg` | `products-mobile.jpg` |
| Biodiesel | `/products/biodiesel` | `products-biodiesel-desktop.jpg` | `products-biodiesel-mobile.jpg` |
| Crude Glycerin | `/products/crude-glycerin` | `products-crude-glycerin-desktop.jpg` | `products-crude-glycerin-mobile.jpg` |
| Contact | `/contact` | `contact-desktop.jpg` | `contact-mobile.jpg` |
| Investors | `/investors` | `investors-desktop.jpg` | `investors-mobile.jpg` |
| SEBI LODR (slug `sebi-lodr` of the dynamic page) | `/investors/sebi-lodr` | `investors-sebi-lodr-desktop.jpg` | `investors-sebi-lodr-mobile.jpg` |
| Investor Section (dynamic) | `/investors/{slug}` | `investors-company-policies-desktop.jpg`, `investors-board-meetings-desktop.jpg` | `...-mobile.jpg` |

Screenshot caveat: full-page captures show the fixed header drawn over the hero (the header is `position: fixed`; it is not part of the hero).

---

## 1. Site-wide master sections

### 1.1 Header (Wix Studio Header, same on all pages)

- **Page/Layout:** Studio *Header* (master), height 72px, horizontal flex: logo left, menu center-right, CTA right. Reference style: translucent white glass bar, fixed to the top, gains a stronger background/shadow after scrolling 40px (`scrolled` state). In Studio: header *Sticky* with a *scroll effect* (change background/shadow after 40px).
- Classes: header `k-header` (glass blur, border, radius). Scrolled state: use the Studio header scroll effect (preferred), or add `k-header--scrolled` from code.
- **Logo:** Image `public/images/kotyark-logo.png`, alt `Kotyark Industries`, link to `/` (accessible label `Kotyark Industries Home`). Height about 40px (set in the editor; no class).
- **Menu:** Studio *Horizontal menu* (or Menu element, "Menu & anchors"), class `k-menu`. Items in order:

| Label | Link | Sub-items |
|---|---|---|
| Home | `/` | none |
| About Us | `/about` | none |
| Products | `/products` | dropdown: **Biodiesel** -> `/products/biodiesel`; **Crude Glycerin** -> `/products/crude-glycerin` |
| Investors | `/investors` | none (the 14 section pages are reached from the hub and sidebar, not the menu) |
| Contact | `/contact` | none |

  Products has a small down-chevron beside the label; the parent item itself still links to `/products`. Dropdown opens on hover (desktop): white panel, 8px padding, 12px radius, shadow; items 14px. Style the dropdown panel in the menu's submenu design settings in the editor (Wix documents no class for a horizontal menu's submenu); no custom class.
- **CTA Button:** label `Contact Our Team`, link `/contact`, classes `k-btn-primary k-btn-sm` (orange accent fill, white text, 10px 20px padding, 14px text).
- **Tablet/mobile (<= 1023px):** hide the horizontal menu and the CTA button; show a hamburger (Studio *Hamburger menu*, full-height slide-in from the right with an overlay). Mobile menu content: Home, About Us, Products (with sub-items **Biodiesel**, **Crude Glycerin** indented under it), Investors, Contact, then a full-width button `Contact Our Team` (`k-btn-primary`, centered, 16px top margin). Menu items 16px / weight 500 (style the hamburger menu in the editor; `k-mobile-panel` and `k-mobile-overlay` are available for its panel and overlay); sub-items 15px, secondary text colour. Closing the menu on navigation is automatic in Studio.
- Animation: none.

### 1.2 Footer (Wix Studio Footer, same on all pages)

- **Layout:** Studio *Footer*, class `k-footer`, dark green background (use `#071a10`-family, same as hero background), light text. Inside: 4-column grid, then a bottom bar. Grid ratio 2 : 1 : 1 : 1.5 with 48px gap. Tablet: 2 columns. Mobile (<= 639px): 1 column; bottom bar stacks and centres.
- **Column 1, brand:**
  - Logo image `public/images/kotyark-logo.png` (white-on-dark treatment as in the reference; if the logo is dark, use the same file as the reference does), height 48px, alt `Kotyark Industries`, link `/`.
  - Text: `India's leading biodiesel manufacturer committed to building a carbon-neutral future through renewable energy solutions.`
  - Small text (13px): `CIN: L15149RJ2023PLC091598` (label bold) line break `BSE Listed — Biodiesel & Biofuel Sector` ("BSE Listed" bold).
- **Column 2, heading `Company`** (class `k-footer-heading`, H5), links (class `k-footer-links`): About Us `/about`; Products `/products`; Biodiesel `/products/biodiesel`; Crude Glycerin `/products/crude-glycerin`; Investors `/investors`.
- **Column 3, heading `Resources`**, links: SEBI LODR Filings `/investors`; Financial Statements `/investors`; Board Meetings `/investors`; Contact Us `/contact`. (These three point at the hub in the reference; keep as is, do not "fix" them.)
- **Column 4, heading `Head Office`**: pin icon + `F-20, RICCO Industrial Area, Swaroopganj, Sirohi, Rajasthan 307026` (13px, 60% opacity light text); mail icon + `info@kotyark.com` (plain text in the reference; making it a `mailto:` link is allowed and recommended). Icons: Wix Studio vector icons (map-pin, mail), 18px.
- **Bottom bar** (class `k-footer-bottom`, top border, flex space-between): left `© {current year} Kotyark Industries Limited. All rights reserved.` (use the year 2026 or a Wix dynamic year via a code snippet; Studio has no built-in dynamic year element); right `Approved by Bio-Fuel Authority, Govt. of Rajasthan`.
- Animation: none.

---

## 2. Home

### Page setup
- **Page name:** Home. **URL:** `/` (site home). **Type:** static.
- **SEO title:** `Kotyark Industries - Leading Biodiesel Manufacturer India` (this is the layout default; no template suffix).
- **SEO description:** `India's approved biodiesel manufacturer. 480,000 KL capacity. Carbon neutral fuel for transport & industry. BSE listed. Get a quote today.`
- **Keywords (optional, reference `metadata.keywords`):** biodiesel manufacturer India, biofuel, biodiesel, crude glycerin, renewable energy India, Kotyark Industries, B100 biodiesel, carbon neutral fuel.
- Social share: title `Kotyark Industries - Leading Biodiesel Manufacturer India`; description `India's approved biodiesel manufacturer with 480,000 KL capacity. Carbon neutral fuel solutions.`

### Section 1: Hero
- **Layout:** Studio Section, full width, min-height 100vh (use 100% viewport height), content centred both ways, max text width 900px, text centred. Section background: image `public/images/hero-forest.jpg` at **40% opacity** over `#071a10`, plus a **135 degree overlay gradient** `rgba(7,26,16,.92)` 0% -> `rgba(13,59,36,.75)` 50% -> `rgba(7,26,16,.85)` 100%. In Studio: Section background = image with overlay, or a Strip with a Box overlay. Classes: section `k-hero`; background image/box `k-hero-bg`; overlay `k-hero-overlay`.
- Background image alt/aria: `Aerial view of lush green forest canopy representing renewable energy`.
- Elements top to bottom:
  1. **Badge** (pill, shield icon + text), class `k-hero-badge`: `BSE Listed · Government Approved Biofuel Manufacturer`.
  2. **H1** `Powering India's Future With Clean Biodiesel`, white; the words **`Clean Biodiesel`** are accent-coloured: Wix rich text cannot carry a span class, so put those words in a **separate Text element** with class `k-hero-highlight` (orange gradient text), placed inline after the first line of the H1 (if that cannot be laid out, set colour `#d97706` on the selected words directly).
  3. **Subtitle** (class `k-hero-subtitle`): `India's leading biodiesel manufacturer with 480,000 KL annual capacity. We convert non-edible vegetable oils into premium B100 biodiesel — delivering 86% less greenhouse emissions and a carbon-neutral fuel alternative.`
  4. **Buttons** (row, class `k-hero-actions`, gap 16px, wrap): `Contact Our Team →` -> `/contact`, classes `k-btn-primary k-btn-lg`; `Explore Products` -> `/products`, classes `k-btn-outline-light k-btn-lg`.
  5. **Carbon credit badge** (bottom-right, absolutely positioned on desktop): **Custom Element** `kotyark-carbon-badge` (file `wix/src/public/custom-elements/kotyark-carbon-badge.js`), attributes `title="First Indian Company"`, `prefix="to receive"`, `highlight="Verra Carbon Credits"`. Reference markup: leaf icon in an amber square, bold line `First Indian Company`, then `to receive Verra Carbon Credits` with the last two words highlighted, with a pulsing ring behind it. SEO: the element is client-rendered, so also place the sentence `First Indian Company to receive Verra Carbon Credits` as native Wix text (can be visually hidden or placed in the SEO markup).
  6. **Scroll chevron** (decorative, bottom centre, bouncing): optional Studio icon; may be omitted. `aria-hidden`.
- **Animation:** hero content loads with the page; no scroll entrance. Chevron bounce optional.
- **Responsive:** <= 1023px hero stacks vertically and the carbon badge becomes a static block below the buttons (centred, 90% wide, max 400px, 32px above, 24px below). <= 639px the carbon badge is **hidden** in the reference; hide it on the Mobile breakpoint (and keep the hidden native sentence for SEO). H1 scales down to 36px on mobile; the buttons stack full width with 16px gap. Hero padding about 128px top/bottom on desktop.

### Section 2: Trust bar
- **Layout:** Studio Section, white background, 1px bottom border `#e8f0ea`, 32px vertical padding. Inside a **4-column grid** (gap 32px), class section `k-trust-bar`. Each cell class `k-trust-item`: 48x48 rounded icon tile (class `k-icon-box--sm`, `#f0f7f1`, green icon) + two text lines (label class `k-trust-label`, sublabel class `k-trust-sublabel`). Build one item, then use a Studio Grid/Repeater with 4 items (or duplicate).
- Items (icon -> label / sublabel):
  1. shield -> `Government Approved` / `Bio-Fuel Authority, Govt. of Rajasthan`
  2. activity/pulse -> `BSE Listed` / `Publicly traded, SEBI compliant`
  3. check-circle -> `480,000 KL Capacity` / `Annual biodiesel production`
  4. pen/leaf -> `Zero Discharge` / `Environmentally responsible plants`
- Animation: none (the reference does not reveal this section).
- **Responsive:** tablet 2 columns (24px gap); mobile 1 column.

### Section 3: What is Biodiesel? (split, image right)
- **Layout:** Section (`k-section`), 2-column grid (set in the editor), 64px gap, vertically centred; text left, image right. Entrance animation on the grid.
- **Left column:**
  - Section tag (class `k-eyebrow`; 13px, uppercase, 0.1em letter-spacing, 600 weight, accent colour, 12px below): `What is Biodiesel?`
  - **H2:** `A Cleaner Fuel For a Greener Tomorrow`
  - Paragraph 1: `Biodiesel is a renewable, clean-burning diesel alternative produced through the trans-esterification of non-edible vegetable oils. As a **mono alkyl ester**, it is chemically similar to conventional High-Speed Diesel (HSD) but produces **86% fewer greenhouse gas emissions**.`
  - Paragraph 2: `At Kotyark Industries, we manufacture premium **B100 biodiesel** that can be blended at any ratio — from B5 (5%) to B100 (neat) — delivering superior lubricity, higher cetane numbers, more power, and better mileage than conventional diesel.`
  - Paragraph 3: `Our biodiesel is approved by the **Bio-Fuel Authority under the Rural Development Department and Panchayati Raj, Government of Rajasthan**, ensuring the highest standards of quality and environmental compliance.`
  - Button `Learn About Biodiesel →` -> `/products/biodiesel`, class `k-btn-outline` (outlined green), 8px top margin.
- **Right column:** Image `public/images/biodiesel-cycle.png`, fit contain, width 100%, class `k-split-image` (24px radius). Alt: `Biodiesel production cycle infographic showing feedstocks, biofuel production, renewable fuel usage, and carbon dioxide absorption by biomass`.
- Responsive: <= 1023px single column, 48px gap, text first then image.

### Section 4: Key statistics ("Impact at Scale")
- **Layout:** Section with alt background `k-section k-section--alt` (`#f0f7f1`). Centred header block (class `k-section-header`, max-width about 720px, centred) then a **4-column grid** of stat cards (gap 32px).
- Header: tag `Impact at Scale`; H2 `India's Biofuel Capacity Leader`; paragraph `Operating advanced biodiesel manufacturing facilities across Rajasthan and Gujarat with zero-discharge environmental compliance.`
- Stat cards (class `k-stat-card`: white, 1px border, 16px radius, centred, 48px/24px padding; hover lifts 4px with green glow; number class `k-stat-number` Plus Jakarta Sans 800 about 48px primary green; label class `k-stat-label`):
  `480K` / `KL Annual Capacity`; `210` / `KL/Day Production`; `86%` / `Less GHG Emissions`; `Zero` / `Discharge Facilities`.
- **Optional enhancement (not in the reference):** replace each card with Custom Element `kotyark-stat-counter` (attributes `value`, `label`, optional `duration`, `delay`, `number-size`, `animate`), e.g. `value="480K" label="KL Annual Capacity"`. Keep the plain-text card if SEO of the figures matters; the element is client-rendered.
- Animation: header block and grid each reveal (two separate entrance animations in sequence).
- Responsive: tablet 2 columns; mobile 2 columns, 16px gap, card padding 24px/16px.

### Section 5: Products teaser
- **Layout:** Section `k-section`. Header block, then a **2-column grid** (gap 32px) of two product cards. Each whole card is a link (Studio: make the container clickable, link to the product page). Card: white, 1px border, 24px radius, overflow hidden, hover lift 4px; classes `k-product-card`, image area **k-product-card__image** (height 220px, background image cover, with a dark gradient overlay at the bottom), body **k-product-card__body** (padding 24-32px), link line **k-product-card__link** (accent/green text with arrow icon, arrow shifts right on hover).
- Header: tag `Our Products`; H2 `Renewable Energy Products`; paragraph `High-quality biofuels and by-products manufactured at our state-of-the-art facilities in Sirohi, Rajasthan and Anand, Gujarat.`
- Card 1 -> `/products/biodiesel`: image `public/images/biodiesel-product.png` (fallback colour `#0d3b24`), alt `Premium B100 Biodiesel fuel`; H3 `Biodiesel (B100)`; text `Premium quality biodiesel manufactured from non-edible vegetable oils through trans-esterification. A clean, renewable diesel alternative with superior lubricity and higher cetane number.`; link text `Explore Biodiesel` + arrow icon.
- Card 2 -> `/products/crude-glycerin`: image `public/images/glycerin-product.png` (fallback `#1b5e3a`), alt `Crude Glycerin by-product`; H3 `Crude Glycerin`; text `High-quality crude glycerin produced as a valuable by-product of biodiesel manufacturing. Widely used in food processing, pharmaceuticals, cosmetics, and industrial applications.`; link `Explore Glycerin` + arrow.
- Animation: header and grid reveal.
- Responsive: mobile 1 column.

### Section 6: Why Biodiesel (features)
- **Layout:** `k-section k-section--alt`. Centred header, then a **3-column grid, 2 rows** of feature cards (gap 32px). Card class `k-feature-card` (white, border, 16px radius, 32px padding, hover lift); icon tile `k-icon-box` (56px rounded `#f0f7f1`, green line icon 28px); H4 and paragraph (14-15px secondary text).
- Header: tag `Why Biodiesel?`; H2 `The Advantages of Biofuel Energy`; paragraph `Biodiesel delivers measurable benefits across environmental, economic, and operational dimensions.`
- Cards (icon -> H4 / text):
  1. people -> `Carbon Neutral` / `Biodiesel is produced from biomass that absorbs CO₂ during growth, creating a closed carbon cycle that achieves near-zero net emissions.`
  2. bolt -> `More Power` / `Higher cetane number delivers improved combustion efficiency, more torque, and better mileage compared to conventional HSD diesel fuel.`
  3. shield -> `Engine Safe` / `Superior lubricity protects engine components and reduces wear. Compatible with all diesel engines without modification at B5-B20 blends.`
  4. globe -> `Reduces Imports` / `Domestically produced biodiesel reduces India's dependency on imported crude oil, strengthening energy security and saving foreign exchange.`
  5. box/cube -> `Non-Toxic` / `Biodegradable and non-toxic. Breaks down naturally in the environment, unlike petroleum diesel, making spills safer to manage.`
  6. circle-plus -> `Job Creation` / `Biodiesel manufacturing supports rural economies by creating employment in feedstock cultivation, processing, and distribution across India.`
- Animation: header and grid reveal. Build as a Studio **Repeater** (static items) of 6 or duplicate cards. Responsive: tablet 2 columns; mobile 1 column, card padding 24px.

### Section 7: Environmental impact (split, image left)
- **Layout:** `k-section`, 2-column grid; **image LEFT, text RIGHT** (the reference uses `split-reverse`; on tablet/mobile the order becomes text first then image, as the reference's source order is text first).
- **Text column:** tag `Environmental Impact`; H2 `Building a Carbon-Neutral Future`; paragraph 1 `Every litre of biodiesel from Kotyark replaces petroleum diesel, reducing greenhouse gas emissions by up to **86%**. With annual capacity of **480,000 kiloliters**, we're making a measurable impact on India's carbon footprint.`; paragraph 2 `Our zero-discharge manufacturing facilities ensure that the production process itself is environmentally responsible — from feedstock sourcing to final product delivery.`
  Then a 2-column mini-stat grid (16px gap, 24px above): two boxes class `k-mini-stat` (16px padding, `#f0f7f1` background, 12px radius): number `86%` (class `k-mini-stat-number`: Plus Jakarta Sans 800, 28px, primary green) / `Less GHG emissions` (class `k-mini-stat-label`: 14px muted); number `100%` / `Biodegradable fuel`.
- **Image column:** `public/images/save-planet.jpg`, cover, min-height 400px, 24px radius, class `k-split-image`. Alt `Hands holding a globe made of recycled materials, representing environmental sustainability through biodiesel`.
- Animation: reveal on the grid.

### Section 8: CTA band ("Partner With India's Biofuel Leader")
- **Layout:** `k-section`, inside a rounded panel class `k-cta-band`: 135 degree gradient `#071a10` -> `#0d3b24`, 24px radius, padding 96px 64px, centred, subtle radial green glow top-left. H2 white, paragraph 75% white.
- H2 `Partner With India's Biofuel Leader`; paragraph `Whether you need bulk biodiesel supply, crude glycerin, or want to discuss investment opportunities — our team is ready to help.`
- Buttons (centred, gap 16px, wrap): `Contact Our Team →` -> `/contact` (`k-btn-primary k-btn-lg`); `Investor Relations` -> `/investors` (`k-btn-outline-light k-btn-lg`).
- Animation: reveal. Responsive: panel padding about 48px 24px on mobile, buttons stack.
- (Section id in the reference is `newsletter` but there is **no newsletter form**; do not add one.)

---

## 3. About Us

### Page setup
- **Page name:** About Us. **URL:** `/about`. Static.
- **SEO title:** `About Kotyark Industries - India's Biofuel Pioneer | Kotyark Industries` [raw: `About Kotyark Industries - India's Biofuel Pioneer`]
- **SEO description:** `Learn about Kotyark Industries Limited, a BSE-listed biodiesel manufacturer with 480,000 KL capacity. Zero discharge facilities in Rajasthan & Gujarat.`

### Reusable: Page hero (used on About, Products, Biodiesel, Glycerin, Contact, Investors, and investor sub pages)
Studio Section, class `k-page-hero`: 135 degree gradient `#071a10` -> `#0d3b24`, radial green glow at 70%/30%, text centred, padding 128px top / 64px bottom (reduce to about 96/48 on mobile), content max 640px for the paragraph (paragraph 18px, 75% white), H1 white. Build once, duplicate to other pages and edit the text. Not animated.

### Section 1: Page hero
H1 `About Kotyark Industries`; paragraph `Pioneering India's clean energy revolution through biodiesel manufacturing since our foundation.`

### Section 2: Our Story (split, text left, stats right)
- Layout `k-section`, 2-column grid.
- Left: tag `Our Story`; H2 `Building India's Biofuel Future`; P1 `Kotyark Industries Limited is a **publicly listed biodiesel manufacturing company** on the Bombay Stock Exchange (BSE). We operate state-of-the-art, zero-discharge biodiesel production facilities in **Sirohi, Rajasthan** and **Anand, Gujarat**.`; P2 `With an annual installed capacity of **480,000 kiloliters** and daily production of **210 KL**, Kotyark is one of India's leading biodiesel manufacturers. We convert non-edible vegetable oils into premium B100 biodiesel through advanced trans-esterification processes.`; P3 `Our operations are approved by the **Bio-Fuel Authority under the Rural Development Department and Panchayati Raj, Government of Rajasthan**, reflecting our commitment to quality, safety, and environmental responsibility.`
- Right: **2x2 stat grid** (`k-stat-card`, number 36px): `480K` / `KL Annual Capacity`; `210` / `KL Daily Output`; `2` / `Manufacturing Plants`; `Zero` / `Discharge Facilities`.
- Animation: reveal. Responsive: stack at tablet; stats stay 2x2 on mobile.

### Section 3: Vision and Mission
- Layout `k-section k-section--alt`, 2-column grid of two panels. Panel class `k-card-panel` (white, 1px border, 16px radius, 48px padding). H3 then paragraph (class `k-card-panel-text`: 18px, line-height 1.7).
- Panel 1: H3 `Our Vision`; `To be India's most trusted producer of sustainable biofuels, leading the nation's transition to carbon-neutral energy and reducing dependency on imported fossil fuels.`
- Panel 2: H3 `Our Mission`; `To manufacture premium-quality biodiesel that exceeds industry standards while maintaining zero-discharge operations, supporting rural employment, and delivering value to our shareholders and communities.`
- Animation: reveal. Mobile: stack, padding 32px.

### Section 4: Leadership, Board of Directors
- Layout `k-section`. Header: tag `Leadership`; H2 `Board of Directors`; paragraph `Experienced professionals driving Kotyark's growth and innovation in India's biofuel sector.` Then a **3 x 2 grid** of team cards (gap 32px); class `k-person-card` (white, border, 16px radius, centred, 48px/24px padding). Each: round 120px avatar `k-person-photo` showing **initials** (no photo files exist; 36px, bold, `#2e8b57` on `#f0f7f1`, 3px border), H4 name, role line (class `k-person-role`, accent colour, small), bio (class `k-person-bio`, 14-15px secondary).
- Cards:
  1. `GS` / `Mr. Gaurang Shah` / `Chairman cum Managing Director` / `Commerce Graduate from Maharaja Sayajirao University of Baroda with over 27 years of experience in vegetable oil trading and biofuels. As Promoter and CMD, he leads overall management, strategy formulation, and ensures operations consistently exceed industry standards.`
  2. `DS` / `Mrs. Dhruti Shah` / `Whole Time Director & CFO` / `Holds M.Com and MBA degrees with approximately 11 years of industry experience. Appointed CFO and KMP in September 2024, she oversees all financial and operational activities from conceptualization to execution, bringing extensive knowledge of the biofuel industry.`
  3. `BS` / `Mrs. Bhaviniben Shah` / `Non-Executive Director` / `Diploma in Mechanical Engineering with approximately 10 years of experience in the biofuels sector. Has made important contributions to the company's operations and growth.`
  4. `AS` / `Mr. Akshay Jayrajbhai Shah` / `Non-Executive Independent Director` / `Bachelor of Science with 15 years of professional experience. Provides independent oversight and governance, contributing to strategic decision-making and corporate compliance.`
  5. `HP` / `Mr. Harsh Mukeshbhai Parikh` / `Non-Executive Independent Director` / `MBA with 21 years of experience across various sectors. Has played an instrumental role in the company's growth since joining, providing strategic and governance guidance.`
  6. `VM` / `Mr. Viral Mamtora` / `Additional Independent Director` / `B.Com from Saurashtra University and Associate Member of ICAI with over 15 years of experience in Finance and Accounts. Currently Proprietor of M/s. Viral M. Mamtora & Associates.`
- Animation: header and grid reveal. Responsive: tablet 2 columns; mobile 1 column. A Studio **Repeater** with a static item list works well; initials can be a text element inside a circle container.

### Section 5: Facilities, Manufacturing Plants
- Layout `k-section k-section--alt`. Header: tag `Our Facilities`; H2 `Manufacturing Plants` (no paragraph). **2-column** grid of non-clickable cards (`k-product-card`, no link, default cursor). Image area is a **solid colour block** (180px high), not a photo: card 1 `#0d3b24`, card 2 `#1b5e3a`, with white centred label text (Plus Jakarta Sans 700, 24px): `Rajasthan Plant` / `Gujarat Plant`. Body:
  - H3 `Sirohi, Rajasthan`; `Primary manufacturing facility located at F-20, RICCO Industrial Area, Swaroopganj, Sirohi District, Rajasthan 307026. Equipped with advanced trans-esterification technology and zero-discharge systems.`
  - H3 `Anand, Gujarat`; `Second manufacturing facility in Anand, Gujarat, expanding Kotyark's production capacity and geographical reach to serve clients across western India efficiently.`
- Animation: reveal. Mobile: 1 column. (No images exist for the plants; do not invent any.)

### Section 6: CTA band
`k-cta-band`: H2 `Ready to Partner With Us?`; paragraph `Join India's biofuel revolution. Contact us for biodiesel supply, partnership opportunities, or investor inquiries.`; button `Contact Us →` -> `/contact` (`k-btn-primary k-btn-lg`). Animation: reveal.

---

## 4. Products (hub)

### Page setup
- **Name:** Products. **URL:** `/products`. Static.
- **SEO title:** `Biodiesel & Glycerin Products | Kotyark Industries` [raw: `Biodiesel & Glycerin Products`]
- **SEO description:** `Explore Kotyark's range of biofuel products: B100 Biodiesel, Crude Glycerin, and more. Government approved. Available across India.`

### Section 1: Page hero
H1 `Our Products`; paragraph `High-quality biofuels and by-products manufactured at our zero-discharge facilities in Rajasthan and Gujarat.`

### Section 2: Current Product Range
- Layout `k-section`. Header: tag `Available Now`; H2 `Current Product Range`. **2-column** grid of two clickable product cards (`k-product-card`; image area 280px high on this page).
- Card 1 -> `/products/biodiesel`: image `public/images/biodiesel-product.png`, alt `Premium B100 Biodiesel fuel`; H3 `Biodiesel (B100)`; `Premium quality biodiesel manufactured from non-edible vegetable oils through advanced trans-esterification processes. A clean-burning, renewable diesel alternative that delivers 86% fewer greenhouse gas emissions, superior lubricity, and higher cetane number than conventional HSD.`; **tag chips** (class `k-product-tag`: pill, 12px/600, 4px 12px padding, `#f0f7f1` background, primary green text; row with 8px gap): `Carbon Neutral`, `Non-Toxic`, `Engine Safe`, `High Cetane`; link `View Details` + arrow.
- Card 2 -> `/products/crude-glycerin`: image `public/images/glycerin-product.png`, alt `Crude Glycerin by-product`; H3 `Crude Glycerin`; `High-quality crude glycerin produced as a valuable by-product of biodiesel manufacturing. Also known as glycerol, it finds extensive applications in food processing, pharmaceuticals, cosmetics, and industrial sectors worldwide.`; chips `Food Grade`, `Pharma Grade`, `Industrial`, `Cosmetics`; link `View Details` + arrow.
- Animation: reveal. Mobile: 1 column.

### Section 3: Upcoming Products
- Layout `k-section k-section--alt`. Header: tag `Expanding`; H2 `Upcoming Products`; paragraph `Kotyark is expanding its product portfolio to serve broader renewable energy needs.` **3-column** feature-card grid (not links):
  1. bolt icon -> `CBFS` / `Carbon Black Feed Stock — a high-demand industrial raw material for the rubber and tyre manufacturing industry.`
  2. smiley-circle icon -> `Light Petroleum Oil (LPO)` / `Light petroleum oil derivatives for specialized industrial and energy applications.`
  3. circle-plus icon -> `Dewatering Fluid` / `Specialized dewatering fluids for industrial processes and environmental management applications.`
- Animation: reveal. Responsive: tablet 2 columns; mobile 1.

### Section 4: CTA band
H2 `Need Bulk Biodiesel Supply?`; paragraph `Contact us for pricing, availability, and customized supply agreements for your business needs.`; button `Request a Quote →` -> `/contact` (`k-btn-primary k-btn-lg`).

---

## 5. Biodiesel

### Page setup
- **Name:** Biodiesel. **URL:** `/products/biodiesel`. Static. (Menu: sub-item under Products.)
- **SEO title:** `Biodiesel B100 - Renewable Diesel Fuel | Kotyark Industries` [raw: `Biodiesel B100 - Renewable Diesel Fuel`]
- **SEO description:** `Clean-burning B100 biodiesel from non-edible vegetable oil. 86% less greenhouse gas. More power, better mileage. Order biodiesel now.`

### Section 1: Page hero
H1 `Biodiesel (B100)`; paragraph `Premium renewable diesel fuel — cleaner burning, carbon neutral, and superior performance.`

### Section 2: Product overview (split, image right)
- `k-section`, 2-column grid. Left: tag `Product Overview`; H2 `What is B100 Biodiesel?`; P1 `Biodiesel is a **renewable, clean-burning diesel replacement** produced through the trans-esterification of non-edible vegetable oils. Chemically classified as a mono alkyl ester, biodiesel is functionally equivalent to petroleum-based High-Speed Diesel (HSD) but with dramatically lower environmental impact.`; P2 `At Kotyark Industries, we manufacture **B100 (neat/pure) biodiesel** at our Government-approved, zero-discharge facilities. B100 can be used directly or blended with petroleum diesel at varying ratios — from **B5 (5% biodiesel)** to **B20 (20% biodiesel)** — without requiring engine modifications.`; P3 `Our biodiesel meets all quality standards set by the Bureau of Indian Standards (BIS) and is approved by the **Bio-Fuel Authority under the Government of Rajasthan**.`
- Right: image `public/images/biodiesel-cycle.png`, contain, alt `Biodiesel production cycle showing feedstocks, biofuel production, renewable fuel, and CO2 absorption`.
- Animation: reveal. Tablet: stack.

### Section 3: Benefits of Biodiesel
- `k-section k-section--alt`. Header: tag `Advantages`; H2 `Benefits of Biodiesel`; paragraph `Biodiesel delivers measurable advantages across environmental, economic, and operational dimensions.` **4-column grid, 2 rows** (gap 24px) of benefit items: class `k-benefit-card` (flex, 12px gap; white card, border, 12px radius, padding about 20px), check icon in a green circle (class `k-benefit-check`, 14px check), then paragraph text. Eight items, all with the check:
  1. `86% less greenhouse gas emissions compared to petroleum diesel`
  2. `Higher cetane number for improved combustion and engine performance`
  3. `Superior lubricity that protects fuel system components and reduces wear`
  4. `More power and better mileage than conventional HSD diesel`
  5. `Carbon neutral — CO₂ absorbed during biomass growth offsets emissions`
  6. `Non-toxic and biodegradable — environmentally safe in case of spills`
  7. `Reduces India's dependency on imported crude oil`
  8. `Creates rural employment through feedstock cultivation and processing`
- Animation: reveal. Responsive: tablet 2 columns; mobile 1 column.

### Section 4: Applications
- `k-section`. Header: tag `Use Cases`; H2 `Biodiesel Applications`; paragraph `B100 biodiesel and its blends serve diverse sectors across India's economy.` 3-column feature cards:
  1. truck icon -> `Transport & Logistics` / `Commercial fleets, trucks, and heavy vehicles. B5–B20 blends require no engine modifications and provide cleaner emissions.`
  2. building icon -> `Industrial Power` / `Backup power generators, boilers, and industrial heating systems. Biodiesel provides reliable, cleaner-burning energy.`
  3. pie/clock icon -> `Agriculture` / `Farm equipment, tractors, and irrigation pump sets. Biodiesel supports rural India's energy needs sustainably.`
- Animation: reveal. Mobile: 1 column.

### Section 5: Technical Data (spec table)
- `k-section k-section--alt`. Header: tag `Specifications`; H2 `Technical Data`. A **table** with class `k-spec-table`, which itself carries the centred card frame (max width 800px, white, 1px border, 16px radius, overflow hidden): header row green `#0d3b24` with white text (14px, 600): `Parameter` | `Specification`; body rows 15px with 1px bottom border, first column weight 500, second column secondary colour, cell padding 12px 20px.
  Rows (Parameter -> Specification): Chemical Type -> `Mono Alkyl Ester (FAME)`; Feedstock -> `Non-edible vegetable oils`; Process -> `Trans-esterification`; GHG Reduction -> `86% vs. petroleum diesel`; Blending Range -> `B5 (5%) to B100 (neat)`; Engine Compatibility -> `All diesel engines (B5–B20 without modification)`; Cetane Number -> `Higher than conventional HSD`; Biodegradability -> `100% biodegradable, non-toxic`; Lubricity -> `Superior to petroleum diesel`; Approval -> `Bio-Fuel Authority, Govt. of Rajasthan`.
- Wix element: Studio **Table** element (Add > Table), 2 columns x 11 rows (header + 10), styled via class `k-spec-table`. **Wix equivalence note:** if the Table element cannot hold the header styling, use a 2-column Repeater with a header strip. Animation: reveal. Mobile: the table stays 2 columns, full width, reduce cell padding to 12px; text wraps.

### Section 6: CTA band
H2 `Order Biodiesel Today`; paragraph `Get in touch for bulk supply, custom blending ratios, and delivery across India.`; buttons `Request a Quote →` -> `/contact` (`k-btn-primary k-btn-lg`) and `View Crude Glycerin` -> `/products/crude-glycerin` (`k-btn-outline-light k-btn-lg`).

---

## 6. Crude Glycerin

### Page setup
- **Name:** Crude Glycerin. **URL:** `/products/crude-glycerin`. Static.
- **SEO title:** `Crude Glycerin Supplier India | Kotyark Industries` [raw: `Crude Glycerin Supplier India`]
- **SEO description:** `High-quality crude glycerin from biodiesel production. Applications in food, pharmaceuticals & cosmetics. 210 KL/day capacity at Sirohi.`

### Section 1: Page hero
H1 `Crude Glycerin`; paragraph `Premium by-product of biodiesel manufacturing — versatile applications across industries.`

### Section 2: Overview (split, text left, two stats right)
- `k-section`, 2-column grid. Left: tag `Product Overview`; H2 `What is Crude Glycerin?`; P1 `Crude glycerin (also known as glycerol) is a **valuable by-product** generated during the trans-esterification process of biodiesel manufacturing. For every 10 parts of biodiesel produced, approximately 1 part of crude glycerin is obtained.`; P2 `At Kotyark Industries, our crude glycerin is produced alongside our premium B100 biodiesel at our zero-discharge facilities. The glycerin undergoes quality checks to ensure it meets industry standards for various downstream applications.`; P3 `Crude glycerin serves as a versatile raw material across multiple industries — from **food processing and pharmaceuticals** to **cosmetics, soaps, and industrial chemicals**. After refinement, it becomes a high-value ingredient in thousands of consumer and industrial products.`
- Right: two stacked stat cards (16px gap, number 36px): `210` / `KL/Day Biodiesel Capacity (glycerin proportional)`; `~10%` / `Glycerin yield per biodiesel batch`.
- Animation: reveal. Tablet: stack.

### Section 3: Applications
- `k-section k-section--alt`. Header: tag `Applications`; H2 `Crude Glycerin Uses`; paragraph `Our crude glycerin finds applications across diverse industries after appropriate processing and refinement.` 3 x 2 feature cards:
  1. cup icon -> `Food Processing` / `Used as a humectant, sweetener, and solvent in food products. Refined glycerin is GRAS (Generally Recognized As Safe) approved.`
  2. grid icon -> `Pharmaceuticals` / `Essential ingredient in syrups, cough medicines, capsules, and topical formulations for its moisturizing and solvent properties.`
  3. gear icon -> `Cosmetics & Personal Care` / `Key ingredient in skincare, haircare, and personal hygiene products for its moisturizing, emollient, and humectant properties.`
  4. cube icon -> `Soap & Detergents` / `Traditional and modern soap manufacturing uses glycerin as a base ingredient, providing moisturizing properties to the finished product.`
  5. bolt icon -> `Industrial Chemicals` / `Used as a raw material in producing alkyd resins, polyurethanes, and various industrial chemicals and solvents.`
  6. circle-plus icon -> `Animal Feed` / `Crude glycerin is used as an energy supplement in livestock and poultry feed formulations, adding caloric value.`
- Animation: reveal. Tablet 2 columns; mobile 1.

### Section 4: CTA band
H2 `Enquire About Crude Glycerin Supply`; paragraph `Contact us for pricing, specifications, and bulk supply of crude glycerin from our manufacturing facilities.`; buttons `Contact Sales →` -> `/contact` (`k-btn-primary k-btn-lg`); `View Biodiesel` -> `/products/biodiesel` (`k-btn-outline-light k-btn-lg`).

---

## 7. Contact

### Page setup
- **Name:** Contact. **URL:** `/contact`. Static.
- **SEO title:** `Contact Kotyark Industries - Biodiesel Enquiries | Kotyark Industries` [raw: `Contact Kotyark Industries - Biodiesel Enquiries`]
- **SEO description:** `Get in touch with Kotyark Industries for biodiesel supply, investor queries or partnerships. Plants in Rajasthan & Gujarat. Reach out today.`

### Section 1: Page hero
H1 `Contact Us`; paragraph `Get in touch for biodiesel supply, partnerships, investor queries, or any other enquiries.`

### Section 2: Form + offices (2-column grid, 64px gap, set in the editor)
Tablet and mobile (<= 1023px): single column, form first then offices. Animation: reveal on the whole grid.

**Left column: Wix Form**
- H2 `Send Us a Message`; paragraph (secondary colour, 32px below) `Fill out the form below and our team will respond within 24 business hours.`
- Element: **Wix Form** (Studio > Add > Contact & Forms > Form; start from a blank form). Apply class `k-field` to each input, dropdown and the textarea (it styles the label, border, radius and green focus ring); the form container itself needs no class. Fields in order, exactly:

| # | Label (exact) | Field type | Required | Placeholder | Layout |
|---|---|---|---|---|---|
| 1 | `Full Name *` | Short text | Yes | `Your full name` | Row 1, left (50%) |
| 2 | `Email Address *` | Email | Yes | `you@company.com` | Row 1, right (50%) |
| 3 | `Phone Number` | Phone | No | `+91 XXXXX XXXXX` | Row 2, left (50%) |
| 4 | `Company Name` | Short text | No | `Your company` | Row 2, right (50%) |
| 5 | `Subject *` | Dropdown | Yes | first option `Select a topic` (empty value) | Full width |
| 6 | `Message *` | Long text (textarea) | Yes | `Tell us about your requirements...` | Full width |

  Subject dropdown options (label -> stored value): `Biodiesel Supply Enquiry` (biodiesel-supply); `Crude Glycerin Enquiry` (glycerin-supply); `Partnership / Distribution` (partnership); `Investor Relations` (investor); `Careers` (careers); `Other` (other). In Wix Forms, mark the field required so the empty "Select a topic" cannot be submitted.
  Wix Forms marks required via a setting and an asterisk; the labels above include the literal `*` as in the reference. Keep the `*` in the label text only if the Wix required-indicator is switched off, otherwise you will show two asterisks.
- **Submit button label:** `Send Message →`, classes `k-btn-primary k-btn-lg`, full width (100%), text centred.
- **Success message** (Wix Form "After submission": show message, replace the form): a centred panel (class `k-form-success`, `#f0f7f1` background, 16px radius, padding 48px 32px) with a green check icon in a 64px circle (class `k-form-success-icon`: `rgba(22,163,74,.1)` fill, `#16A34A` check), H3 `Thank You!`, and paragraph `Your message has been received. Our team will get back to you within 24 business hours.`
- **Behaviour note:** the reference form does not post anywhere (it only shows the success state). In Wix, connect the form to a **Wix Forms submission email notification** and the Wix Contacts list. The destination address is not in the reference; the only email in the reference is `info@kotyark.com` (footer and contact card). **Confirm the recipient with the client** before enabling.

**Right column: offices**
- H2 `Our Offices` (24px below). Three info cards, class `k-contact-card` (flex, 16px gap, pale green `#f0f7f1` panel, no border, 12px radius, 24px padding), icon tile **k-contact-card__icon** (44px, white tile, 8px radius, green icon 22px):
  1. map-pin -> H4 `Head Office — Rajasthan` (16px); text (14px secondary): `F-20, RICCO Industrial Area, Swaroopganj,` line break `Sirohi District, Rajasthan 307026, India`
  2. map-pin -> H4 `Gujarat Plant`; `Anand, Gujarat, India`
  3. mail -> H4 `Email`; `info@kotyark.com` (may be a `mailto:` link)
- **Company details panel** (32px above; class `k-info-panel`: `#f0f7f1`, 1px border, 16px radius, 24px padding): H4 `Company Details`; four lines (class `k-info-panel-text`: 14px, line-height 1.8, secondary colour), label bold: `Company: Kotyark Industries Limited`; `CIN: L15149RJ2023PLC091598`; `Listed On: BSE (Bombay Stock Exchange)`; `Sector: Biodiesel & Biofuels`.
- **Approved manufacturer panel** (24px above; class `k-info-panel-green`: 135 degree gradient `#0d3b24` -> `#1b5e3a`, white text, 16px radius, 24px padding): H4 `Approved Manufacturer` (white; class `k-info-panel-heading`); `Approved by Bio-Fuel Authority under the Rural Development Department and Panchayati Raj, Government of Rajasthan.` (14px, 80% light; the panel class colours it).
- No map embed in the reference; do not add one.

---

## 8. Investors (hub)

### Page setup
- **Name:** Investors. **URL:** `/investors`. Static.
- **SEO title:** `Investor Relations - BSE Listed | Kotyark Industries` [raw: `Investor Relations - BSE Listed`]
- **SEO description:** `Access SEBI filings, board meetings, financial statements & company policies for Kotyark Industries Limited. BSE listed biofuel company.`

### Section 1: Page hero
H1 `Investor Relations`; paragraph `Complete regulatory filings, financial statements, and governance documents for Kotyark Industries Limited (BSE Listed).`

### Section 2: Key metrics
`k-section`; **4-column** stat-card grid (investor variant: number sizes 24px, the CIN at 20px / line-height 1.2): `BSE Listed` / `Stock Exchange`; `L15149RJ2023PLC091598` / `CIN Number`; `SEBI Compliant` / `LODR Regulations`; `480K KL` / `Annual Capacity`. Animation: reveal. Responsive: tablet 2 columns; **mobile 1 column** with all numbers 24px.

### Sections 3 to 6: Category bands
The four bands are **one data-driven repeater**, not four hand-built sections. Page code: `import { init } from 'public/pages/investorsHub';` then `$w.onReady(() => init($w));` (page file of the static `/investors` page). The code reads `InvestorSections` ordered by `hubOrder`, groups the rows by `hubGroup` and fills the repeaters below. Set these IDs (identical to `wix/src/pages/README.md`):

| ID | Element type | Where | Class | Filled with |
|---|---|---|---|---|
| `#hubGroupsRepeater` | Repeater (outer) | Below the key-metrics section; one item per band | item Box `k-section` | one item per band, in this order: Regulatory Filings, Financial Statements, Corporate Governance, Other Filings (the `hubGroup` values) |
| `#groupTag` | Text | outer item, band header | `k-eyebrow` | the band tag (`Regulatory`, `Financial`, `Governance`, `Other`) |
| `#groupTitle` | Text (H2) | outer item, band header | `k-h2` | the band title |
| `#groupDescription` | Text | outer item, band header | `k-lead` | the band paragraph |
| `#sectionsRepeater` | Repeater (inner) | inside the outer item; 3-column grid, about 20px gap | none (grid is set in the editor) | one item per section in the band, by `hubOrder` |
| `#cardTitle` | Text (H4) | inner item | `k-h4` | `title` |
| `#cardDescription` | Text | inner item | `k-category-desc` | `description` |
| `#cardLink` | Button | inner item, stretched over the whole card (transparent, no visible label), or the card Box itself if your Studio version exposes `link` on it | none | link `/investors/{slug}` |
| `#loadingState` | Text or Box | top of the page | none | visible until data arrives; hidden by the code |
| `#errorState` | Box or Text, **hidden on load** | top of the page | none | shown on any failure |
| `#errorMessage` | Text (inside `#errorState`) | | none | the failure message |

The inner item Box (the card) carries class `k-category-card`; build the icon tile **k-category-card__icon** (40px, document icon) inside it. The repeater item cannot vary its icon or background per band (the code only sets text and link), so use the document icon on every card, and use a single band background: the reference alternates `k-section--alt` on bands 1 and 3, which a repeater cannot do without extra code. Set the repeaters' item counts and gaps in the editor (4 outer items; 4, 4, 4, 3 cards). Card titles and descriptions below are **verbatim from the reference hub** (they match the `title` and `description` columns of `wix/data/collections/InvestorSections.csv`, and differ slightly from the section pages' own intro text); the band tag, title and paragraph are set by the page code (`HUB_GROUPS` in `public/lib/investor.js`) with the wording shown for each band below, and a band with no sections is dropped. Every card links to `/investors/{slug}`, including `/investors/sebi-lodr`, which is the same dynamic page (section 10).

**Band 1.** Tag `Regulatory`; H2 `Regulatory Filings`; paragraph `Mandatory filings and disclosures as per SEBI Listing Obligations and Disclosure Requirements (LODR).`
| Title | Description | Link |
|---|---|---|
| Disclosure under Reg. 46 of SEBI (LODR) | Particulars as per SEBI (LODR) Regulations, 2015 — Regulation 46(2) website disclosures. | `/investors/sebi-lodr` |
| Board Meetings | Formal notices and outcomes of all board meetings as per SEBI LODR regulations. | `/investors/board-meetings` |
| Closing of Trading Window | Trading window closure notices for designated persons as per SEBI Insider Trading Regulations. | `/investors/closing-trading-window` |
| Misc Disclosure under SEBI | Corporate governance reports, compliance certificates, and miscellaneous SEBI disclosures. | `/investors/misc-sebi-disclosure` |

**Band 2.** Tag `Financial`; H2 `Financial Statements`; paragraph `Annual and quarterly financial reports, including audited statements and subsidiary financials.`
| Title | Description | Link |
|---|---|---|
| Annual General Meeting | AGM notices, minutes, annual reports, and related documentation. | `/investors/annual-general-meeting` |
| Extra Ordinary General Meeting | EOGM notices, minutes, and resolutions documentation. | `/investors/extra-ordinary-general-meetings` |
| Audited Financial Statements | Audited financial statements of subsidiary companies. | `/investors/audited-financial-statements` |
| Unpaid Dividend | Details of unpaid and unclaimed dividends for shareholders. | `/investors/unpaid-dividend` |

**Band 3.** Tag `Governance`; H2 `Corporate Governance`; paragraph `Company constitution, policies, and governance framework ensuring transparency and compliance.`
| Title | Description | Link |
|---|---|---|
| Company Policies | Full set of corporate policies governing operations and governance. | `/investors/company-policies` |
| Memorandum & Articles of Association | Founding documents defining the company's constitution and governance. | `/investors/moa-aoa` |
| Merger & Amalgamation | Documents related to merger and amalgamation proceedings. | `/investors/merger-and-amalgamation` |
| Migration To Main Board | Documents related to migration from BSE SME Platform to Main Board. | `/investors/migration-to-main-board` |

**Band 4.** Tag `Other`; H2 `Other Filings`; paragraph `Additional regulatory filings, postal ballots, and dispute resolution.`
| Title | Description | Link |
|---|---|---|
| Postal Ballot | Postal ballot notices, e-voting results, and scrutinizer reports. | `/investors/postal-ballot` |
| Integrated Filling | Consolidated view of governance and financial compliance filings. | `/investors/integrated-filling` |
| Smart ODR | Online Dispute Resolution portal for investor complaints. | `/investors/smart-odr` |

Animation: apply one native entrance animation to `#hubGroupsRepeater`. Band 4 has 3 cards in the 3-column grid (one row).

### Section 7: Contact CTA
`k-section k-section--alt`; `k-cta-band`: H2 `Investor Queries?`; paragraph `For any investor-related queries, please reach out to our compliance team.`; button `Contact Investor Relations →` -> `/contact` (`k-btn-primary k-btn-lg`).

---

## 9. Disclosure under Reg. 46 of SEBI (LODR)

**There is no separate static page.** `/investors/sebi-lodr` is the `sebi-lodr` row of `InvestorSections` served by the one dynamic page in section 10 (`layout = disclosures`). The code shows `#reg46Box` and collapses `#docsBox` for that row, so the hero, breadcrumb and sidebar are the same shell as every other section. Do **not** create a static page at `/investors/sebi-lodr` (it would shadow the dynamic one) and do not filter `sebi-lodr` out of the dataset. Build this section as the `#reg46Box` part of section 10's page.

### Page values (the `sebi-lodr` row)
- **URL:** `/investors/sebi-lodr` (generated from `slug`; unchanged from the reference). **Sidebar label:** `Disclosure under Reg. 46 of SEBI (LODR)`.
- **SEO title:** `Disclosure Under Reg. 46 of SEBI (LODR) | Kotyark Industries` [raw: `Disclosure Under Reg. 46 of SEBI (LODR)`]
- **SEO description:** `Particulars as per SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015 — Regulation 46(2) website disclosures for Kotyark Industries Limited.`
- **H1 / breadcrumb current:** `Disclosure Under Reg. 46 of SEBI (LODR)`. **Intro:** `Particulars as per SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015 — Regulation 46(2) for website disclosures by Kotyark Industries Limited.`
- Data: collection `Reg46Disclosures` (30 rows), imported from `wix/data/collections/Reg46Disclosures.csv`. That CSV is the single source for the rows (`srNo`, `particular`, `regulation`, `linkUrl`, `sortOrder`); it is not repeated here. Row order is A to Z, then ZA, with `L(i)` to `L(iv)` between K and M.

### `#reg46Box`: the disclosure table
A Box (**hidden on load**) inside the content column, below `#sectionIntro`, holding a repeater styled as a table (a Studio Repeater is preferred over the Table element, because the rows come from the CMS and need link cells; Wix's Table element cannot be bound to a collection that way):

| ID | Element type | Class | Purpose |
|---|---|---|---|
| `#reg46Box` | Box / Container, hidden on load | none | wraps the table; the code expands it when `layout = disclosures` |
| (header row) | Box with four Text cells `Sr. No.` / `Particulars` / `Regulation` / `Link` | `k-table-head` | fixed header row above the repeater (not a repeater item) |
| `#reg46Repeater` | Repeater, 4-column grid per item | item Box `k-table-row` | one item per `Reg46Disclosures` row |
| `#reg46SrNo` | Text (in item) | none | `srNo` |
| `#reg46Particular` | Text (in item) | none | `particular` |
| `#reg46Regulation` | Text (in item) | none | `regulation` |
| `#reg46Link` | Button (in item), label `View`, external-link icon | `k-table-link` | link = `linkUrl` (a site-relative path); collapsed by the code when `linkUrl` is blank |
| `#reg46Na` | Text (in item), em dash `—` | `k-text-muted` | shown instead of the button when `linkUrl` is blank (6 rows) |

- Link rule: `linkUrl` present -> `View` button to that path (same tab); blank -> `—` in muted colour. The reference status values (`Yes` / `NA`) are not displayed.
- **Responsive:** at <= 900px the table font becomes 0.82rem and cell padding 10px 12px (`k-table-head` / `k-table-row` do this in `global.css`). The reference screenshot at 390px shows the table forcing a **418px wide page** (horizontal overflow). On the Wix Mobile breakpoint either put the header row and repeater in a horizontally scrolling Box (editor setting) or, recommended, stack each row as a card (Sr. No. + regulation as a small line, particulars as the main text, link below).
- Animation: none on the table (the reference has none on investor sub pages).

---

## 10. Investor Section (dynamic page)

One **dynamic page** serves all **15** sections: the 14 document sections and SEBI LODR. It replaces the 15 section pages of the reference.

### Page setup
- **Page name:** Investor Section (InvestorSections). **Type:** **dynamic item page** on the `InvestorSections` collection. **URL pattern:** `/investors/{slug}` (Wix: prefix `investors`, field `slug`), so all 15 reference URLs resolve exactly as before. The static `/investors` hub page has no conflict with this prefix.
- **Dataset:** element ID `#dynamicDataset`, connected to `InvestorSections` (read-only). Turn on **Sitemap** for the page in its SEO settings so every section is listed.
- **Page code:** in the generated page file paste `import { init } from 'public/pages/investorSection';` then `$w.onReady(() => init($w));`.
- **Dynamic SEO:** from the collection fields `seoTitle` and `seoDescription` (Wix SEO panel dynamic-field pattern `{seoTitle} | Kotyark Industries`; the page code also sets them, see the notes below the table). Values per section are in the table below.
- Source of the values: `wix/data/collections/InvestorSections.csv` (generated from `wix/data/source/content-snapshot.json`).

### Layout (one shell for every section)
1. **Page hero** (`k-page-hero`) with a hand-built breadcrumb row: link `Investor Relations` -> `/investors` (14px, accent colour, class `k-text-accent`), separator `›` (Text, class `k-breadcrumb-sep`), then `#breadcrumbCurrent`. H1 is `#sectionTitle`.
2. **Two-column grid** (280px sidebar + 1fr content, 48px gap, top-aligned; set in the editor; at <= 900px one column, 24px gap, sidebar un-stuck and above the content): sidebar `k-sidebar` + content column.
3. **Sidebar** (Box `k-sidebar`; white card, 1px border, 16px radius, 24px padding; sticky at 100px from top on desktop): H3 `Investor Sections` (class `k-sidebar-title`) then `#sidebarRepeater` with a `#sidebarLink` Button per item, class `k-sidebar-link`. The code adds the plain class `active` to the current item's `#sidebarLink`; `global.css` styles `.k-sidebar-link.active` (green fill, white label), so no extra class is needed. Static fallback order and labels (these are the `title` and `sortOrder` of the `InvestorSections` rows with `visibleInMenu = true`):
  1. `Disclosure under Reg. 46 of SEBI (LODR)` -> `/investors/sebi-lodr`
  2. `Closing of Trading Window` -> `/investors/closing-trading-window`
  3. `Misc Disclosure under SEBI` -> `/investors/misc-sebi-disclosure`
  4. `Board Meetings` -> `/investors/board-meetings`
  5. `Audited Financial Statements` -> `/investors/audited-financial-statements`
  6. `Annual General Meeting` -> `/investors/annual-general-meeting`
  7. `Extra Ordinary General Meeting` -> `/investors/extra-ordinary-general-meetings`
  8. `Company Policies` -> `/investors/company-policies`
  9. `Merger & Amalgamation` -> `/investors/merger-and-amalgamation`
  10. `Migration To Main Board` -> `/investors/migration-to-main-board`
  11. `Smart ODR` -> `/investors/smart-odr`
  12. `Unpaid Dividend` -> `/investors/unpaid-dividend`
  13. `Postal Ballot` -> `/investors/postal-ballot`
  14. `Integrated Filling` -> `/investors/integrated-filling`
  15. `MOA - AOA` -> `/investors/moa-aoa`
4. **Content column** top to bottom:
   a. `#sectionIntro` (intro, secondary colour, 24px below; Smart ODR's extra block is part of its `introHtml`).
   b. `#docsBox` (documents UI, collapsed by the code for `sebi-lodr`) holding the FY groups and document rows, then the empty state.
   c. `#reg46Box` (hidden on load): the Reg. 46 table of section 9, shown only for `sebi-lodr`.
5. **Documents and FY grouping use nested repeaters, not interleaved rows.** `#docGroupsRepeater` (outer) has one item per FY group, newest first (for sections with `groupBy = none` there is exactly one group and its `#fyHeader` is collapsed). Inside each outer item: `#fyHeader` (the group title, e.g. `FY 2025-26`) above `#docsRepeater` (inner, the group's documents). Documents with no FY in an `fy` section go last under `Other documents`.
6. **Empty state:** `#emptyState` (Text, hidden on load) is expanded when a section has no published documents, and `#docGroupsRepeater` is collapsed. The reference shows placeholder tiles for four sections (see the table), but they have no CMS source and the Velo code has no hook for them, so they are not built. If the client wants them, add them as `InvestorDocuments` rows instead of static tiles (each `k-fy-card` tile = a `k-icon-box--round` calendar icon, an H3 title and one description line). The empty-state sentence is not in the reference: confirm its copy with the client.
7. **Loading and error:** `#loadingState` is visible until data arrives; `#errorState` (hidden on load) is shown on any failure with the message in `#errorMessage`.

### Element ID contract (identical to `wix/src/pages/README.md`)

| ID | Element type | Class | Purpose |
|---|---|---|---|
| `#dynamicDataset` | Dataset (InvestorSections) | none | current section |
| `#sectionTitle` | Text (H1) | `k-page-hero-title` | `pageHeading` (falls back to `title`) |
| `#breadcrumbCurrent` | Text | `k-on-dark-soft` | last breadcrumb crumb (same text as the H1) |
| `#sectionIntro` | Rich text | `k-body` | `introHtml`, set as HTML |
| `#loadingState` | any (Box or Text) | none | hidden when loaded |
| `#errorState` | Box or Text, hidden on load | none | shown on any failure |
| `#errorMessage` | Text (inside `#errorState`) | none | message |
| `#emptyState` | Text, hidden on load | `k-text-muted` | no published documents |
| `#docsBox` | Container | none | wraps the documents UI (collapsed for Reg. 46) |
| `#docGroupsRepeater` | Repeater (outer) | none | one item per FY group (or one group when `groupBy = none`) |
| `#fyHeader` | Text (in outer item) | `k-fy-header` | group title; collapsed when empty |
| `#docsRepeater` | Repeater (inner, inside the outer item) | none; item Box `k-doc-card`, 10px row gap | the group's documents |
| `#docTitle` | Text (in inner item) | **k-doc-card__title** | `title` |
| `#docDate` | Text (in inner item), optional | `k-text-muted` | formatted `documentDate`; collapsed when empty |
| `#docLink` | **Button** (in inner item), label `PDF` | `k-badge` | link = the uploaded `file` or the working `legacyUrl`; opens in a new tab; collapsed when the file is missing |
| `#docUpdating` | Text (in inner item), hidden on load | `k-badge k-badge--na` | `File being updated` (no link), shown instead of `#docLink` |
| `#sidebarRepeater` | Repeater | none | sections with `visibleInMenu`, by `sortOrder` |
| `#sidebarLink` | **Button** (in item) | `k-sidebar-link` | label + link; gets class `active` for the current section |
| `#reg46Box` | Container, hidden on load | none | wraps the Reg. 46 table (shown when `layout = disclosures`) |
| `#reg46Repeater` | Repeater (inside `#reg46Box`) | item Box `k-table-row` | table rows |
| `#reg46SrNo`, `#reg46Particular`, `#reg46Regulation` | Text (in item) | none | columns |
| `#reg46Link` | Button (in item), label `View` | `k-table-link` | link; collapsed when `linkUrl` is blank |
| `#reg46Na` | Text (in item) | `k-text-muted` | `—` shown when `linkUrl` is blank |

Document row (inner item Box `k-doc-card`; white card with border, 12px radius, flex with 16px gap): file icon tile **k-doc-card__icon**, `#docTitle`, the `#docLink` Button (`PDF`, the red pill of the reference's `PDF` badge) and an external-link arrow icon **k-doc-card__arrow** at the right. The code sets only the link and target on `#docLink` (a Button, so the whole row is not a link; the pill and title are what the visitor clicks, so keep them adjacent). Link targets live in the CMS (`legacyUrl`, or the uploaded `file`); never retype them, import from `wix/data/collections/InvestorDocuments.csv`. Collapsed-by-default (set "Hidden on load" in the editor): `#errorState`, `#emptyState`, `#docUpdating`, `#reg46Box`; `#loadingState` stays visible until data arrives; `#docsBox` can be visible.

Reference screenshots for this template: `investors-company-policies-*.jpg` (flat document list, 23 documents), `investors-board-meetings-*.jpg` (placeholder FY tiles) and `investors-sebi-lodr-*.jpg` (Reg. 46 table).

### Per-section values (15 sections, one dynamic page)

| # | Slug (URL `/investors/{slug}`) | H1 (`pageHeading`) | SEO title (`seoTitle`) | SEO description (`seoDescription`) | Intro paragraph (`introHtml`) | Grouping / extras (`groupBy`, `layout`) |
|---|---|---|---|---|---|---|
| 1 | `sebi-lodr` | Disclosure Under Reg. 46 of SEBI (LODR) | Disclosure Under Reg. 46 of SEBI (LODR) | Particulars as per SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015 — Regulation 46(2) website disclosures for Kotyark Industries Limited. | Particulars as per SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015 — Regulation 46(2) for website disclosures by Kotyark Industries Limited. | `layout = disclosures`: shows `#reg46Box` (section 9), hides `#docsBox` |
| 2 | `closing-trading-window` | Closing of Trading Window | Closing of Trading Window | Trading window closure notices for Kotyark Industries Limited as per SEBI Insider Trading Regulations. | Notices regarding closure of trading window for designated persons as per SEBI (Prohibition of Insider Trading) Regulations, 2015. | flat list |
| 3 | `misc-sebi-disclosure` | Misc Disclosure under SEBI | Misc Disclosure under SEBI | Miscellaneous disclosures under SEBI regulations for Kotyark Industries Limited including corporate governance reports, credit ratings, and newspaper publications. | Miscellaneous regulatory disclosures including corporate governance reports, secretarial compliance reports, and certificates filed as per SEBI regulations. | flat list |
| 4 | `board-meetings` | Board Meetings | Board Meetings | Board meeting notices, outcomes, and financial results for Kotyark Industries Limited across financial years. | Board meeting notices, outcomes, and financial results filed with BSE. Select a financial year to view related documents. | group by FY (`groupBy = fy`: `#docGroupsRepeater` > `#fyHeader`); reference placeholder tiles: FY 2025-26; FY 2024-25; FY 2023-24; FY 2022-23; FY 2021-22 |
| 5 | `audited-financial-statements` | Audited Financial Statements of Subsidiaries | Audited Financial Statements of Subsidiaries | Audited financial statements of subsidiary companies of Kotyark Industries Limited. | Audited financial statements of subsidiary companies as per Regulation 46(2)(l)(iv) of SEBI (LODR) Regulations, 2015. | group by FY (`groupBy = fy`: `#docGroupsRepeater` > `#fyHeader`); reference placeholder tiles: Kotyark Agro Pvt Ltd; Kotyark Bio Specialities Ltd; Semani Industries Ltd |
| 6 | `annual-general-meeting` | Annual General Meeting | Annual General Meeting | AGM notices, minutes, annual reports, and related documentation for Kotyark Industries Limited. | Annual General Meeting notices, minutes, annual reports, voting results, and related documentation as per the Companies Act, 2013. | flat list |
| 7 | `extra-ordinary-general-meetings` | Extra Ordinary General Meetings | Extra Ordinary General Meetings | Notices and outcomes of Extra Ordinary General Meetings held by Kotyark Industries Limited. | Notices, minutes, and voting results of Extra Ordinary General Meetings held by Kotyark Industries Limited. | group by FY (`groupBy = fy`: `#docGroupsRepeater` > `#fyHeader`); reference placeholder tiles: EOGM - January 2024; EOGM - September 2022 |
| 8 | `company-policies` | Company Policies | Company Policies | Corporate governance policies of Kotyark Industries Limited including Code of Conduct, Whistle Blower Policy, CSR Policy, and more. | Corporate governance policies adopted by Kotyark Industries Limited in compliance with the Companies Act, 2013 and SEBI (LODR) Regulations, 2015. | flat list |
| 9 | `merger-and-amalgamation` | Merger & Amalgamation | Merger & Amalgamation | Documents related to merger and amalgamation proceedings of Kotyark Industries Limited. | All documents related to the scheme of merger and amalgamation proceedings under the Companies Act, 2013 and applicable SEBI regulations. | flat list |
| 10 | `migration-to-main-board` | Migration To Main Board | Migration To Main Board | Documents related to migration from SME platform to Main Board of BSE for Kotyark Industries Limited. | Documents related to the migration of Kotyark Industries Limited from BSE SME Platform to the Main Board. | flat list |
| 11 | `smart-odr` | Smart ODR | Smart ODR | Online Dispute Resolution portal information for investors of Kotyark Industries Limited. | SEBI has introduced the Smart Online Dispute Resolution (ODR) portal to facilitate resolution of disputes between investors and listed companies. Investors can file complaints through the ODR mechanism. | extra HTML block (see below) |
| 12 | `unpaid-dividend` | Unpaid Dividend | Unpaid Dividend | Details of unpaid and unclaimed dividends for shareholders of Kotyark Industries Limited. | Details of unpaid and unclaimed dividends as per Section 124 of the Companies Act, 2013. Shareholders are requested to verify and claim their unpaid dividends. | flat list |
| 13 | `postal-ballot` | Postal Ballot | Postal Ballot | Postal ballot notices, voting results, and scrutinizer reports for Kotyark Industries Limited. | Postal ballot notices, e-voting results, and scrutinizer reports for resolutions passed through postal ballot mechanism. | flat list |
| 14 | `integrated-filling` | Integrated Filling | Integrated Filling | Integrated filings for governance and financial compliance by Kotyark Industries Limited. | Consolidated view of integrated filings made with regulatory authorities covering both governance and financial compliance. | group by FY (`groupBy = fy`: `#docGroupsRepeater` > `#fyHeader`); reference placeholder tiles: Governance & Compliance Filings; Financial & Annual Filings |
| 15 | `moa-aoa` | Memorandum & Articles of Association | Memorandum & Articles of Association (MOA - AOA) | Memorandum of Association and Articles of Association of Kotyark Industries Limited. | The Memorandum of Association (MOA) and Articles of Association (AOA) are the founding constitutional documents of Kotyark Industries Limited, defining the company's objectives, powers, and internal governance rules. | flat list |

Notes on the table:
- The **SEO title** shown is `seoTitle`; the reference renders it as `{seoTitle} | Kotyark Industries`. The page code also sets title, description, canonical and JSON-LD through `applySeo` from `seoTitle` / `seoDescription`, and appends ` | Kotyark Industries` itself (unless the title already names the brand), matching the reference. Confirm the rendered `<title>` in the Wix preview. Note the H1 and `seoTitle` differ from the sidebar label in places (for example `Audited Financial Statements of Subsidiaries`, `Extra Ordinary General Meetings`); use the CMS fields, do not reuse the sidebar label.
- Document counts in the snapshot: merger-and-amalgamation 26, company-policies 23, annual-general-meeting 18, misc-sebi-disclosure 12, closing-trading-window 11, postal-ballot 6, migration-to-main-board 4, unpaid-dividend 2, smart-odr 1, moa-aoa 1 (board-meetings, audited-financial-statements, extra-ordinary-general-meetings, integrated-filling have no documents yet and show `#emptyState`).
- **Smart ODR extra block** (the `introHtml` field already carries it in the CSV import, so `#sectionIntro` renders it): H3 `How to file a complaint?` then a numbered list: 1. `Visit the Smart ODR portal at smartodr.in` (link `https://smartodr.in`); 2. `Register as an investor/complainant`; 3. `Select the relevant market intermediary`; 4. `Submit your complaint with supporting documents`; 5. `Track the resolution progress online`. `#sectionIntro` must be a Rich text element (the code sets `.html`).
- Intros come from the table (`introHtml` in the CMS); the text is verbatim from the reference.
- Responsive: <= 900px sidebar stacks above content; document rows wrap titles.

---

## Elements with no clean Wix equivalent (summary)

| Reference element | Issue | Recommended Wix approach |
|---|---|---|
| Hero background with image at 40% opacity + 135 degree gradient overlay | Studio section backgrounds have one overlay colour/opacity, not a layered gradient over a faded image | Section background image + a full-size Box layer with `k-hero-overlay` (gradient via CSS in `global.css`) |
| `kotyark-carbon-badge` (pulsing ring) | Not native | Custom Element; duplicate its text as native hidden text for SEO |
| Count-up stat numbers (optional) | Not in the reference; Wix has no counter | Optional `kotyark-stat-counter` element |
| Scroll-reveal `fade-up` | Wix native entrance animation is close but not identical (no 15% threshold control) | Native entrance animations (preferred); or `k-reveal` from `global.css` (do not apply both) |
| Grouped (FY) document list | A repeater cannot group by itself | Nested repeaters driven by the Velo code: `#docGroupsRepeater` (one item per FY) > `#fyHeader` + `#docsRepeater` |
| Document table linked to CMS (SEBI) | Wix Table element is not CMS-bound | Repeater styled as a table (`#reg46Repeater`) |
| Footer current-year text | No dynamic year element | Static year or small code snippet |
| `Select a topic` placeholder option | Wix dropdown placeholder differs | Use the dropdown placeholder text, required field |
| Contact form submit | Reference form posts nowhere | Wix Forms + email notification; confirm recipient |
| Header glass blur, sticky scroll state | Limited backdrop-blur control | Studio sticky header + scroll effect + `k-header` class for the blur |
| SEBI LODR next to the 14 document sections | A static `/investors/sebi-lodr` page would shadow the dynamic page | No static page: `sebi-lodr` is a row of `InvestorSections` with `layout = disclosures`, shown through `#reg46Box` on the one dynamic page |
| Sidebar active-link state and sticky position | Sticky inside a grid cell is not guaranteed in Studio | Sticky container + the `active` class that Velo adds to `#sidebarLink` (styled by `.k-sidebar-link.active`) |
| Mobile SEBI table (418px overflow in reference) | Reference defect | Stacked row cards or a horizontally scrolling Box (editor setting) |
| Hub `Footer > Resources` links all point at `/investors` | Reference behaviour | Keep as is unless the client asks otherwise |

---

## Appendix A: Custom classes used (final names, checked against `wix/src/styles/global.css`)

`node wix/scripts/check-kit.mjs` fails if a class in a code span here or above is not defined in the stylesheet. Layout is not a class (column counts, gaps, grids, sticky, widths, logo size): set it in the editor. Card parts and modifiers use BEM suffixes (`__part`, `--modifier`); the checker validates names in code spans and in bold, `__` and `--` included. The one class Velo adds is the plain `active` (not `k-`): `.k-sidebar-link.active`.

Layout and text: `k-section`, `k-section--alt`, `k-container`, `k-split-image`, `k-section-header`, `k-eyebrow` [section-tag], `k-h2`, `k-h4`, `k-body`, `k-lead`, `k-text-accent`, `k-text-muted`, `k-on-dark-soft`.

Buttons: `k-btn-primary`, `k-btn-outline` [btn-secondary], `k-btn-outline-light`, `k-btn-sm`, `k-btn-lg`.

Header/footer: `k-header` [navbar], `k-header--scrolled` [navbar.scrolled], `k-menu` [navbar-nav], `k-menu-vertical`, `k-mobile-panel`, `k-mobile-overlay`, `k-footer`, `k-footer-heading` [footer h5], `k-footer-links`, `k-footer-bottom`.

Hero, page hero, trust: `k-hero`, `k-hero-bg`, `k-hero-overlay`, `k-hero-badge`, `k-hero-highlight` [highlight], `k-hero-subtitle`, `k-hero-actions`, `k-page-hero`, `k-page-hero-title`, `k-trust-bar`, `k-trust-item`, `k-icon-box--sm` [trust-icon], `k-trust-label`, `k-trust-sublabel`.

Cards: `k-stat-card`, `k-stat-number`, `k-stat-label`, `k-mini-stat`, `k-mini-stat-number`, `k-mini-stat-label` (new), `k-product-card`, **k-product-card__image**, **k-product-card__body**, **k-product-card__link**, `k-product-tag` (new), `k-feature-card`, `k-icon-box` [feature-icon], `k-benefit-card` [benefit-item], `k-benefit-check`, `k-person-card` [team-card], `k-person-photo` [team-photo], `k-person-role`, `k-person-bio`, `k-card-panel`, `k-card-panel-text` (new), `k-spec-table` (new), `k-cta-band` [cta-section].

Contact: `k-field` [form-group label/input], `k-form-success`, `k-form-success-icon` (new), `k-contact-card` [contact-info-card], **k-contact-card__icon** [contact-info-icon], `k-info-panel`, `k-info-panel-text`, `k-info-panel-heading`, `k-info-panel-green` (new).

Investors: `k-category-card`, **k-category-card__icon** [doc-icon], `k-category-desc`, `k-breadcrumb-sep`, `k-sidebar` [investor-sidebar], `k-sidebar-title`, `k-sidebar-link`, `k-doc-card`, **k-doc-card__icon**, **k-doc-card__title**, **k-doc-card__arrow**, `k-badge` [doc-card-badge, the `PDF` pill], `k-badge--na`, `k-fy-header`, `k-fy-card`, `k-icon-box--round` [fy-icon], `k-table-head`, `k-table-row`, `k-table-link` [compliance-link].

Motion: `k-reveal` [fade-up] (optional; the native entrance animation is preferred).

Classes marked "(new)" had no CSS class in the reference (their style was inline in the JSX) and were added to `global.css` from those values; see "Inline-styled patterns" in `wix/docs/design-system.md`.

## Appendix B: Image files to upload to Wix Media

| File (repo) | Used on | Alt text |
|---|---|---|
| `public/images/kotyark-logo.png` | Header, footer | `Kotyark Industries` |
| `public/images/hero-forest.jpg` | Home hero background | `Aerial view of lush green forest canopy representing renewable energy` |
| `public/images/biodiesel-cycle.png` | Home section 3; Biodiesel section 2 | Home: `Biodiesel production cycle infographic showing feedstocks, biofuel production, renewable fuel usage, and carbon dioxide absorption by biomass`; Biodiesel: `Biodiesel production cycle showing feedstocks, biofuel production, renewable fuel, and CO2 absorption` |
| `public/images/biodiesel-product.png` | Home and Products cards | `Premium B100 Biodiesel fuel` |
| `public/images/glycerin-product.png` | Home and Products cards | `Crude Glycerin by-product` |
| `public/images/save-planet.jpg` | Home section 7 | `Hands holding a globe made of recycled materials, representing environmental sustainability through biodiesel` |

Icons in the reference are inline SVGs (lucide/feather style); use Studio's vector icon library equivalents.
