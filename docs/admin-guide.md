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
