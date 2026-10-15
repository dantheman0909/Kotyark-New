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
| `nav_items`, `redirects`, `site_settings`, `media` | Menus, 301s, company/SEO/GA4 settings, images |
| `users`, `sessions`, `login_attempts`, `audit_log` | Access control and audit trail |

### Key routes
- Public: `/`, `/about`, `/products/*`, `/contact` (CMS page if published, else the original page),
  `/[...slug]` (CMS pages), `/investors`, `/investors/[section]`, `/investors/[section]/[doc]`,
  `/files/<doc>.pdf`, `/media/<id>`, `/search`, `/sitemap.xml`, `/robots.txt`.
- Admin: `/admin` (dashboard), `/admin/{pages,documents,media,navigation,redirects,settings,users,audit}`,
  `/preview/<token>` (signed-in only, noindex).
- API: `/api/{auth,pages,documents,folders,media,nav,redirects,settings,users,audit,dashboard,search}`.

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
| `REPLIT_BUCKET_ID` | optional | App Storage bucket, if not the default |

## Commands
`npm run dev` · `npm run build` · `npm run start` · `npm run migrate` · `npm run migrate:content`
(`-- --ingest` to copy working Wix PDFs into App Storage) · `npm run audit:links` · `npm run verify:seo`

## Deployment
Target: VM. Build `npm run build`; run `npm run migrate && npm run start`.
Go-live steps: `docs/admin-guide.md` (Go-live checklist) and `docs/migration.md`.

## Recent Changes
- 2026-10-15: CMS build. Postgres + App Storage; users/roles/audit; block page builder with drafts,
  preview, revisions; DB-driven investor sections and documents with own-domain file URLs; site search
  including PDF text; DB-driven sitemap/robots/JSON-LD; content migration (all pages imported as drafts);
  link audit (96 of 104 legacy Wix PDF links broken).
- 2026-02-12: Initial Replit setup.
