# Wix Studio custom elements and native-vs-custom decisions

Source of truth for the reference behaviour: `src/components/*`, `src/app/page.js`, `src/app/globals.css`.
Elements live in `wix/src/public/custom-elements/`. Visual test page: `wix/test/custom-elements.html`.

## Plan requirement (applies to every custom element)

Custom elements run only on a site with a **Premium plan, a connected own domain and no Wix ads**.
They do not render on a free or ad-carrying site. Their content is rendered client-side, so a crawler
without JavaScript sees nothing unless you fill the element's **SEO markup** field with the text given
below. Elements use no Velo APIs: data goes in via attributes, events come out as DOM events.

## Decision summary

| Interactive piece (reference) | Decision | Why |
|---|---|---|
| Hero "First Indian Company to receive Verra Carbon Credits" glass badge (float and pulse loops, blur) | **Custom element** `kotyark-carbon-badge` | Two combined infinite animations plus a pulse ring and backdrop blur cannot be made with one native element |
| Stat cards (480K, 210, 86%, Zero; About; Glycerin; Investors) | **Custom element** `kotyark-stat-counter` | Count-up on scroll has no native equivalent in Wix Studio |
| Scroll reveal (`ScrollReveal`, class `fade-up`) | **Native** entrance animation | See table below |
| Biodiesel production cycle (`/images/biodiesel-cycle.png`) | **Native image** | It is a static PNG in the reference, not an interactive visual; keep its alt text |
| Hero scroll-down chevron (bouncing) | **Native** looping animation | One icon, one loop |
| Navbar (glass bar, scrolled state, Products dropdown, mobile slide-in menu) | **Native** Studio header and menu | Native menus are SSR, accessible and indexed |
| Card hover lift/glow (stat, feature, product, document cards) | **Native** hover state | Studio hover interactions |
| Contact form (name, email, phone, company, subject select, message, thank-you state) | **Native** Wix Forms | Submissions land in Wix; no custom code |
| Investor documents, SEBI table | **Native** repeaters on CMS | Must be SSR and indexable (see CLAUDE.md) |

## Elements

### 1. `kotyark-carbon-badge`

File: `wix/src/public/custom-elements/kotyark-carbon-badge.js` (about 5.0 KB).

**Purpose.** The glass badge at the bottom right of the home hero: amber leaf icon, uppercase title,
amber highlighted subtitle, 6 s float loop and 3 s pulse ring.

**Add it in Wix Studio**
1. Open the Home page. Add Elements, Embed & Social, Custom Element.
2. In the element's settings choose "Choose source", then "Velo file", and pick `kotyark-carbon-badge.js`.
3. Tag name: `kotyark-carbon-badge`.
4. Place it inside the hero section, anchor bottom right, 40 px from the edges, size about 360 x 112 px
   (the element has 12 px of inner room for the float and pulse ring). Layer it above the overlay.
5. Breakpoints: tablet (below 1024 px) place it centred under the hero buttons, width 90%, max 400 px;
   mobile (below 640 px) hide it (the reference hides it).
6. In the element's SEO settings paste the markup below.

**Attributes**

| Attribute | Type | Default |
|---|---|---|
| `title` | text | `First Indian Company` |
| `prefix` | text | `to receive` |
| `highlight` | text | `Verra Carbon Credits` |
| `animate` | `true` / `false` | `true` (always off under reduced motion) |

**Events:** `ready` (fired once rendered).

**Velo**
```js
$w.onReady(() => {
  $w('#carbonBadge').setAttribute('highlight', 'Verra Carbon Credits');
  $w('#carbonBadge').on('ready', () => console.log('badge ready'));
});
```

**SEO markup**
```html
<p>First Indian Company to receive Verra Carbon Credits</p>
```

### 2. `kotyark-stat-counter`

File: `wix/src/public/custom-elements/kotyark-stat-counter.js` (about 7.4 KB).

**Purpose.** One stat card (white card, green border, number in Plus Jakarta Sans 800, caption below).
The number counts up from 0 once, when 30% of the card scrolls into view. The final value is the attribute,
so the SEO markup can carry it. Values without a clean number ("Zero", "BSE Listed",
"L15149RJ2023PLC091598") render as static text.

**Add it in Wix Studio**
1. Add Elements, Embed & Social, Custom Element. Source: Velo file, `kotyark-stat-counter.js`.
   Tag name: `kotyark-stat-counter`.
2. Set `value` and `label` (see table below), size the element about 260 x 150 px, Fill width within its
   grid cell. Duplicate the element per card (copies keep the source; change the attributes).
3. Paste the SEO markup for each card.

**Attributes**

| Attribute | Type | Default | Notes |
|---|---|---|---|
| `value` | text | empty | Final value as displayed: `480K`, `210`, `86%`, `~10%`, `1,250.5`, `Zero` |
| `label` | text | empty | Caption, e.g. `KL Annual Capacity` |
| `duration` | ms | `1600` | Count-up time |
| `delay` | ms | `0` | Wait after the card enters view; use 150 steps to stagger a row |
| `number-size` | CSS size | empty | Empty = `clamp(36px, 4vw, 56px)` (Home). About and Glycerin use `36px`; Investors `24px` (CIN `20px`) |
| `animate` | `true` / `false` | `true` | `false` shows the final value at once |

**Events:** `countstart`, `countend` (both `event.detail.value`).

**Cards used by the reference**

| Page | value | label | number-size |
|---|---|---|---|
| Home | `480K` / `210` / `86%` / `Zero` | KL Annual Capacity / KL/Day Production / Less GHG Emissions / Discharge Facilities | default |
| About | `480K` / `210` / `2` / `Zero` | KL Annual Capacity / KL Daily Output / Manufacturing Plants / Discharge Facilities | `36px` |
| Crude Glycerin | `210` / `~10%` | KL/Day Biodiesel Capacity (glycerin proportional) / Glycerin yield per biodiesel batch | `36px` |
| Investors | `BSE Listed` / `L15149RJ2023PLC091598` / `SEBI Compliant` / `480K KL` | Stock Exchange / CIN Number / LODR Regulations / Annual Capacity | `24px`, CIN `20px` |

Investors cards are text-like; use native text boxes there if you prefer SEO from native text (the
element renders them statically anyway).

**Velo**
```js
$w.onReady(() => {
  $w('#statCapacity').setAttribute('value', '480K');
  $w('#statCapacity').setAttribute('label', 'KL Annual Capacity');
  $w('#statCapacity').on('countend', (e) => console.log('done', e.detail.value));
});
```
Setting a new `value` after the card has been seen re-runs the count.

**SEO markup** (one per card, value then label)
```html
<p>480K KL Annual Capacity</p>
```

## Native instead: exact Wix Studio settings

Wix Studio's panel labels can differ slightly by editor version; the values below are the closest match
to the reference CSS (`.fade-up`: opacity 0 to 1 and translateY 24px to 0, 600 ms, `cubic-bezier(0.4, 0, 0.2, 1)`;
trigger: IntersectionObserver threshold 0.15, rootMargin bottom -40px, once).

| Piece | Studio setting |
|---|---|
| Every `ScrollReveal` block (section headers, split blocks, grids, CTA card, doc grids) | Select the container (not each child). Animations, Entrance, **Float In**, direction **From bottom**, distance short (about 24 px; use the smallest preset), duration **0.6 s**, delay **0 s**, easing **Ease out**, trigger **On scroll into view** (plays once). Where the reference wraps a header and a grid separately, animate each container separately |
| Sequential cards in one grid (optional polish, the reference reveals the grid as one block) | Keep as one block to match; if staggering, 0.1 s steps |
| Reduced motion | Wix honours the visitor's `prefers-reduced-motion` for entrance animations; nothing to set |
| Hero scroll chevron | Select the icon. Animations, Looping, **Bounce** (or Float if Bounce is absent), speed about 2 s, vertical travel about 8 px, loop forever |
| Card hover (stat, feature, product): lift 4 px, green glow, border to `#2e8b57` | Studio hover interaction on the card: Move up 4 px, 0.3 s, ease, border colour `#2e8b57`, shadow `0 0 32px rgba(46,139,87,0.15)` |
| Biodiesel cycle infographic | Image element with `biodiesel-cycle.png`, full width of its split column, keep the reference alt text |
| Navbar scrolled state (glass bar, top 16 px to 8 px after 40 px) | Header Scroll effect: shrink/sticky with the white 92% fill; Products submenu as a native dropdown; mobile uses the Studio hamburger menu (slide-in) |
| Contact form | Wix Forms with fields Full Name*, Email Address*, Phone Number, Company Name, Subject* (dropdown: Biodiesel Supply Enquiry, Crude Glycerin Enquiry, Partnership / Distribution, Investor Relations, Careers, Other), Message*; success message "Thank You! Your message has been received. Our team will get back to you within 24 business hours." |

## Testing

Open `wix/test/custom-elements.html` in a browser (no server needed). Screenshots from the build are in
`attached_assets/_scratch/wix-ce/`. In the live editor, preview mode or the published site is required
for custom elements to render.
