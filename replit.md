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

### Content model
| Table | Purpose |
|---|---|
| `pages` + `page_revisions` | Block-based pages and sub-pages. The row holds the draft; the latest `Published` revision is live. `live_*` columns feed search and the sitemap. |
| `document_folders` + `documents` | Investor sections and documents (file in App Storage or legacy external URL), PDF text for search, link-check status |
| `popups` + `popup_stats` | On-brand pop-ups: content/design/rules as JSON, raw author CSS plus the postcss-scoped CSS that is the only CSS rendered; per-day views/clicks/dismissals. Active ones load in `LayoutShell` (path-filtered via the `x-kp-path` header set in `src/proxy.js`), shown by `PopupHost`; the shared renderer is `components/popups/Popup.js` |
| `nav_items`, `redirects`, `site_settings`, `media` | Menus, 301s, company/SEO/GA4 settings, images |
| `users`, `sessions`, `login_attempts`, `audit_log` | Access control and audit trail |

### Key routes
- Public: `/`, `/about`, `/products/*`, `/contact` (CMS page if published, else the original page),
  `/[...slug]` (CMS pages), `/investors`, `/investors/[section]`, `/investors/[section]/[doc]`,
  `/files/<doc>.pdf`, `/media/<id>`, `/search`, `/sitemap.xml`, `/robots.txt`.
- Admin: `/admin` (dashboard), `/admin/{pages,documents,media,navigation,redirects,popups,settings,users,audit}`,
  `/preview/<token>` (signed-in only, noindex).
- API: `/api/{auth,pages,documents,folders,media,nav,redirects,popups,settings,users,audit,dashboard,search}`.

### Directory structure
- `src/app/` routes · `src/components/blocks/` block renderers · `src/components/admin/` admin shell + UI
- `src/lib/` shared modules (db, auth, audit, storage, seo, search, pages, documents, blocks/schemas)
- `scripts/` migrate, content migration, link audit, SEO verification · `docs/` admin guide, migration notes

## Configuration (Replit Secrets)
| Secret | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Provided by the Replit PostgreSQL integration |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | first boot | Creates the first Owner when no users exist (password 12+ chars) |
| `SITE_URL` | yes | `https://www.kotyark.com` (canonical URLs, sitemap) |
| `INDEXNOW_KEY` | optional | 8-128 letters/digits/dashes. When set in a production deployment, publishing, unpublishing, moving or deleting a page or document that is (or was) public pings IndexNow; drafts, hidden folders and nav saves never do (Bing and partners). The key is served at `/indexnow-key.txt` |
| `TRUSTED_PROXY_HOPS` | optional (default 1) | Number of trusted reverse proxies in front of the app. The client IP (login throttling, audit log, contact-form rate limit) is the `X-Forwarded-For` entry that many positions from the right, clamped to the list, falling back to `x-real-ip`. On first use in production the app logs `[net] x-forwarded-for has N entries; using hop H` (counts only, never IPs): check that line after deploying and raise the value only if the real client sits further left |
| `ENQUIRY_PEPPER` | optional | Secret pepper for the `ip_hash` stored with contact enquiries (sha256(ip + pepper)). When unset, no `ip_hash` is stored (NULL): there is no built-in default |
| `REPLIT_BUCKET_ID` | optional | Overrides the bucket. Default bucket is set in `.replit` (`[objectStorage] defaultBucketID`) |

## Commands
The Run button runs `npm install` before `npm run dev`, and the deployment build runs `npm ci`, so pulling a
branch with new dependencies never needs a manual install.

`npm run dev` · `npm run build` · `npm run start` · `npm run migrate` · `npm run migrate:content`
(`-- --ingest` to copy working Wix PDFs into App Storage) · `npm run audit:links` · `npm run verify:seo` ·
`npm run admin:reset` (create the owner login or reset its password from `ADMIN_EMAIL` / `ADMIN_PASSWORD`; clears lockout)

## Deployment
Target: VM. Build `npm run build`; run `npm run migrate && npm run start`.
Go-live steps: `docs/admin-guide.md` (Go-live checklist) and `docs/migration.md`.

## Recent Changes
- 2026-10-15: CMS build. Postgres + App Storage; users/roles/audit; block page builder with drafts,
  preview, revisions; DB-driven investor sections and documents with own-domain file URLs; site search
  including PDF text; DB-driven sitemap/robots/JSON-LD; content migration (all pages imported as drafts);
  link audit (96 of 104 legacy Wix PDF links broken).
- 2026-02-12: Initial Replit setup.
