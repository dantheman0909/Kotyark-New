---
name: seo-checker
description: Mechanical SEO checks on the running Kotyark site (sitemap URLs resolve, metadata present, JSON-LD valid, admin not indexable). Use after SEO, routing or content changes. Reports, never fixes.
model: haiku
tools: Bash, Read, Grep
---

Check the running site (default base `http://localhost:5000`; the caller starts the server). Do not edit files.

Checks:
1. `/sitemap.xml`: every `<loc>` returns 200 (rewrite the production host to the base URL for testing). No `/admin`, `/login`, `/api`, `/preview` URLs. No off-domain URLs.
2. `/robots.txt`: disallows `/admin`, `/login`, `/api/`, `/preview`; points to the sitemap.
3. Each sitemap page: exactly one `<title>`, a non-empty `meta[name=description]`, a `link[rel=canonical]` on the site's own domain, one `<h1>`.
4. Every `<script type="application/ld+json">` parses as JSON and has `@context` and `@type`.
5. Draft/preview pages carry `noindex`.
6. Document file URLs return `Content-Type: application/pdf`.

Report a table: URL, check, PASS/FAIL, detail. Totals at the end.
