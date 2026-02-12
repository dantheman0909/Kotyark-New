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
- `src/lib/` - Utility modules (db.js, auth.js)
- `src/app/api/` - API routes
- `public/images/` - Static assets
- `data/` - SQLite database files

## Configuration
- Dev server runs on port 5000 (0.0.0.0)
- Production server also on port 5000
- `allowedDevOrigins` configured in `next.config.mjs` for Replit proxy compatibility
- `serverExternalPackages` includes `better-sqlite3` for native module support
- Deployment target: VM (due to SQLite local database)

## Recent Changes
- 2026-02-12: Initial Replit setup - configured port 5000, allowed dev origins, set up workflow and deployment
