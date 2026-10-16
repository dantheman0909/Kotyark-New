# Kotyark Website + CMS

## Overview
Kotyark Industries corporate website (India's biodiesel manufacturer, BSE listed) with a built-in CMS:
admins sign in at `/admin` to create pages and sub-pages from blocks, publish investor documents,
manage menus, redirects, media, settings and users. Every change is audited.

## Architecture
- **Framework:** Next.js 16 (App Router), React 19, JavaScript. Port 5000.
- **Database:** Replit PostgreSQL via `pg` (`src/lib/db.js`). Schema in `src/lib/migrations/*.sql`,
  applied by `npm run migrate` (also run automatically by the deployment before `npm run start`).
- **Files:** Replit App Storage (`src/lib/storage.js`) on the deployment; local `.storage/` in the dev
  workspace (override with `STORAGE_DRIVER`). Uploads are never written to `/public`.
- **Auth:** per-user email/password (bcrypt), hashed session tokens in Postgres, roles
  owner / editor / compliance (`PERMISSIONS` in `src/lib/auth.js`), login rate limiting.
  `src/proxy.js` only redirects signed-out visitors away from `/admin`; every route checks permissions.
- **Rendering:** DB-backed routes are dynamic (no DB access at build time).
- **Public site (2026 redesign):** Home, Products (+ Biodiesel, Crude Glycerin), About, Investors hub, filing and
  document pages, SEBI LODR and Contact are server components in `src/components/site/`, styled by shared tokens and
  primitives in `site.css` (`kd-` prefixed classes, `:where(.kd-site)` element defaults) plus per-area CSS modules.
  `Navbar` (with the NSE ticker pill) and `Footer` (CTA band) live in `src/components/`. The Motion engine
  (`site/Motion.js`) is driven by data attributes in the markup (`data-reveal`, `data-delay`, `data-line`, `data-vline`,
  `data-count`, `data-pad`, `data-kin`, `data-strike`); hidden initial states are applied after hydration, so the server
  HTML is complete for crawlers and no-JS visitors, and `prefers-reduced-motion` skips it. `CmsOrLegacy`
  (`components/blocks/PageView.js`) is unchanged: a published CMS page still overrides the route (rendered inside the
  new chrome, navbar solid); otherwise the redesigned page shows. The old `components/legacy/*` pages are removed.
- **Share price:** `src/lib/stock.js` reads Yahoo Finance's keyless chart endpoint for `KOTYARK.NS` (fixed host and
  ranges 1M/6M/1Y/ALL, no user input in the URL). Stale-while-revalidate in process memory: quote cached 60 s, history
  30 min, a failed fetch backs off 30 s, a cold-cache caller waits at most 1.5 s, and the last good live quote is served
  for up to 15 min after failures. Beyond that (or on any failure) the quote is the `stock_quote` site setting
  (admin "Stock quote fallback", change and % derived from price and previous close) over built-in figures, with
  `source: 'manual'`. `getQuote`/`getHistory` never throw. `STOCK_YAHOO_URL` overrides the Yahoo URL for development
  testing only and is ignored on a Replit deployment (`REPLIT_DEPLOYMENT` set). Public JSON at `/api/stock?range=`.
- **Enquiries:** `POST /api/contact` (public; JSON only, 20 KB stream-capped body, per-IP limit of 5 per 10 minutes via
  `ipFromHeaders` / `TRUSTED_PROXY_HOPS`, honeypot field and render-to-submit time under 3 s are filed as `spam` while
  the visitor still gets 200) writes to `enquiries`. The inbox is `/admin/enquiries` (`/api/enquiries`, `[id]` for
  status/note PATCH and owner-only DELETE, `/export` for CSV, which is audited).
- **SEO and LLM discovery:** Corporation, Product, Place and WebPage JSON-LD; `/llms.txt` and `/llms-full.txt`
  (`lib/llms.js`, `lib/site-content.js`); explicit AI-crawler groups in `robots.js`; `lib/indexnow.js` pings IndexNow
  only on changes to public content (key at `/indexnow-key.txt`); per-route `opengraph-image` files (dynamic cards for
  investor sections and documents via `lib/og-dynamic.js`, cached in a small LRU); icons and `/manifest.webmanifest`.

### Content model
| Table | Purpose |
|---|---|
| `pages` + `page_revisions` | Block-based pages and sub-pages. The row holds the draft; the latest `Published` revision is live. `live_*` columns feed search and the sitemap. |
| `document_folders` + `documents` | Investor sections (with a `category` of Regulatory / Financial / Governance / Other that drives the Investors hub filter chips) and documents (file in App Storage or legacy external URL), PDF text for search, link-check status |
| `popups` + `popup_stats` | On-brand pop-ups: content/design/rules as JSON, raw author CSS plus the postcss-scoped CSS that is the only CSS rendered; per-day views/clicks/dismissals. Active ones load in `LayoutShell` (path-filtered via the `x-kp-path` header set in `src/proxy.js`), shown by `PopupHost`; the shared renderer is `components/popups/Popup.js` |
| `nav_items`, `redirects`, `site_settings`, `media` | Menus, 301s, company/SEO/GA4 settings, images |
| `enquiries` | Contact-form submissions: status `new` / `handled` / `spam`, internal note, handler, optional `ip_hash` (only when `ENQUIRY_PEPPER` is set) |
| `users`, `sessions`, `login_attempts`, `audit_log` | Access control and audit trail |

### Key routes
- Public: `/`, `/about`, `/products/*`, `/contact` (CMS page if published, else the redesigned page),
  `/[...slug]` (CMS pages), `/investors`, `/investors/[section]`, `/investors/[section]/[doc]`,
  `/investors/sebi-lodr`, `/files/<doc>.pdf`, `/media/<id>`, `/search`, `/sitemap.xml`, `/robots.txt`, `/llms.txt`,
  `/llms-full.txt`, `/indexnow-key.txt` (404 unless `INDEXNOW_KEY` is set), `/manifest.webmanifest`, and `opengraph-image`
  routes for `/`, `/about`, `/contact`, `/products` (+ biodiesel, crude-glycerin), `/investors`, `/investors/sebi-lodr`,
  `/investors/[section]` and `/investors/[section]/[doc]`.
- Admin: `/admin` (dashboard), `/admin/{pages,documents,enquiries,media,navigation,redirects,popups,settings,users,audit}`,
  `/preview/<token>` (signed-in only, noindex).
- API: `/api/{auth,pages,documents,folders,media,nav,redirects,popups,settings,users,audit,dashboard,search,enquiries,stock,contact}`
  (`stock` and `contact` are public).
- Migrations: `001` init, `002` live search columns, `003` stored link status, `004` popups, `005` folder category,
  `006` enquiries.
- Permissions: `enquiries:read` and `enquiries:write` for owner, editor and compliance; `enquiries:delete` for owner.

### Directory structure
- `src/app/` routes · `src/components/site/` redesigned public pages, `site.css` tokens, Motion engine · `src/components/blocks/` block renderers · `src/components/admin/` admin shell + UI
- `src/lib/` shared modules (db, auth, audit, storage, seo, search, pages, documents, stock, enquiries, indexnow, llms, blocks/schemas)
- `scripts/` migrate, content migration, live-site investor sync, link audit, SEO verification · `docs/` admin guide, migration notes

## Configuration (Replit Secrets)
| Secret | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Provided by the Replit PostgreSQL integration |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | first boot | Creates the first Owner when no users exist (password 12+ chars) |
| `SITE_URL` | yes | `https://www.kotyark.com` (canonical URLs, sitemap) |
| `INDEXNOW_KEY` | optional | 8-128 letters/digits/dashes. When set in a production deployment, publishing, unpublishing, moving or deleting a page or document that is (or was) public pings IndexNow; drafts, hidden folders and nav saves never do (Bing and partners). The key is served at `/indexnow-key.txt` |
| `TRUSTED_PROXY_HOPS` | optional (default 1) | Number of trusted reverse proxies in front of the app. The client IP (login throttling, audit log, contact-form rate limit) is the `X-Forwarded-For` entry that many positions from the right, clamped to the list, falling back to `x-real-ip`. On first use in production the app logs `[net] x-forwarded-for has N entries; using hop H` (counts only, never IPs): check that line after deploying and raise the value only if the real client sits further left |
| `ENQUIRY_PEPPER` | optional | Secret key for the `ip_hash` stored with contact enquiries (HMAC-SHA256 of the IP). When unset, no `ip_hash` is stored (NULL): there is no built-in default |
| `STOCK_YAHOO_URL` | development only | Replaces the Yahoo chart URL to simulate a dead or slow feed; ignored when `REPLIT_DEPLOYMENT` is set |
| `REPLIT_BUCKET_ID` | optional | Overrides the bucket. Default bucket is set in `.replit` (`[objectStorage] defaultBucketID`) |

## Commands
The Run button runs `npm install` before `npm run dev`, and the deployment build runs `npm ci`, so pulling a
branch with new dependencies never needs a manual install.

`npm run dev` · `npm run build` · `npm run start` · `npm run migrate` · `npm run migrate:content`
(`-- --ingest` to copy working Wix PDFs into App Storage) · `npm run audit:links` · `npm run sync:ir` (align investor documents with the live Wix site; dry run unless `--apply`, see `docs/migration.md`) · `npm run verify:seo` ·
`npm run admin:reset` (create the owner login or reset its password from `ADMIN_EMAIL` / `ADMIN_PASSWORD`; clears lockout)

## Deployment
Target: VM. Build `npm run build`; run `npm run migrate && npm run start`.
Go-live steps: `docs/admin-guide.md` (Go-live checklist) and `docs/migration.md`.

## Recent Changes
- 2026-10-16: 2026 redesign of the public site, live NSE quote, enquiries inbox, folder category, SEBI LODR table rebuild, `sync:ir`, SEO/LLM work. See `CHANGELOG.md`.
- 2026-10-15: CMS build. Postgres + App Storage; users/roles/audit; block page builder with drafts,
  preview, revisions; DB-driven investor sections and documents with own-domain file URLs; site search
  including PDF text; DB-driven sitemap/robots/JSON-LD; content migration (all pages imported as drafts);
  link audit (96 of 104 legacy Wix PDF links broken).
- 2026-02-12: Initial Replit setup.
