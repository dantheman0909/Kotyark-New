# Kotyark Website

## Overview
Kotyark Industries corporate website - India's leading biodiesel manufacturer. Built with Next.js 16 and better-sqlite3 for local database storage.

## Project Architecture
- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite via better-sqlite3 (stored at `data/kotyark.db`)
- **Authentication**: bcryptjs for password hashing, session-based auth
- **Styling**: CSS Modules + global CSS

### Directory Structure
- `src/app/` - Next.js App Router pages (home, about, products, contact, investors, admin, login)
- `src/components/` - Shared React components (Navbar, Footer, LayoutShell, etc.)
- `src/components/admin/` - Admin CMS UI (RichTextEditor, MediaPicker, PageManager, etc.)
- `src/lib/` - Utility modules (db.js, auth.js, pages.js)
- `src/app/api/` - API routes (auth, folders, documents, uploads, content-blocks)
- `public/images/` - Static assets
- `public/uploads/` - Runtime-uploaded media (git-ignored; persisted on the VM)
- `data/` - SQLite database files

## Content Management (mini-CMS)
- Admin dashboard at `/admin` (login at `/login`) with tabs: **Pages**, **Documents**, **Media**, **Site Content**.
- **Pages**: investor-section pages are stored in the `folders` table (`content` HTML column) and rendered by the dynamic route `src/app/investors/[slug]/page.js`. New pages created in admin appear automatically in the Investor Relations sidebar. Five bespoke pages remain as static React files (audited-financial-statements, board-meetings, extra-ordinary-general-meetings, integrated-filling, sebi-lodr) and take route priority over the dynamic `[slug]`.
- **Editor**: TipTap WYSIWYG (`src/components/admin/RichTextEditor.js`) outputs HTML; image/link buttons open the media library to insert uploaded files.
- **Media**: files upload via `/api/uploads` to `public/uploads/` and are tracked in the `media` table.
- **Site Content**: named `content_blocks` (e.g. `about-intro`, `products-intro`) render at the top of the About/Products pages when set, otherwise the built-in copy shows.

## Configuration
- Dev server runs on port 5000 (0.0.0.0)
- Production server also on port 5000
- `allowedDevOrigins` configured in `next.config.mjs` for Replit proxy compatibility
- `serverExternalPackages` includes `better-sqlite3` for native module support
- **Deployment target: VM** — required so the SQLite database (`data/kotyark.db`) and uploaded media (`public/uploads/`) persist. Autoscale would wipe both between instances; do not switch.

## Recent Changes
- 2026-02-12: Initial Replit setup - configured port 5000, allowed dev origins, set up workflow and deployment
- 2026-07-16: Added admin CMS — TipTap HTML editor, media uploads with link mapping, DB-driven investor pages, and editable content blocks for About/Products.
