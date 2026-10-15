# Content migration (legacy site to CMS)

Moves the hard-coded pre-CMS content into the CMS tables. Everything is verbatim: no URL, title or date was
invented, and a broken link is flagged, never deleted.

## Run order (Replit owner)

```bash
npm run migrate                          # schema + first owner (needs ADMIN_EMAIL / ADMIN_PASSWORD once)
npm run migrate:content                  # import folders, documents, draft pages, nav, settings
npm run audit:links                      # HEAD-check every document URL, record link_status
#   review attached_assets/_scratch/link-audit.csv and the broken list below; fix URLs in the admin
npm run migrate:content -- --ingest      # download link_status='ok' PDFs into App Storage
```

`audit:links` needs the script entry `"audit:links": "node scripts/link-audit.mjs"` in `package.json`
(`migrate:content` exists already). Until it is added: `node scripts/link-audit.mjs` (`--folder <slug>` limits it).

Flags for `migrate:content`:

| Flag | Effect |
|---|---|
| `--dry-run` | Runs the whole import inside one transaction that is rolled back; prints the plan. Writes nothing. |
| `--ingest` | After the import, downloads every document with `link_status='ok'` and no `storage_key` into storage (key `docs/<document id>/<slug>.pdf`), sets `storage_key`, `size`, `mime`, `original_name`, `extracted_text` (pdf-parse) and, when empty, `description` (first ~160 chars). `external_url` is kept. Concurrency 3; ingested rows are skipped; a file without a `%PDF-` header is refused. |
| `--limit N` | With `--ingest`, stop after N documents (`--limit 5` proves it works before the full run). |
| `--overwrite` | Force snapshot values over rows an admin has since edited (off by default). |

Storage follows `src/lib/storage.js`: Replit App Storage when `REPL_ID` is set, else local `.storage/`.
Database: `KOTYARK_DATABASE_URL`, else `DATABASE_URL`. Output: `attached_assets/_scratch/migration-report.json`
(counts per table, plan, ingest result) and `attached_assets/_scratch/link-audit.csv`.

## How it behaves

Idempotent: a second run reports 0 inserted, 0 updated, everything unchanged. Each entity group is one transaction.

| Table | Rule |
|---|---|
| `document_folders` | Upsert by legacy id (`inv-sebi` ...). A row that differs from the snapshot is assumed to be an admin edit and is left alone (`skipped_modified`) unless `--overwrite`. |
| `documents` | Upsert on `(folder_id, external_url)`; `slug` from the unique-slugified title (stable once assigned); `status='published'`; `storage_key` null until `--ingest`; `sort_order` is the original order. Rows with `updated_by` set (admin-edited) are not reverted. |
| `pages` | Always `status='draft'`, upsert by `path`, parents first, `search_text` from the blocks (same `blocksToText`), rich text sanitized. Never published by the script. A page that is published or admin-edited is not touched (unless `--overwrite`, and its status still never changes). |
| `nav_items` | Inserted only into a menu (`header` / `footer`) that is empty. `page_id` when a page with that path exists, else `url`. |
| `site_settings` | Insert if absent (`org`, `social`, `seo_defaults`); never overwritten. |
| `redirects` | Insert if absent. None imported: the repo holds no evidence of old page URLs (the old `sitemap.js` lists `/sustainability` and `/programs`, which have no page). Nothing guessed. |
| `audit_log` | One row per real run: `user_email='migration-script'`, action `create`, entity `migration`, counts in `diff`. |

Content comes from `scripts/legacy/content-snapshot.json`, extracted once by `scripts/lib/build-content-snapshot.mjs`. The
builder reads the legacy page files (other branches delete them), so it cannot be rerun later; `--check` re-validates the
committed snapshot. It fails unless every block passes `validateBlock` and every visible text fragment of the six static
page files is found in the snapshot.

## What was migrated

| Entity | Count |
|---|---|
| Folders | 15 investor sections, top level (`inv-root` / `investors` not created). `description` = the hub's card text per section. `group_by='fy'` on board-meetings, audited-financial-statements, extra-ordinary-general-meetings, integrated-filling (their old pages were card grids); all others `none`. `sebi-lodr` is kept (visible, sort 1, no documents). |
| Documents | 104 after dedupe (105 in the legacy seed; union with the hard-coded page arrays, key `(folder, url)`) |
| Pages (all draft) | 8: `/` (10 blocks), `/about` (7), `/products` (4), `/products/biodiesel` (6), `/products/crude-glycerin` (5), `/contact` (5), `/investors` (1, container), `/investors/sebi-lodr` (2, 30-row compliance table) |
| Nav items | 18: header 7 (Home, About Us, Products + 2 children, Investors, Contact), footer 11 (group "Company" 5 links, group "Resources" 4 links) |
| Settings | `org` (legal name, CIN, address, email, listing, tagline, approval line, logo), `social` (empty), `seo_defaults` |

Documents per folder: closing-trading-window 11, misc-sebi-disclosure 12, annual-general-meeting 18, company-policies 23,
merger-and-amalgamation 26, migration-to-main-board 4, smart-odr 1, unpaid-dividend 2, postal-ballot 6, moa-aoa 1; the
other five folders hold none.

`intro_html` = `<p>` + the page's intro paragraph (verbatim, escaped) + `</p>`, sanitized. Smart ODR's intro also holds its
"How to file a complaint?" ordered list (with the smartodr.in link). `fy` / `doc_date` are set only when the title states
them (`FY 2023-24`; `FY 2023-2024` normalised to `FY 2023-24`; `dd.mm.yyyy` read day-month-year, confirmed by titles such as
27.01.2025). "September 2024"-style titles leave both null. 18 documents carry a date, 18 an FY. Page `<title>`/description
metadata of each investor page is kept in the folder's `seo`.

The static `/investors` route keeps serving the hub until an admin publishes the draft `/investors` page, which only holds
the hub's intro sentence.

## Data issues found (need an owner decision)

1. **96 of 104 document links return 404** (results below). The legacy seed contains many Wix-looking ids with an obvious
   pattern (`..._a1b2c3d4e5f6a7b8...`) that were never real files. Imported as-is and flagged `broken`; the real files must
   be re-uploaded in the admin (or the real Wix URL pasted in).
2. **Two titles share one URL.** Misc Disclosure lists "Certificate under Regulation 74(5) H2 FY 2023-24" and "... H1 FY
   2023-24" with the same PDF (`510267_b3520e65...`). The `(folder, url)` unique index allows one row, so **"H1 FY 2023-24" is
   not a row** (kept in the snapshot as `alt_titles`). Upload the real H1 certificate as its own document.
3. **Merger & Amalgamation: three URLs carry different titles in the seed and on the live page.** The live page's title won;
   the seed titles are in `documentConflicts`: `e1f2...` page "Outcome of Board Meeting - Scheme Approval" (seed "Effective
   Date Notification"), `f2a3...` "Independent Directors Committee Report" (seed "Filing with Registrar of Companies"),
   `a3b4...` "Audit Committee Recommendation" (seed "Allotment of Shares Post-Merger").
4. Folder `sebi-lodr` shares its public path with the `/investors/sebi-lodr` compliance-table page (static route today);
   the folder is empty. Kept visible as requested.
5. `group_by='fy'` on EOGM and Integrated Filling mirrors their old FY-grid pages; neither has FY-named documents yet.
6. Four investor sub-pages show placeholder cards with no documents behind them (Board Meetings FY cards, Audited Financial
   Statements subsidiaries, EOGM, Integrated Filling). They are in the snapshot as `folderPlaceholders`, not imported.
7. The same PDF filed in two sections (Postal Ballot x3 also under Migration To Main Board) is two rows and, after
   `--ingest`, two stored copies.
8. Nav items link to the **draft** pages by `page_id`. The nav renderer must not hide an item just because its page is a
   draft, or "Investors" (draft container) vanishes until published. Footer group headings are stored with `url=''` (the
   check constraint needs a page or a url) and are not links.
9. Canonical host: `src/app/layout.js` sets `metadataBase` `https://kotyark.com`; sitemap/robots use `https://www.kotyark.com`.
   Stored as-is in `seo_defaults.metadataBase`; pick one.

## Content gaps: elements with no block equivalent

All copy is preserved. Elements the block contract cannot express are either stored as an **extra prop** (ignored by
`validateBlock` and the current renderer, kept for when the contract grows) or folded into the nearest block.

| Gap | Where | Handling |
|---|---|---|
| Section tag / eyebrow ("What is Biodiesel?", "Our Products", ...) | Every section header except heroes | Extra prop `eyebrow` on `image_text`, `rich_text`, `card_grid`. Not rendered until blocks gain an `eyebrow` field. |
| Intro paragraph of a stats section (Home "Impact at Scale") | Home | `rich_text` (heading + paragraph) followed by a heading-less `stats`. |
| Hero background alt text | Home | Extra prop `imageAlt` on `hero`. |
| Accent-coloured words in the hero heading | Home | Plain heading. |
| Hero badge icon, scroll arrow, section `id` anchors (`#hero` ... `#newsletter`) | Home | Dropped. |
| `CarbonCreditBadge` (floating "First Indian Company to receive Verra Carbon Credits") | Home | Text kept in a narrow `rich_text` after the hero; the floating badge is lost. |
| Trust bar, feature, application SVG icons; trust bar aria-label | Home, Products, Biodiesel, Glycerin | Dropped (`icon` takes emoji/short text). People and plants use initials / "Rajasthan Plant" as `icon`. |
| Card image alt, per-card link label, tag chips | Home + Products product cards | Extra props `imageAlt`, `linkLabel`, `tags`. |
| Second CTA button | Home, Biodiesel, Glycerin | Extra props `secondaryLabel` / `secondaryHref` on `cta_banner`. |
| Mini-stat boxes in a text split (86% / 100%) | Home | Two `<p><strong>86%</strong> ...</p>` lines at the end of the body. |
| Board member role styled apart from bio | About | First line of `body` plus extra prop `role`. |
| Benefit list with tick icons / technical data table | Biodiesel | `<ul>` / `<table>` inside `rich_text` (sanitizer allows tables). |
| Contact form (fields, subject options, placeholders, "Thank You!" state) | Contact | `contact_info` `showForm: true`; the form belongs to the renderer. The old form never posted anywhere. "Send Us a Message" + intro sit in a `rich_text` before it. |
| Email as a link | Contact | Plain text in the source, so no `mailto:` href was added. |
| Company Details / Approved Manufacturer side cards | Contact | Two `rich_text` blocks; card styling lost. |
| Breadcrumb, "Investor Sections" sidebar, document cards | Investor sub-pages | Folder renderer, not blocks. |
| Hub key-metric cards, four category grids, "Investor Queries?" CTA | `/investors` | Not migrated; the static route serves them. |
| "View" label and Yes/NA column | SEBI LODR table | `href` only; NA rows have empty `href`. |
| `ScrollReveal` animations | All | Renderer concern. |
| Header "Contact Our Team" button | Navbar | Not a menu item; left to the layout. |
| Social links / phone | Footer | None exist: `social` is `{}`, `org.phone` null. |

## Link audit results

Run against the live Wix host (15 s timeout, concurrency 5, HEAD then ranged GET on 403/405, 1 retry): 101 unique URLs,
104 rows. `ok` = 2xx with a PDF content type.

| Folder | Total | ok | broken | error |
|---|---:|---:|---:|---:|
| closing-trading-window | 11 | 0 | 11 | 0 |
| misc-sebi-disclosure | 12 | 0 | 12 | 0 |
| annual-general-meeting | 18 | 0 | 18 | 0 |
| company-policies | 23 | 0 | 23 | 0 |
| merger-and-amalgamation | 26 | 0 | 26 | 0 |
| migration-to-main-board | 4 | 4 | 0 | 0 |
| smart-odr | 1 | 0 | 1 | 0 |
| unpaid-dividend | 2 | 0 | 2 | 0 |
| postal-ballot | 6 | 3 | 3 | 0 |
| moa-aoa | 1 | 1 | 0 | 0 |
| **Total** | **104** | **8** | **96** | **0** |

Every non-ok row is HTTP 404 (re-checked with curl). The 8 working files are the 4 Migration To Main Board PDFs (3 also
under Postal Ballot) and the MOA-AOA. Five were ingested as the `--limit 5` proof (0.45 to 14 MB, text extracted).

### Broken URLs (404)

**closing-trading-window** (11 broken of 11)

- Closing of Trading Window - Board Meeting 11.02.2025
  `https://www.kotyark.com/_files/ugd/e196d6_72f5b70b54a2483e892be2b1b2b6eee3.pdf` (404)
- Closing of trading Window - Board Meeting 27.01.2025
  `https://www.kotyark.com/_files/ugd/e196d6_ecbcfa5a3ea746bbaaedcc2ac2a2bdbc.pdf` (404)
- Closing of Trading Window - Board meeting 14.11.2024
  `https://www.kotyark.com/_files/ugd/e196d6_e24f21f5b0ef41b1a94da25a2ed6e7a9.pdf` (404)
- Closing of Trading Window - Board Meeting 03.09.2024
  `https://www.kotyark.com/_files/ugd/e196d6_1daab3b9f7b94cdea81e7dde0b8b5ede.pdf` (404)
- Closing of Trading Window - Board Meeting 14.08.2024
  `https://www.kotyark.com/_files/ugd/e196d6_fe9b21e3f9b3452bbb0301e2fe84e5e3.pdf` (404)
- Closing of Trading Window - Board Meeting 30.05.2024
  `https://www.kotyark.com/_files/ugd/e196d6_30f32c7b1e3541f1886ecc13ebd5f1f3.pdf` (404)
- Closing of Trading Window - Board Meeting 14.02.2024
  `https://www.kotyark.com/_files/ugd/e196d6_ec20b2bb1c3d405fa1f5ef3f24b2e56c.pdf` (404)
- Closing of Trading Window - Board Meeting 10.11.2023
  `https://www.kotyark.com/_files/ugd/e196d6_199e2b19e77b4b1a804e8e5e94ac6e5f.pdf` (404)
- Closing of Trading Window - Board Meeting 12.08.2023
  `https://www.kotyark.com/_files/ugd/e196d6_da20e2dc0c064ea0b87a06e64e3bc61f.pdf` (404)
- Closing of Trading Window - Board Meeting 29.05.2023
  `https://www.kotyark.com/_files/ugd/e196d6_0a5df5b3b75245f18f3b6d94b33fbb88.pdf` (404)
- Closing of Trading Window - Board Meeting 10.02.2023
  `https://www.kotyark.com/_files/ugd/e196d6_6a3f3d25d2ea4c7fa2131e18cdfd49da.pdf` (404)

**misc-sebi-disclosure** (12 broken of 12)

- Certificate under Regulation 74(5) H1 FY 2024-25
  `https://www.kotyark.com/_files/ugd/510267_f1c84deafc7d4e47bec07eef04b22eff.pdf` (404)
- Secretarial Compliance Report FY 2023-2024
  `https://www.kotyark.com/_files/ugd/510267_f741683e098243cf8b7b522e2bb3a64b.pdf` (404)
- Certificate under Regulation 74(5) H2 FY 2023-24
  `https://www.kotyark.com/_files/ugd/510267_b3520e65133e453985b56e9acf2206eb.pdf` (404)
- Corporate Governance Report Q3 FY 2024-25
  `https://www.kotyark.com/_files/ugd/e196d6_bcef2a33b8d54f4e9a9e1f5c236d2b5c.pdf` (404)
- Corporate Governance Report Q2 FY 2024-25
  `https://www.kotyark.com/_files/ugd/e196d6_050c0c9d8e3f4ec699aa4ac32a12cae4.pdf` (404)
- Corporate Governance Report Q1 FY 2024-25
  `https://www.kotyark.com/_files/ugd/e196d6_c9e4a6fc0a0545efbe8d72b8e26ae9f2.pdf` (404)
- Corporate Governance Report Q4 FY 2023-24
  `https://www.kotyark.com/_files/ugd/e196d6_bfa9a1f3d09c4bb3b89b9c5aec41b3be.pdf` (404)
- Corporate Governance Report Q3 FY 2023-24
  `https://www.kotyark.com/_files/ugd/e196d6_6c0f3a5e31be44d6b45f4ca11e03fa5f.pdf` (404)
- Corporate Governance Report Q2 FY 2023-24
  `https://www.kotyark.com/_files/ugd/e196d6_7f5fa2f9cfc3482aabf21b3c2e7c12e0.pdf` (404)
- Corporate Governance Report Q1 FY 2023-24
  `https://www.kotyark.com/_files/ugd/e196d6_d283a2d0e88e4f2c97ea47f78f1a4ee6.pdf` (404)
- Secretarial Compliance Report FY 2022-2023
  `https://www.kotyark.com/_files/ugd/510267_d9c0a2e3b01c4a3ba97e4b5dd9f4c6a7.pdf` (404)
- Certificate under Regulation 74(5) H2 FY 2022-23
  `https://www.kotyark.com/_files/ugd/510267_22d2f8f0cf6f4c39ab5b9a22c7ee2d29.pdf` (404)

**annual-general-meeting** (18 broken of 18)

- Notice of 2nd AGM - September 2024
  `https://www.kotyark.com/_files/ugd/e196d6_5a7d3b2c1f8e4a31b9c2d4e6f8a1b3c5.pdf` (404)
- Annual Report FY 2023-24
  `https://www.kotyark.com/_files/ugd/e196d6_3b8c7d4e2f1a5b6c9d0e3f8a2b5c7d4e.pdf` (404)
- AGM Minutes - September 2024
  `https://www.kotyark.com/_files/ugd/e196d6_1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f.pdf` (404)
- Scrutinizer Report - 2nd AGM
  `https://www.kotyark.com/_files/ugd/e196d6_4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a.pdf` (404)
- e-Voting Results - 2nd AGM
  `https://www.kotyark.com/_files/ugd/e196d6_7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d.pdf` (404)
- Notice of 1st AGM - September 2023
  `https://www.kotyark.com/_files/ugd/510267_9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f.pdf` (404)
- Annual Report FY 2022-23
  `https://www.kotyark.com/_files/ugd/510267_0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a.pdf` (404)
- AGM Minutes - September 2023
  `https://www.kotyark.com/_files/ugd/510267_1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b.pdf` (404)
- Scrutinizer Report - 1st AGM
  `https://www.kotyark.com/_files/ugd/510267_2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c.pdf` (404)
- e-Voting Results - 1st AGM
  `https://www.kotyark.com/_files/ugd/510267_3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d.pdf` (404)
- Book Closure / Record Date Notice - 2nd AGM
  `https://www.kotyark.com/_files/ugd/e196d6_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6.pdf` (404)
- Book Closure / Record Date Notice - 1st AGM
  `https://www.kotyark.com/_files/ugd/510267_b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7.pdf` (404)
- Newspaper Publication - 2nd AGM Notice
  `https://www.kotyark.com/_files/ugd/e196d6_c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8.pdf` (404)
- Newspaper Publication - 1st AGM Notice
  `https://www.kotyark.com/_files/ugd/510267_d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9.pdf` (404)
- AGM Proceedings Video - September 2024
  `https://www.kotyark.com/_files/ugd/e196d6_e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0.pdf` (404)
- AGM Proceedings Video - September 2023
  `https://www.kotyark.com/_files/ugd/510267_f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1.pdf` (404)
- Annual Return FY 2023-24
  `https://www.kotyark.com/_files/ugd/e196d6_a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2.pdf` (404)
- Annual Return FY 2022-23
  `https://www.kotyark.com/_files/ugd/510267_b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3.pdf` (404)

**company-policies** (23 broken of 23)

- Code Of Conduct for Prevention of Insider Trading
  `https://www.kotyark.com/_files/ugd/510267_7d735d5bd9f24e118ad7a3e3dbdb23c1.pdf` (404)
- HR & Remuneration Policy
  `https://www.kotyark.com/_files/ugd/510267_5e4f2a9bfc7245c0a8bf09d2af75ba79.pdf` (404)
- Code of Conduct for Board & Senior Management
  `https://www.kotyark.com/_files/ugd/510267_6c1e11acbc7c4697a3e26a7b7b85e92f.pdf` (404)
- Vigil Mechanism / Whistle Blower Policy
  `https://www.kotyark.com/_files/ugd/510267_fd41f2e8c27f43cbb98d6b6e35e10bea.pdf` (404)
- Related Party Transaction Policy
  `https://www.kotyark.com/_files/ugd/510267_0b79ab697d814f178d68db8d3dcebf8c.pdf` (404)
- Criteria for Making Payment to Non-Executive Directors
  `https://www.kotyark.com/_files/ugd/510267_4d33cf8b6da0464a960b4f979a27d7be.pdf` (404)
- Familiarization Programme for Independent Directors
  `https://www.kotyark.com/_files/ugd/510267_5419cbc6e7ae4c8f8f1de5f53a05f8e0.pdf` (404)
- Policy on Material Subsidiaries
  `https://www.kotyark.com/_files/ugd/510267_a0f26b58fadb4f2c8c7dac95a26c7f4f.pdf` (404)
- Terms & Conditions of Appointment of Independent Directors
  `https://www.kotyark.com/_files/ugd/510267_f30fc83d57d04bd29ee2d27e5ae39f0c.pdf` (404)
- Dividend Distribution Policy
  `https://www.kotyark.com/_files/ugd/510267_e5db2c82a8084abcb3c18cb6bcfcb2c3.pdf` (404)
- CSR Policy
  `https://www.kotyark.com/_files/ugd/510267_d3c9c7f77e7444a58dae23c3b4f91e0c.pdf` (404)
- Board Diversity Policy
  `https://www.kotyark.com/_files/ugd/510267_d27c04f8f00e4b3e8ffaae42e4f685b8.pdf` (404)
- Policy on Determination of Materiality
  `https://www.kotyark.com/_files/ugd/510267_3d9c4c889a1d4d94a3f15d25a3eceaaa.pdf` (404)
- Preservation of Documents and Archival Policy
  `https://www.kotyark.com/_files/ugd/510267_d4cfba0ecc444b2d92f8d3b5f8b3b3d5.pdf` (404)
- Risk Management Policy
  `https://www.kotyark.com/_files/ugd/510267_e9f84e85f6234e079b44b3281ec1a6cf.pdf` (404)
- Policy for Procedure of Inquiry in Case of Leak of UPSI
  `https://www.kotyark.com/_files/ugd/510267_5f5a1d0e10664f0a9b4fd59c2f6bc2c0.pdf` (404)
- Policy on Succession Planning
  `https://www.kotyark.com/_files/ugd/510267_bfa44e1b5cbf47ae8ed8dbed4ab8c0f8.pdf` (404)
- Fair Disclosure Policy
  `https://www.kotyark.com/_files/ugd/510267_ad5ea2f4c96b4e6d896b4cf5b7c4d5b3.pdf` (404)
- Code of Practices & Procedures for Fair Disclosure of UPSI
  `https://www.kotyark.com/_files/ugd/510267_afc2fb2d02d842a7bcf39d3d5f8c6e3c.pdf` (404)
- Sexual Harassment Policy (POSH)
  `https://www.kotyark.com/_files/ugd/510267_72f89a41dbbd46058bf3f621e42e0e3d.pdf` (404)
- Quality Control Policy
  `https://www.kotyark.com/_files/ugd/510267_c7f4f9e3a8b0417ba35e2c5f8d8c1e0a.pdf` (404)
- Environment & Sustainability Policy
  `https://www.kotyark.com/_files/ugd/510267_a3b8d1d5f0c64a3e91e4d8c7b5f2a1e0.pdf` (404)
- Data Privacy Policy
  `https://www.kotyark.com/_files/ugd/510267_b2c9e0d4f1a74b3f92f5e9d8c6a3b0f1.pdf` (404)

**merger-and-amalgamation** (26 broken of 26)

- Scheme of Amalgamation - Final Order
  `https://www.kotyark.com/_files/ugd/e196d6_8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d.pdf` (404)
- NCLT Order - Scheme Approval
  `https://www.kotyark.com/_files/ugd/e196d6_9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e.pdf` (404)
- Appointed Date Notification
  `https://www.kotyark.com/_files/ugd/e196d6_0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f.pdf` (404)
- Board Approval of Draft Scheme
  `https://www.kotyark.com/_files/ugd/e196d6_1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a.pdf` (404)
- Observation Letter from BSE
  `https://www.kotyark.com/_files/ugd/e196d6_2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b.pdf` (404)
- Fairness Opinion on Share Swap Ratio
  `https://www.kotyark.com/_files/ugd/e196d6_3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c.pdf` (404)
- Valuation Report
  `https://www.kotyark.com/_files/ugd/e196d6_4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d.pdf` (404)
- Scheme of Amalgamation - Draft
  `https://www.kotyark.com/_files/ugd/e196d6_5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e.pdf` (404)
- NCLT Convening Order
  `https://www.kotyark.com/_files/ugd/e196d6_6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f.pdf` (404)
- Notice to Shareholders
  `https://www.kotyark.com/_files/ugd/e196d6_7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a.pdf` (404)
- Notice to Creditors
  `https://www.kotyark.com/_files/ugd/e196d6_8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b.pdf` (404)
- Newspaper Publication - Scheme Notice (English)
  `https://www.kotyark.com/_files/ugd/e196d6_9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c.pdf` (404)
- Newspaper Publication - Scheme Notice (Hindi)
  `https://www.kotyark.com/_files/ugd/e196d6_0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d.pdf` (404)
- NCLT Order for Shareholder Meeting
  `https://www.kotyark.com/_files/ugd/e196d6_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e.pdf` (404)
- Shareholders Meeting Minutes
  `https://www.kotyark.com/_files/ugd/e196d6_b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f.pdf` (404)
- Scrutinizer Report
  `https://www.kotyark.com/_files/ugd/e196d6_c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a.pdf` (404)
- e-Voting Results
  `https://www.kotyark.com/_files/ugd/e196d6_d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b.pdf` (404)
- Compliance Certificate
  `https://www.kotyark.com/_files/ugd/e196d6_e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c.pdf` (404)
- Report of the Chairman
  `https://www.kotyark.com/_files/ugd/e196d6_f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d.pdf` (404)
- Proxy Form
  `https://www.kotyark.com/_files/ugd/e196d6_a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e.pdf` (404)
- Attendance Slip
  `https://www.kotyark.com/_files/ugd/e196d6_b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f.pdf` (404)
- Pre-Merger Shareholding Pattern
  `https://www.kotyark.com/_files/ugd/e196d6_c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a.pdf` (404)
- Post-Merger Shareholding Pattern
  `https://www.kotyark.com/_files/ugd/e196d6_d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b.pdf` (404)
- Outcome of Board Meeting - Scheme Approval
  `https://www.kotyark.com/_files/ugd/e196d6_e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c.pdf` (404)
- Independent Directors Committee Report
  `https://www.kotyark.com/_files/ugd/e196d6_f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d.pdf` (404)
- Audit Committee Recommendation
  `https://www.kotyark.com/_files/ugd/e196d6_a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e.pdf` (404)

**smart-odr** (1 broken of 1)

- Smart ODR - Circular & Details
  `https://www.kotyark.com/_files/ugd/e196d6_d2e8c3f6a91e4b2f8c7a1d5b3e9f0a4c.pdf` (404)

**unpaid-dividend** (2 broken of 2)

- Unpaid / Unclaimed Dividend - FY 2023-24
  `https://www.kotyark.com/_files/ugd/e196d6_a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9.pdf` (404)
- Unpaid / Unclaimed Dividend - FY 2022-23
  `https://www.kotyark.com/_files/ugd/510267_b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0.pdf` (404)

**postal-ballot** (3 broken of 6)

- Postal Ballot Notice - August 2024
  `https://www.kotyark.com/_files/ugd/e196d6_c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9.pdf` (404)
- Postal Ballot Voting Results - September 2024
  `https://www.kotyark.com/_files/ugd/e196d6_d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0.pdf` (404)
- Scrutinizer Report - Postal Ballot Sept 2024
  `https://www.kotyark.com/_files/ugd/e196d6_e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1.pdf` (404)

## Re-running

`npm run audit:links` can be rerun any time (it only updates `link_status`, `link_http_code`, `link_checked_at`).
