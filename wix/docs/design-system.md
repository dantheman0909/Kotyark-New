# Kotyark design system for Wix Studio

Source of truth: the Next.js reference site (`src/app/globals.css`, referred to below as `G:<line>`).
Implementation: `wix/src/styles/global.css` (tokens + `k-` classes, no tag or ID selectors).

All custom classes are assigned in the editor (Inspector > CSS Classes) or from Velo with
`$w('#id').customClassList.add('k-...')`. A custom class lands on the **root** of the element; inner parts
are styled by Wix semantic classes (`.button__label`, `.rich-text__text`, `.table__cell`, ...).

Verify in the editor after publishing (preview and live): pseudo-elements (`::before`/`::after`),
`backdrop-filter`, `position: sticky`, `animation-timeline` and the doubled `.button.k-btn-*` specificity.
Wix says undocumented element structure can change, so only documented class names are used.

## 1. Theme setup

### Site Styles > Colors

Map the palette so native Wix elements (menus, forms, buttons you do not tag) match the tokens.
Hex values are from `G:8-41`.

| Wix theme slot | Hex | Token |
|---|---|---|
| Primary background (`--wst-color-fill-background-primary`) | `#FAFDF7` | `--k-bg-page` |
| Secondary background (`--wst-color-fill-background-secondary`) | `#F0F7F1` | `--k-bg-section-alt` |
| Lines and dividers (`--wst-color-line`) | `#D1E5D8` | `--k-border` |
| Title (`--wst-color-title`) | `#0D3B24` | `--k-primary` |
| Subtitle (`--wst-color-subtitle`) | `#3D5A48` | `--k-text-secondary` |
| Body text (`--wst-color-text-primary`) | `#0C1F13` | `--k-text-primary` |
| Secondary text (`--wst-color-text-secondary`) | `#6B8A78` | `--k-text-muted` |
| Links and actions (`--wst-color-action`) | `#1B5E3A` | `--k-primary-light` |
| Primary button fill / hover | `#D97706` / `#B45309` | `--k-accent` / `--k-accent-hover` |
| Primary button text | `#FFFFFF` | `--k-text-on-accent` |
| Secondary button border and text | `#0D3B24` | `--k-primary` |
| Base 1 / Base 2 | `#FFFFFF` / `#071A10` | `--k-bg-surface` / `--k-bg-hero` |
| Accent 1 / 2 / 3 / 4 | `#D97706` / `#2E8B57` / `#1B5E3A` / `#F0FFF4` | accent, primary-lighter, primary-light, text-on-dark |

Status colors (`#16A34A` success, `#0891B2` info) have no theme slot; they are used only in `global.css`.

### Site Styles > Fonts

`global.css` does not import fonts. Add both in Site Styles > Fonts (both are in the Google Fonts library,
so Wix hosts them):

| Theme style | Font | Weights | Size (from G:130-144, body G:105-116) |
|---|---|---|---|
| Heading 1 | Plus Jakarta Sans | 800 | 56px (fluid 36-56) |
| Heading 2 | Plus Jakarta Sans | 700 | 40px (fluid 28-40) |
| Heading 3 | Plus Jakarta Sans | 600 | 28px (fluid 22-28) |
| Heading 4 | Plus Jakarta Sans | 600 | 22px (fluid 18-22) |
| Paragraph 1 / 2 / 3 | Inter | 400 | 19 / 17 / 15px, line-height 1.65 |

The `k-` classes already set `font-family` through `--k-font-heading` and `--k-font-body`, so a text
element stays correct even if its theme style is left on the default. The theme exposes `--wst-font-style-h1` to `--wst-font-style-body-small`, but the docs do not say whether each
holds a full `font` shorthand or only a family, so this kit does not depend on them. Verify in the editor before
switching the two font tokens over to them.

## 2. Class catalog

`G:n` is a line in `src/app/globals.css`. "Text" means a Wix Text element, "Box" a Box or Container,
"Button" a native Wix Button.

### Typography

| Class | Apply to | Reproduces | Notes |
|---|---|---|---|
| `k-body` | Text | body, G:105-116 | 17px Inter, 1.65 |
| `k-h1` to `k-h4` | Text | h1-h4, G:130-144 | Fluid `clamp()` sizes, Plus Jakarta Sans. Use `k-h1` once per page |
| `k-eyebrow` | Text | `.section-tag`, G:980-989 | Orange uppercase label above a heading |
| `k-lead` | Text | `.section-header p`, G:995-998 | 17px secondary-colour intro paragraph |
| `k-text-sm` | Text | `.feature-card p`, G:828-832 | 15px card copy |
| `k-text-muted`, `k-text-accent`, `k-text-center` | Text | colour/align helpers | Combine with the classes above |
| `k-on-dark`, `k-on-dark-soft` | Text | `.section-dark h2`, G:200-203 | Light text on dark bands |
| `k-link` | Text | `a`, G:150-157 | Green link, orange on hover |

### Layout and sections

| Class | Apply to | Reproduces | Notes |
|---|---|---|---|
| `k-section` | Section | `.section`, G:187-189 | 96px vertical padding (64px below 1023px) |
| `k-section--alt` | Section | `.section-alt`, G:191-193 | Pale green background |
| `k-section--surface` | Section | `.trust-bar` background, G:663 | White |
| `k-section--dark` | Section | `.section-dark`, G:195-198 | Forces light text inside |
| `k-container`, `--wide`, `--narrow` | Box | `.container*`, G:169-185 | 1280 / 1440 / 768 max width. Prefer Studio's own grid where possible |
| `k-section-header` | Box | `.section-header`, G:972-978 | Centred, 700px max, 64px bottom margin |
| `k-trust-bar`, `k-trust-item`, `k-trust-label`, `k-trust-sublabel` | Box / Text | G:663-705 | Strip of 4 icon + label items |
| `k-split-image` | Image or Box | `.split-image`, G:947-951 | 24px radius, clipped |
| `k-divider` | Box / line | `--color-divider` | 1px rule |

### Buttons (native Wix Button)

| Class | Apply to | Reproduces | Notes |
|---|---|---|---|
| `k-btn-primary` | Button | `.btn-primary`, G:224-235 | Orange pill, lifts and glows on hover |
| `k-btn-outline` | Button | `.btn-secondary`, G:237-246 | Green outline, fills on hover |
| `k-btn-outline-light` | Button | `.btn-outline-light`, G:248-258 | For dark backgrounds |
| `k-btn-sm`, `k-btn-lg` | Button | `.btn-sm/.btn-lg`, G:260-267 | Add next to a colour class |
| `k-btn-link` | Button | `.product-card-link`, G:908-921 | Text-only orange "Learn more" |

Written as `.button.k-btn-*` with `.k-btn-* .button__label` so they beat the theme button style.
Set the button's own layout (width, alignment) in the editor.

### Header, menu, mobile menu

| Class | Apply to | Reproduces | Notes |
|---|---|---|---|
| `k-header` | Header | `.navbar`, G:273-291 | Glass blur, border, 16px radius. Floating offset (16px inset) is set in the editor |
| `k-header--scrolled` | Header | `.navbar.scrolled`, G:293-297 | Add from page code on scroll, or use Wix header scroll effects instead |
| `k-menu` | Horizontal menu | `.navbar-nav > li > a`, G:329-345 | Item hover tint and label colours |
| `k-menu-vertical` | Vertical menu | `.dropdown-menu a` and submenu, G:348-383 | Also styles `.vertical-menu__submenu` |
| `k-mobile-panel`, `k-mobile-overlay` | Box | `.mobile-nav`, G:401-426 | Slide-in behaviour belongs to Wix's mobile menu |

### Hero

| Class | Apply to | Reproduces | Notes |
|---|---|---|---|
| `k-hero` | Section | `.hero`, G:444-452 | Dark green base, full viewport height |
| `k-hero-bg` | Image / video layer | `.hero-bg`, G:454-460 | 40% opacity |
| `k-hero-overlay` | Box (full size, above bg) | `.hero-overlay`, G:462-471 | Diagonal green gradient |
| `k-overlay-bottom` | Box over an image | `.product-card-image::after`, G:884-893 | Bottom darkening for photo banners |
| `k-hero-content` | Box | `.hero-content`, G:473-479 | Centred, 900px max |
| `k-hero-badge` | Box or Text | `.hero-badge`, G:481-494 | Glass pill, orange text |
| `k-hero-title` | Text | `.hero h1`, G:496-503 | Up to 72px, white |
| `k-hero-highlight` | Text (separate element) | `.highlight`, G:505-510 | Orange gradient text. Wix rich text has no span class, so use a separate text element |
| `k-hero-subtitle` | Text | G:512-520 | 20px, 640px max |
| `k-hero-actions` | Box | G:522-527 | Button row, wraps |
| `k-hero-scroll` | Box / icon | `.hero-scroll`, G:529-547 | Bounce only; horizontal centring is done in the editor |
| `k-page-hero`, `k-page-hero-title`, `k-page-hero-text` | Section / Text | `.page-hero`, G:1246-1283 | Inner-page banner with radial glow |
| `k-carbon-badge`, `k-carbon-icon`, `k-carbon-title`, `k-carbon-subtitle` | Box / Text | G:553-633 (`CarbonCreditBadge.js`) | Floating glass card with pulsing ring; hidden on phones |

### Cards

| Class | Apply to | Reproduces | Notes |
|---|---|---|---|
| `k-card` | Box | shared surface | White, 1px border, 16px radius |
| `k-stat-card`, `k-stat-number`, `k-stat-label`, `k-stat-number--compact` | Box / Text | G:729-781 | Number up to 56px, lifts with green glow |
| `k-feature-card`, `k-feature-title` | Box / Text | G:793-832 | 48px padding |
| `k-icon-box`, `--sm`, `--round` | Box (holds icon/vector) | `.feature-icon`, `.trust-icon`, `.fy-icon`, G:807-821, 683-693 | 56px tile (48px, or circle) |
| `k-product-card`, `__image`, `__body`, `__link` | Box (repeater item) | G:858-921 | 24px radius; image gets a bottom gradient via `::after` |
| `k-person-card`, `k-person-photo`, `k-person-role`, `k-person-bio` | Box / Image / Text | `.team-*`, G:1092-1138 | Leadership. Photo is a 120px ringed circle |
| `k-category-card`, `k-category-card__icon`, `k-category-desc` | Box / Box (icon tile) / Text | `.category-card`, `.doc-icon`, G:1177-1186, 1204-1229, 1844-1868 | Investor hub tile; the 40px amber icon tile (`__icon`) turns green on hover |
| `k-benefit-card`, `k-benefit-check` | Box | G:1370-1403 | Check item |
| `k-contact-card`, `k-contact-card__icon` | Box / Box (icon tile) | `.contact-info-card`, `.contact-info-icon`, G:1333-1352 | Pale green panel with a 44px white icon tile |

### Bands

| Class | Apply to | Reproduces | Notes |
|---|---|---|---|
| `k-stats-band`, `k-stats-band--dark` | Section | `.stats-grid`, G:723-727 | Light or dark strip behind stat cards |
| `k-cta-band`, `k-cta-title`, `k-cta-text` | Box / Text | `.cta-section`, G:1004-1045 | Dark gradient, 24px radius, radial glow |

### Forms

| Class | Apply to | Reproduces | Notes |
|---|---|---|---|
| `k-field` | Text input / Text box | `.form-group`, G:1295-1331 | Label, border, radius, green focus ring |
| `k-field--glass` | Text input | `.newsletter-form input`, G:1060-1080 | Pill input on dark bands |

### Badges and chips

| Class | Apply to | Reproduces | Notes |
|---|---|---|---|
| `k-badge` | Box / Text / Button | `.doc-card-badge`, G:1697-1708 | Red uppercase pill (default). On a Button (the `PDF` pill is `#docLink`) the label is styled through `.button__label` |
| `k-badge--yes`, `--na`, `--cell` | same | `.badge-yes/.badge-na/.compliance-badge`, G:1767-1783 | Green "Yes", grey "NA", cell sizing |
| `k-badge--accent`, `--green` | same | derived tints | Not in the reference; extra palette-based chips |

### Breadcrumb

| Class | Apply to | Reproduces | Notes |
|---|---|---|---|
| `k-breadcrumb` | Breadcrumbs | `.investor-breadcrumb`, G:1546-1562 | Orange links |
| `k-breadcrumb--on-dark` | Breadcrumbs | G:1569-1572 | Dimmed light text for the current page |
| `k-breadcrumb-sep` | Text | `.investor-breadcrumb-sep`, G:1564-1567 | Only for a hand-built breadcrumb |

### Investor pages

| Class | Apply to | Reproduces | Notes |
|---|---|---|---|
| `k-sidebar`, `k-sidebar-title` | Box / Text | `.investor-sidebar`, G:1582-1599 | Sticky at 100px; static below 900px |
| (inside `k-sidebar`) | Vertical menu | `.investor-sidebar nav a`, G:1610-1624 | Items styled through `.vertical-menu__item*` |
| `k-sidebar-link`, `k-sidebar-link--active` | Button (`#sidebarLink` in the repeater item) | G:1610-1630 | For the repeater-built sidebar. The Velo code adds the plain class `active` (`customClassList.add('active')`), and `.k-sidebar-link.active` is styled the same as `--active` (green fill, white label), so no `k-` class is added from code |
| `k-doc-card`, `__icon`, `__title`, `__arrow` | Repeater item Box and children | `.doc-card`, G:1639-1722 | Hover slides 4px right, icon turns green, arrow appears. `k-badge` goes inside for the `PDF` pill (`#docLink`) |
| `k-doc-list`, `k-doc-row` | Box | `.doc-list/.doc-item`, G:1155-1192 | Plain list variant |
| `k-fy-header` | Text | derived from `.fy-card`, G:1803-1841 | Financial-year group heading with orange left bar. The reference has no separate FY header; this is new |
| `k-fy-card`, `k-fy-card-title`, `k-fy-card-text` | Box / Text | G:1803-1841 | Centred category tile |
| `k-table` | Wix Table | `.compliance-table`, G:1731-1765 | Green header row, divider rows, hover tint. Not used by the Reg. 46 table, which is a repeater (`k-table-head` + `k-table-row`) because it is CMS-bound |
| `k-table-head`, `k-table-row` | Repeater header / row Box | same | Use when the "table" is a repeater grid |
| `k-table-link` | Text / Button | `.compliance-link`, G:1785-1794 | Orange bold link |

### Inline-styled patterns (new)

These had no class in the reference: `src/**` wrote the values as inline `style` props. They are defined in `global.css` section 10b, with the JSX line cited in the CSS comment. Each is used by `wix/docs/page-build-spec.md`.

| Class | Apply to | Reference (inline style) | Notes |
|---|---|---|---|
| `k-mini-stat`, `k-mini-stat-number`, `k-mini-stat-label` | Box / Text / Text | `src/app/page.js:322-330` | 16px padding, pale green, 12px radius; number Plus Jakarta Sans 800 28px primary; label 14px muted |
| `k-product-tag` | Text / Box | `src/app/products/page.js:40-44` | Pill chip, 12px / 600, 4px 12px padding, pale green, primary text |
| `k-card-panel`, `k-card-panel-text` | Box / Text | `src/app/about/page.js:78-80` | Vision / Mission panel: white, 1px border, 16px radius, 48px padding; copy 18px / 1.7 |
| `k-spec-table` | Wix Table | `src/app/products/biodiesel/page.js:138-160` | Carries the 800px card frame itself; green header row, 15px rows, first column weight 500 |
| `k-form-success`, `k-form-success-icon` | Box / Box | `src/app/contact/page.js:43-48` | Success panel (48px 32px, pale green, 16px radius, centred) and the 64px check circle |
| `k-info-panel`, `k-info-panel-text` | Box / Text | `src/app/contact/page.js:146-153` | Company details: pale green, 1px border, 16px radius, 24px padding; copy 14px / 1.8 |
| `k-info-panel-green`, `k-info-panel-heading` | Box / Text | `src/app/contact/page.js:156-161` | 135deg primary to primary-light panel; copy at 80% light, heading white |

### Footer

| Class | Apply to | Reproduces | Notes |
|---|---|---|---|
| `k-footer` | Footer | `.footer`, G:1420-1424 | Deep green background |
| `k-footer-heading` | Text | `.footer h5`, G:1439-1445 | Uppercase column title |
| `k-footer-text` | Text | `.footer-brand p`, G:1433-1437 | Muted brand blurb |
| `k-footer-link` | Text / Button | `.footer-links a`, G:1454-1462 | Muted, orange on hover |
| `k-footer-links` | Vertical menu | same | Menu variant of the link list |
| `k-footer-bottom` | Box | `.footer-bottom`, G:1464-1472 | Top rule + copyright line |

### Motion

| Class | Apply to | Reproduces | Notes |
|---|---|---|---|
| `k-reveal`, `--delay-1/2/3` | Any | `.fade-up`, G:1494-1505 | Scroll-driven fade-up where `animation-timeline: view()` exists, otherwise plays once on load. **Preferred alternative: Wix native Entrance animation** (Animations panel > Entrance > Fade or Slide in, about 600ms, ease-out), which works in every browser and avoids the fallback. Do not apply both to the same element |
| `k-spinner` | Box | `.login-spinner`, G:2021-2032 | 20px loader |
| `@keyframes k-scroll-bounce, k-float, k-pulse, k-reveal-up, k-spin` | n/a | G:539, 625-633, 1494 | Used by the classes above |

`prefers-reduced-motion` turns the animations off, as in G:1507-1519.

## 3. Reference styles not ported

| Reference | Reason |
|---|---|
| Resets, `html`, `body`, `h1`-`h6`, `p`, `a`, `img` rules (G:91-163) | Tag selectors; Wix owns document styles. Equivalent set through theme fonts and colours |
| `.navbar` fixed positioning, `.navbar-nav` flex, `.dropdown-menu` hover logic, `.navbar-toggle` (G:273-426) | Wix header and menu elements implement these. Only skins are ported. Horizontal-menu submenu has no documented class, so it is styled in the editor |
| `.features-grid`, `.products-grid`, `.team-grid`, `.stats-grid`, `.category-grid`, `.benefits-grid`, `.footer-grid`, `.contact-grid`, `.fy-grid`, `.trust-bar-grid`, `.split`, `.investor-layout` column rules and their media queries | Layout is the editor's job (Studio grids / repeater columns per breakpoint). Placing them in CSS would fight the editor |
| `.login-*`, `.admin-*` (G:1895-2549) | The Next.js custom CMS and admin are not part of the Wix build |
| `.skip-link` (G:1525-1539) | Wix adds its own skip-to-content link |
| `page.module.css` | Unused create-next-app template; none of its classes are used |
| `.hero h1 .highlight` inside one heading | Rich text cannot carry a span class; `k-hero-highlight` works on a separate text element |
| `.hero-scroll` `translateX(-50%)` centring | Position is set in the editor; only the vertical bounce is kept |
| `.navbar.scrolled` | Wix handles it with header scroll effects; `k-header--scrolled` is optional |
| `.navbar-logo`, `.dropdown-menu` (as classes) | Logo size is set in the editor; a horizontal menu's dropdown has no documented class, so it is styled in the menu's design settings (`k-menu-vertical` skins a vertical menu and its submenu) |
| `.split`, `.contact-grid`, `.investor-layout`, `.compliance-table-wrap` | Layout: columns, gaps and a horizontally scrolling wrapper are editor settings |

## 4. What must be set in the editor

CSS cannot do these on Wix; configure them in Studio.

- **Layout grids and columns**: all multi-column arrangements (4-up trust bar and stats, 3-up features and team,
  2-up products, 4-column footer, 280px sidebar + content split, contact split) with the matching column counts at
  tablet and mobile breakpoints (reference breakpoints: 1023px, 639px, 900px for investor pages).
- **Section heights and widths**: hero `min-height: 100vh`, inner-page hero height, container max widths (1280px).
- **Header**: floating position and 16px inset, height 64px, logo sizing (44px tall, max 200px wide), mobile menu
  and its breakpoint (1023px), header-to-hamburger switch, scroll behaviour.
- **Menu structure**: top-level items, dropdown groups (About, Products, Investors) and their links, the CTA
  button in the header, the investor sidebar items, and the active-item state of a menu (style the menu's "selected" state in
  the editor; only `.vertical-menu__item` hover is in CSS). The investor sidebar is a repeater of Buttons, not a menu: its current item gets the class `active` from Velo, styled by `.k-sidebar-link.active`.
- **Image crops and fit**: product-card image 240px crop, 120px circular person photos, split images, hero
  background position and cover.
- **Repeaters**: item counts, row gaps (10px for doc cards, 20-24px for card grids), CMS bindings. Do not
  replace native repeaters for investor documents (SEO).
- **Icons**: vector icons inside `k-icon-box` and `k-doc-card__icon` come from Wix's icon library or uploaded SVGs.
- **Fonts and colours**: Site Styles (section 1).
- **Entrance animations**: the native alternative to `k-reveal`.
- **Sticky behaviour**: if `k-sidebar` does not stick, use the editor's pin/stick option.
- **Accessibility**: alt text, heading order (one H1 per page), focus order and ARIA labels.

## 5. Quick checklist for a new page

1. Section: add `k-section` (or `--alt`, `--dark`).
2. Heading block: `k-eyebrow` + `k-h2` + `k-lead` inside a `k-section-header` Box.
3. Cards: pick one card class and apply it to the repeater item Box.
4. Buttons: `k-btn-primary` / `k-btn-outline` (+ size) on native Wix Buttons.
5. Optional motion: native Entrance animation or `k-reveal`.
