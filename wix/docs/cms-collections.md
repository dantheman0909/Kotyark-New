# CMS collections (Wix)

Three collections hold everything the investor pages need. Generated import files:
`wix/data/collections/*.csv` (rebuild with `node wix/data/build-collections.mjs`; sources
`wix/data/source/content-snapshot.json` and `link-audit-2026-10-15.csv`).

**Permissions (all three):** Read = Anyone, Insert / Update / Delete = Admin.
Create each collection with the exact ID below, and name each field with the key shown (Wix derives the key from
the name; use the same text so keys match the CSV headers and the code).
CSV headers equal the field keys.

Not CMS-managed (kept static in the editor): leadership, stat tiles, hero copy, footer/nav. They are not edited
often enough to justify collections.

## InvestorSections (15 rows)

Primary field: `title` (must be unique: it is the target of the Reference import).

| Key | Type | Required | Notes |
|---|---|---|---|
| `title` | Text (primary) | yes | Sidebar label and hub card title, e.g. "Board Meetings". Unique. |
| `slug` | Text | yes | **Unique.** URL segment of `/investors/<slug>`. Wix has no unique constraint: do not duplicate. |
| `description` | Text | yes | Hub card text. |
| `introHtml` | Rich text | no | Intro under the heading (Smart ODR includes its "How to file a complaint?" steps). |
| `groupBy` | Text | yes | `none` or `fy`. |
| `visibleInMenu` | Boolean | yes | Show in sidebar. |
| `sortOrder` | Number | yes | Sidebar order. |
| `seoTitle` | Text | no | Title tag. |
| `seoDescription` | Text | no | Meta description. |
| `pageHeading` | Text | no | H1 when it differs from `title` (e.g. "Audited Financial Statements of Subsidiaries"). Added beyond the brief; verbatim from the reference. |
| `layout` | Text | yes | `documents` or `disclosures` (Reg. 46 table). Added so all 15 share one dynamic page. |
| `hubGroup` | Text | yes | Hub heading the card sits under (Regulatory Filings, Financial Statements, Corporate Governance, Other Filings). |
| `hubOrder` | Number | yes | Order of cards inside the hub group. |

Note: the reference hub shows "Memorandum & Articles of Association" for the MOA card while the sidebar says
"MOA - AOA"; the CMS uses one `title` ("MOA - AOA"). Edit `title` if you prefer the long form in both places.

## InvestorDocuments (104 rows)

Primary field: `title`.

| Key | Type | Required | Notes |
|---|---|---|---|
| `title` | Text (primary) | yes | Verbatim. |
| `section` | Reference -> InvestorSections | yes | CSV holds the target's primary value (section `title`). |
| `file` | Document | no | Upload the real PDF in Wix. Wins over `legacyUrl`. **Not in the CSV** (empty). |
| `legacyUrl` | URL | no | Old `kotyark.com/_files/...` link from the snapshot. |
| `linkStatus` | Text | yes | `ok` / `broken` / `unchecked` (from the 2026-10-15 audit; refreshed weekly by `backend/link-check`). |
| `fy` | Text | no | e.g. `FY 2023-24` (20 documents). |
| `documentDate` | Date and Time | no | Stored as noon UTC so no timezone shifts the day. |
| `sortOrder` | Number | yes | Order within a section (from the reference). |
| `description` | Text | no | Empty in the import. |
| `published` | Boolean | yes | All `true`. |

Link rule on the page: `file` present -> its URL; else `legacyUrl` unless `linkStatus = broken`; else "File being
updated" with no link. Item count: 8 `ok`, 96 `broken` (no working link until PDFs are uploaded).

## Reg46Disclosures (30 rows)

Primary field: rename the default `Title` field to **`particular`** (key `particular`).

| Key | Type | Required | Notes |
|---|---|---|---|
| `srNo` | Text | yes | `A` ... `Z`, `ZA`, `L(i)` etc. |
| `particular` | Text (primary) | yes | Verbatim. |
| `regulation` | Text | yes | e.g. `Reg. 46(2)(a)`. |
| `linkUrl` | Text | no | Site-relative path (`/about`, `/investors/company-policies`). Blank = NA (6 rows). Text not URL type, because the Wix URL field expects absolute URLs. |
| `sortOrder` | Number | yes | Row order. |

## Import notes (verify in the Wix import dialog)

- Import order: `InvestorSections` first, then `InvestorDocuments` (so the reference resolves), then `Reg46Disclosures`.
- In the mapping step match each CSV column to the field of the same key; for `section` choose the Reference
  field. Dates are ISO 8601; booleans `true`/`false`; `introHtml` contains HTML (check it renders after import).
- Document placeholders in the reference (FY cards on Board Meetings, subsidiaries on Audited Financial
  Statements, EOGM entries, Integrated Filling) had no documents, so those four sections import with zero rows
  and show the `#emptyState`.
- Two source documents appear in two sections (Postal Ballot / Migration To Main Board): each has its own row.
- I could not verify the CSV import specification against Wix docs (the support page was not reachable); treat the
  mapping step as the check and re-run the generator if headers need renaming.
