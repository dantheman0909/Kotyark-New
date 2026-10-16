# Changelog

Dated, newest first. User-visible changes only; architecture is in `replit.md`.

## 2026-10-16

### Added
- **Autoscale-safe deployment**: deployment target is now Autoscale (set Max instances = 1). The NSE quote and history are cached in the database so a cold start shows live figures, the contact-form rate limit is shared via the database, IndexNow pings are awaited inside the request, stock refreshes on a stale cache run best-effort after the response, migrations take an advisory lock and a failed migrate no longer stops the server from starting, and the social-card cache life is cut to 60 s. Migration 007.
- **2026 redesign** of the public site: Home, Products (Biodiesel, Crude Glycerin), About, Investors hub, filing and
  document pages, SEBI LODR and Contact, with a new navigation bar (NSE ticker pill) and footer. Animations are
  skipped for visitors who prefer reduced motion, and all content is in the server HTML. A published CMS page still
  overrides any route.
- **Live NSE: KOTYARK quote and price history** (Yahoo Finance, delayed) on the home page, Investors page and
  navigation. New admin setting **Stock quote fallback**, used only when the live feed is unavailable.
- **Enquiries inbox** (`/admin/enquiries`): contact-form messages with New / Handled / Spam status, internal notes,
  CSV export (audited) and Owner-only delete. Honeypot or too-fast submissions are filed as Spam. New permissions
  `enquiries:read` / `enquiries:write` (Owner, Editor, Compliance) and `enquiries:delete` (Owner). Migration 006.
- **Investor section category** (Regulatory, Financial, Governance, Other) driving the filter chips on the Investors
  page. Migration 005.
- **`npm run sync:ir`**: aligns investor documents, section names, groups and redirects with the live Wix site
  (dry run by default, audited, idempotent). See `docs/migration.md`.
- **SEO and AI discovery:** Corporation, Product, Place and WebPage structured data; `/llms.txt` and `/llms-full.txt`;
  AI-crawler rules in `robots.txt`; IndexNow notifications; per-page social share images; icons and web app manifest;
  tighter titles and descriptions; extended `npm run verify:seo`.

### Changed
- The SEBI LODR table was rebuilt verbatim from the live site (it has no regulation or Yes/NA columns, so those are empty).
- Admin and login screens were reskinned.
- Legacy page components were removed.

### Security
- IndexNow is pinged only when public content changes (never for drafts, hidden sections or menu saves).
- `POST /api/contact` reads at most 20 KB of the body regardless of `Content-Length`, is limited to 5 messages per IP per
  10 minutes, and rejects unknown content types. The client IP honours `TRUSTED_PROXY_HOPS`.
- The enquiry IP is stored only as an HMAC keyed by `ENQUIRY_PEPPER` (nothing stored when it is unset). CSV export neutralises spreadsheet formulas.
- New env vars: `INDEXNOW_KEY`, `TRUSTED_PROXY_HOPS`, `ENQUIRY_PEPPER` (optional); `STOCK_YAHOO_URL` (development only).
