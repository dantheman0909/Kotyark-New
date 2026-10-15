# Kotyark Website + CMS: Agent & Contributor Guide

Entry point for anyone (human or AI agent) working in this repo.

## Stack

- Next.js 16 (App Router), React 19, **JavaScript** (no TypeScript). Hosted on Replit (port 5000).
- Target data layer (CMS build in progress): Replit PostgreSQL via one pool in `src/lib/db.js`; files in Replit App Storage via `src/lib/storage.js`.
- Legacy (being retired): SQLite `data/kotyark.db` via `better-sqlite3`, uploads to `public/documents/`.
- Commands: `npm run dev` · `npm run build` · `npm run start` · `npm run migrate` (once added).
- Architecture narrative: [`replit.md`](./replit.md). CMS plan and phases: tracked in the PR description and `docs/` as they land.

## Sub-agent model routing

Configured in `.claude/settings.json` (default) and `.claude/agents/*.md` (per-role pins).
Subagents default to **Sonnet** (`CLAUDE_CODE_SUBAGENT_MODEL=sonnet`). **Opus is for judgment, not labour.**

| Agent | Model | Use for |
|---|---|---|
| `Plan` | opus | Phase design: schema, routes, trade-offs. No edits. |
| `code-reviewer` | opus | Adversarial diff review against the house rules below, before every push. |
| `general-purpose` (built-in) | sonnet | Multi-step edits that don't fit a named role. |
| `cms-builder` | sonnet | Blocks, admin screens, API routes, public dynamic routes. |
| `content-migrator` | sonnet | Migration script, verbatim content import, PDF link audit. |
| `db-reader` | sonnet | Read-only SELECTs through the app's pool. |
| `doc-sync` | sonnet | `replit.md`, `docs/`, `CHANGELOG.md`, admin guide. |
| `e2e-tester` | sonnet | Playwright flows against the dev server. Reports only. |
| `Explore` | haiku | File/code lookups. Read-only. |
| `verifier` | haiku | `npm run build`, `lint`, `migrate` (x2), `verify:*`. Pass/fail only. |
| `seo-checker` | haiku | Sitemap, metadata, canonical, JSON-LD, robots checks. |

Rules:
- On an ad-hoc Agent call, pass `model: haiku` for lookups and `model: sonnet` for a thorough sweep.
- Do **not** set `CLAUDE_CODE_SUBAGENT_MODEL_FORCE`: it would override the Opus pins.
- Standard phase loop: **Plan (opus) → build (sonnet, parallel where independent) → verifier (haiku) → e2e-tester / seo-checker → code-reviewer (opus) → push.**

## House rules (code-reviewer enforces these)

1. **Never write files to `/public` at runtime.** `next start` only serves `/public` files present at build time, and Replit republish wipes them. Uploads go to App Storage through `src/lib/storage.js` and are served by a route.
2. **Schema changes only as a new numbered SQL file in `src/lib/migrations/`**, idempotent (`IF NOT EXISTS`), applied by `npm run migrate`. Never edit an applied migration.
3. **Parameterized SQL only.** No user input concatenated into SQL.
4. **Every mutation**: session check + role check + `audit_log` row + `revalidatePath` for affected public pages, nav and sitemap.
5. **Sanitize rich text and embeds server-side** before storing and before rendering.
6. **SEO by default**: every public route exports metadata (title, description, canonical on own domain). Drafts and previews are `noindex`. Slug changes create a 301 redirect.
7. **No secrets or default passwords in source.** Never print `DATABASE_URL`. Never commit `data/*.db*`.
8. **Content is copied verbatim during migration.** Never invent a URL, title or date. A broken link is flagged, not deleted.
9. **Scratch output** (audit reports, screenshots, test scripts) goes in `attached_assets/_scratch/` (gitignored), never the repo root.
10. **Reuse existing CSS** in `src/app/globals.css` before adding new classes; the public design system is already built.
