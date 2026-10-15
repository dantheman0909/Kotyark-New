# Kotyark CMS: Admin Guide

For everyone who edits www.kotyark.com. Read once end to end; afterwards use the section you need.

**Admin portal:** `https://www.kotyark.com/admin` (you are sent to the login page if you are not signed in).

---

## 1. Roles: who can do what

| Capability | Owner | Editor | Compliance |
|---|:-:|:-:|:-:|
| Create and edit pages, save drafts | ✓ | ✓ |  |
| Publish / unpublish pages | ✓ | ✓ |  |
| Delete pages | ✓ |  |  |
| Upload, edit, replace, move documents; manage investor sections | ✓ |  | ✓ |
| Delete documents | ✓ |  | ✓ |
| Media library (images) | ✓ | ✓ | ✓ |
| Header / footer menus | ✓ | ✓ |  |
| Redirects | ✓ | ✓ |  |
| Pop-ups (create, design, publish, delete) | ✓ | ✓ |  |
| Site settings (company details, social, SEO defaults, GA4) | ✓ | read only | read only |
| Users | ✓ |  |  |
| Audit log | ✓ |  | ✓ |

- The sidebar shows only what your role can use. Opening a screen your role cannot use sends you back to the Dashboard.
- **Every change is recorded in the Audit log** with who, what, when and the before/after values.

## 2. Signing in

- Sign in with your own email and password. Accounts are never shared.
- After **5 wrong passwords in 15 minutes** the account is locked for 15 minutes. Wait, or ask an Owner to reset your password.
- **Locked out of every Owner account?** In the Replit Shell: `ADMIN_EMAIL=you@kotyark.com ADMIN_PASSWORD='new 12+ char password' npm run admin:reset`. It creates or resets that Owner, clears the lockout and is recorded in the Audit log.
- Change your own password from the user menu (top right). Changing it signs out your other sessions.
- Sessions last 12 hours.

## 3. Dashboard

Shows: published and draft pages, documents, **broken links**, active users, **Needs attention** (broken document links, drafts untouched for 14+ days) and, for Owner and Compliance, recent activity.

Start every session here. A non-zero broken-links count is a compliance item (see §6).

## 4. Pages

### 4.1 Drafts and live pages
- **Save draft** stores your work. **The live site does not change.**
- **Preview** opens the draft exactly as it will look. Preview links require sign-in and are hidden from search engines.
- **Publish** makes the current draft live, refreshes menus, the sitemap and site search, and stores a revision.
- After publishing, further edits show **Unpublished changes** until you publish again. Visitors keep seeing the last published version.
- **Unpublish** takes the page off the site (visitors get "not found").

> The original site pages (Home, About, Products, Biodiesel, Crude Glycerin, Contact, Investors, SEBI LODR) were imported as **drafts**. The current site keeps showing until you publish each one. Compare Preview against the live page, then publish one page at a time.

### 4.2 Create a page or sub-page
1. Pages → **New page** (top level) or **Add sub-page** on a row (child of that page).
2. Enter a title. The URL slug is generated (e.g. "Carbon Credits" → `/sustainability/carbon-credits`). You can edit it.
3. Add blocks (§4.3). **Publish is disabled until the page has at least one block.**
4. Fill the SEO panel (§7), Save draft, Preview, Publish.
5. To show it in the site menu, add it under **Navigation** (§5).

### 4.3 Blocks
A page is a stack of blocks. Add, reorder (↑ ↓), duplicate or delete them.

| Block | Use for |
|---|---|
| Hero | Page banner: heading, sub-heading, background image, up to 2 buttons |
| Rich text | Formatted copy: headings, bold, lists, links |
| Image + text | Image beside copy, image left or right, optional button |
| Stats | Key figures ("480,000 KL", "BSE Listed") |
| Card grid | 2–4 columns of cards: products, people, features. Cards take tags, a role line and a link |
| Call to action | Closing banner with one or two buttons |
| FAQ | Questions and answers (also marked up for Google rich results) |
| Document list | Documents from an investor section, optionally grouped by financial year |
| Compliance table | SEBI-style "particulars / regulation / link" table |
| Contact info | Addresses, phone, email, optional enquiry form |
| Embed | YouTube, Vimeo or Google Maps only |

Rules the system enforces:
- Required fields are checked on save; errors show on the block.
- Formatting is cleaned automatically; scripts and unsafe links are removed.
- Every image needs **alt text** (describe the image for screen readers and Google).
- Links must start with `/` (internal) or `https://`.

### 4.4 Changing a URL
Changing a published page's slug or moving it under another parent automatically creates **permanent redirects** from the old addresses, including all its sub-pages. Old links and Google rankings carry over. The editor warns you before saving.

### 4.5 History and restore
**History** lists every published revision. **Restore** copies an old version into the draft (the current draft is saved first as "Before restore"). Then Preview and Publish.

### 4.6 Delete
Owner only. Pages with sub-pages, and the Home page, cannot be deleted. Prefer **Unpublish** if you might need the page again.

## 5. Navigation
Navigation → Header or Footer.
- Add a CMS page (picker) or a custom link (`/path` or `https://…`).
- One level of sub-items (e.g. Products → Biodiesel).
- Footer: a top-level item with no link of its own becomes a column heading.
- **Save** publishes the menu immediately.

## 6. Investor documents (Compliance)

### 6.1 Sections
Documents → left panel: create, rename, hide, reorder or delete investor sections (e.g. Company Policies).
- **Renaming keeps the URL.** Changing the slug creates redirects.
- **Group by financial year** shows FY headings (Board Meetings, Audited Financial Statements…).
- A section with documents cannot be deleted. Move or delete the documents first.

### 6.2 Upload
1. Select the section, drag files onto the upload area (or click to choose). Several files at once is fine.
2. For each file set **Title**, **FY** (e.g. `FY 2025-26`) and **Date** (`YYYY-MM-DD`).
3. Upload. Accepted: PDF, DOCX, XLSX, PPTX, PNG, JPG, up to **25 MB** each. Larger uploads are refused before transfer completes.

What happens automatically:
- The document gets its own page `/investors/<section>/<document>` and a file link `/files/<document>.pdf` on kotyark.com. Both are listed in the sitemap for Google.
- Text inside the PDF is extracted for site search, and the first lines become the description if you leave it blank.
- A **warning** appears if the PDF has no readable text (usually a scanned image). It still publishes, but search will not find words inside it. Upload a text-based PDF when possible.

### 6.3 Replace a file
Row → **Replace file**. **The URL stays the same**, so links already shared with BSE, investors or in filings keep working.

### 6.4 Broken links
- **Check links** tests every document that still points at the old Wix site and has no uploaded file. Documents that already hold a file are skipped (they are served from our own storage).
- The result appears as a **Links needing attention** panel (amber while anything needs action, green when clean), not as an error. It is grouped by section and collapsed; the count beside each section is how many documents still need the original PDF. The panel and the amber counts beside folder names persist after a reload, so you do not need to re-run the check to see them.
- Per row: **Open** jumps to the section and highlights the row; **Replace file** uploads the original PDF right there. **Download CSV** exports section, title, old URL, status and HTTP code for the whole list.
- In a section, tick **Show only links needing attention** to hide everything else.
- **To fix:** upload the original PDF (Replace file). **The flag clears immediately; no re-check is needed**, and the dashboard count falls by one. The old URL is kept on the record and still redirects visitors to the file.
- Never delete a broken disclosure to make the count go away; the regulation requires the document to be available.

The remediation tracker from the migration (96 broken links at go-live) lists every affected document.

### 6.5 Move, edit, delete
Select rows → **Move** to another section (old URLs redirect). Edit title, FY, date, description or status (draft documents are not public). Delete removes the file permanently.

## 7. SEO (built in)
Every page and document gets title, description, canonical URL, social-share image, breadcrumbs and Google structured data automatically. To improve it:
- **Meta title** ≤ 60 characters, **meta description** 120–160 characters. Counters and a Google preview are in the SEO panel.
- **OG image**: the image shown when the page is shared on LinkedIn or WhatsApp.
- **No-index**: hides a page from Google (it stays reachable by link).
- Document descriptions: write one sentence on what the document is; it becomes the Google snippet.

## 8. Media library
Images only: PNG, JPG, WebP, GIF, up to 10 MB (SVG is blocked for security). Always fill **alt text**. An image used by a page or setting cannot be deleted until it is removed from that page.

## 9. Redirects
Most redirects are created automatically (§4.4, §6.1). Add one manually for old URLs from the previous site: **From** `/old-path` → **To** `/new-path`, type 301 (permanent). Loops are blocked.

## 10. Settings (Owner)
Company details (legal name, CIN, address, phone, investor email), social links, SEO defaults, and the **GA4 measurement ID** (`G-XXXXXXX`; analytics loads only when set).

## 11. Users (Owner)
Add users with a role and a temporary password (12+ characters); ask them to change it at first sign-in. Deactivating a user signs them out everywhere. You cannot demote or deactivate yourself or the last Owner.

## 12. Audit log (Owner, Compliance)
Filter by section, action, user and date. Expand a row for the before/after detail. Use it to answer "who changed this disclosure and when".

---

## 13. Pop-ups

Sidebar: **Pop-ups** (Owner, Editor). A pop-up is an on-brand announcement, offer or notice that appears on the public site. It does not change any page; it is a separate layer shown on top.

### 13.1 Create and publish
1. Pop-ups → **New pop-up**. Fill the four tabs (below), watching the **Live preview** on the right (Desktop / Mobile toggle).
2. **Save draft** keeps it off the site. **Publish** puts it live within seconds (the site refreshes automatically). **Unpublish** takes it down. Saving a *published* pop-up changes the live site immediately.
3. Leaving the editor with unsaved changes asks for confirmation. Every create, edit, publish and delete is in the Audit log.
4. **Duplicate** makes a draft copy (handy for a variant); **Delete** also removes its statistics.

### 13.2 Content tab
Eyebrow (small label), heading, body (the same formatting toolbar as pages), image, up to two buttons (a label and a link: `/page` on this site or `https://...`; nothing else is accepted), and the dismiss text (e.g. "No thanks"; empty = close button only). **Images are uploaded or picked from the Media library, and alt text is required** whenever an image is set. Image position: top, left, right or background.

### 13.3 Design tab
Preset (Brand green, Light, Dark, Amber, all from the site palette), layout (Modal, Slide-in, Top bar, Bottom bar, Full screen), slide-in corner, width, corner radius, button style (solid / outline), animation (fade, slide, zoom, none) and overlay darkness. Colour pickers for background, text and accent override the preset; type a hex such as `#0d3b24` or use **Reset** to return to the preset. Heading and body fonts default to the site fonts. Animation is switched off automatically for visitors who prefer reduced motion.

On phones, modals and slide-ins appear as a **bottom sheet** (full-width card at the bottom); only **Full screen** takes the whole screen.

### 13.4 Custom CSS tab (optional)
For small visual touches the Design tab cannot do (letter-spacing, a gradient button, a hover colour). Custom CSS is an **allowlist**: only the constructs below are applied; everything else is removed and explained in a note under the editor. Every rule is automatically limited to this pop-up.
- **Classes you can style:** `.kp-dialog`, `.kp-eyebrow`, `.kp-heading`, `.kp-body`, `.kp-image`, `.kp-cta`, `.kp-cta--secondary`, `.kp-actions`, `.kp-content`, `.kp-dismiss`.
- **The close button cannot be styled.** Its look and size are fixed so visitors can always close the pop-up.
- **States and pseudo-elements:** `:hover`, `:focus`, `:focus-visible`, `:active`, `:first-child`, `:last-child`; `::before`, `::after`, `::placeholder`. Inside `.kp-body` you can also style `a p strong em ul ol li h2 h3 h4` (for example `.kp-body a:hover`).
- **Selectors:** each selector is made of those classes, joined only by a space or `>`. Not allowed: `+`, `~`, a selector starting with a combinator, `:not` / `:is` / `:where` / `:has`, attribute selectors, `#id`, `*`, `body` / `html` / `:root` / `.kp-root`.
- **Properties:** colour and background (`background-image` only a gradient or `url(/media/<image id>)` from the Media library), `opacity`; borders, `border-radius`, outline; `box-shadow`, `text-shadow`, `filter` / `backdrop-filter` (blur, brightness, contrast, grayscale, saturate, drop-shadow); font size, weight, style, line-height, letter/word spacing, alignment, transform-case, text-decoration; `padding`; `margin` (no negative values, at most 64px / 4rem / 4em per side); `gap`; `max-width` (up to 100%); `object-fit`, `object-position`, `aspect-ratio`; `transition` and `animation`; `cursor` (keywords); `font-family` (Plus Jakarta Sans, Inter, system-ui, sans-serif, serif only). `content` works only on `::before` / `::after` with a plain quoted string. `!important` is stripped.
- **At-rules:** `@media` (width, orientation, prefers-reduced-motion, prefers-color-scheme or hover conditions, one level, e.g. `@media (max-width: 600px)`) and `@keyframes` (lower-case letters, digits and hyphens; an `animation` may only use a `@keyframes` you define here). Everything else (`@import`, `@font-face`, `@supports`...) is removed. The editor's mobile preview does not apply `@media (max-width)`, because it simulates a phone on a wide screen; check phone styles on a real phone.
- **Never allowed:** `position`, `top` / `right` / `bottom` / `left` / `inset`, `z-index`, `width`, `height`, `min-*`, `transform` / `translate` / `scale` / `rotate`, `display`, `visibility`, `overflow`, `pointer-events`, `clip-path`, `mask`, custom properties (`--x`), vendor-prefixed properties, remote `url()`. Where a pop-up sits and how large it is come only from the Design tab, and the pop-up is clipped to its own box, so Custom CSS cannot cover or move anything on the page.
- A `</style` or `<!--` anywhere, a syntax error or more than 10 KB rejects the save. The grey box under the editor shows the exact CSS that is used.

### 13.5 Display rules tab
- **Trigger:** on page load, after N seconds, after scrolling N %, or exit intent (mouse leaves the top of the window; desktop only).
- **Show on pages / Never show on pages:** one path per line, `*` matches anything. `/` is the home page only; `/products/*` is every product page; `/investors/*` all investor pages. Empty "Show on pages" = every page. "Never show" always wins. Pop-ups never appear in `/admin`, `/login` or previews.
- **Devices:** all, desktop only or mobile only (mobile = up to 767 px wide).
- **Publish is refused** (error shown in the editor, API answers 400) for a **Full screen** pop-up that is visible on mobile (Devices = All or Mobile) and opens on page load or after less than 3 seconds. Delay it 3 seconds or more, choose another layout, or set Devices to Desktop. Other search-ranking concerns stay as warnings.
- **Frequency:** every page load; once per browser session; once every N days; once ever. Stored in the visitor's browser, so clearing it or using a new browser shows the pop-up again.
- **Schedule:** start and end as `YYYY-MM-DD HH:mm` in India time (empty = no limit). Outside the window the pop-up is not shown even if published.
- **Priority:** if several pop-ups match a page, only the one with the highest number is shown.

### 13.6 Search-engine guidance
Google can demote pages whose content is covered by a full-screen or large pop-up straight after a visitor arrives from search, especially on mobile. **Publishing is refused** when a pop-up visible on mobile is a **Modal or Full screen** that opens on page load, on scroll, or within 3 seconds (a scroll trigger never fires on pages too short to scroll). Prefer a **slide-in or bar**, a delay of 5 seconds or more, or desktop only. New pop-ups default to a 5-second delay slide-in. Always give visitors an easy way to close it (the close button and Esc are built in).

### 13.7 Statistics
The list shows, for the last 30 days (India calendar days), **views** (pop-up shown), **clicks** (a button pressed) and **CTR** (clicks / views). Counts are approximate (ad blockers and bots) and are only recorded while a pop-up is published.

## Go-live checklist (Owner)
1. Replit: PostgreSQL database added; App Storage bucket created (default bucket already set in `.replit`); secrets `ADMIN_EMAIL`, `ADMIN_PASSWORD` (12+ chars), `SITE_URL=https://www.kotyark.com` set.
2. Deploy. The deployment runs database migrations automatically before starting.
3. In the Replit shell, once: `npm run migrate:content` (imports sections, documents, draft pages, menus, settings), then `npm run audit:links`.
4. Optional: `npm run migrate:content -- --ingest` copies the working Wix PDFs into App Storage.
5. Sign in, create named accounts for each editor and compliance user.
6. Preview and publish the imported pages one at a time.
7. Work the broken-links list to zero.
8. Settings: add the GA4 ID; check company details.
9. Submit `https://www.kotyark.com/sitemap.xml` in Google Search Console.
