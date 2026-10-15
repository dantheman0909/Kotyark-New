# Wiring the generated page files

Wix generates one code file per page in `src/pages/` when the page is created in the editor
(`<Page Name>.<id>.js`). **Never create or rename them by hand.** Paste the snippet below into the matching
generated file; all logic lives in `src/public/pages/`.

Every `init` takes `$w` explicitly (`init($w)`), because `$w` is not guaranteed to be a global inside
`public/` modules. This differs slightly from the shorter `$w.onReady(init)` form in the root CLAUDE.md; the
modules still fall back to a global `$w` if one exists.

| Wix page | Snippet for the generated file |
|---|---|
| Master page (`masterPage.js`) | `import { init } from 'public/pages/masterpage';`<br>`$w.onReady(() => init($w));` |
| `/investors` (static page "Investors") | `import { init } from 'public/pages/investorsHub';`<br>`$w.onReady(() => init($w));` |
| Dynamic page `/investors/{slug}` ("Investor Section (InvestorSections)") | `import { init } from 'public/pages/investorSection';`<br>`$w.onReady(() => init($w));` |
| Optional standalone `/investors/sebi-lodr` static page (only if you do not use the embedded table) | `import { init } from 'public/pages/sebiLodr';`<br>`$w.onReady(() => init($w));` |

## Editor setup

**Dynamic page.** Add a Dynamic Item page connected to `InvestorSections`, URL `/investors/{slug}` (prefix
`investors`, field `slug`). Name its dataset **`dynamicDataset`** (element ID). All 15 sections, including Reg. 46,
use this one design: when `layout = disclosures` the code collapses `#docsBox` and shows `#reg46Box` instead.
The static `/investors` hub page has no conflict with the dynamic prefix. Do not also create a static page at
`/investors/sebi-lodr` unless you want the standalone variant (a static page would shadow the dynamic one).

**Repeaters.** Set a unique ID per element in the Properties panel. The code sets `onItemReady` before `data`, so
the repeaters can be empty in the editor. Nested repeaters: place the inner repeater inside the outer repeater item.

**Collapsed-by-default elements** (set "Hidden on load" or collapsed in the editor): `#errorState`, `#emptyState`,
`#docUpdating`, `#reg46Box` (dynamic page), `#docsBox` can be visible. `#loadingState` visible until data arrives.

**Custom class** `active` must exist in the editor CSS/`global.css` for the sidebar highlight (the code adds it with
`customClassList.add('active')`).

## Element ID contract

IDs inside repeater items are used through `$item(...)`; IDs are unique per repeater template.

### Dynamic page `/investors/{slug}` (`investorSection.js`)

| ID | Type | Purpose |
|---|---|---|
| `#dynamicDataset` | Dataset (InvestorSections) | current section |
| `#sectionTitle` | Text (H1) | `pageHeading` (falls back to `title`) |
| `#breadcrumbCurrent` | Text | last breadcrumb crumb |
| `#sectionIntro` | Rich text / Text | `introHtml` (set via `.html`) |
| `#loadingState` | any | hidden when loaded |
| `#errorState` | Box/Text, hidden | shown on any failure |
| `#errorMessage` | Text (inside errorState) | message |
| `#emptyState` | Text, hidden | no published documents |
| `#docsBox` | Container | wraps the documents UI (collapsed for Reg. 46) |
| `#docGroupsRepeater` | Repeater (outer) | one item per FY group (or one group when `groupBy = none`) |
| `#fyHeader` | Text (in outer item) | group title; collapsed when empty |
| `#docsRepeater` | Repeater (inner, in outer item) | documents of the group |
| `#docTitle` | Text (in inner item) | title |
| `#docDate` | Text (in inner item), optional | formatted `documentDate` |
| `#docLink` | **Button** (in inner item) | link = Document file or working legacy URL, opens in new tab |
| `#docUpdating` | Text (in inner item), hidden | "File being updated" (no link) |
| `#sidebarRepeater` | Repeater | sections with `visibleInMenu`, by `sortOrder` |
| `#sidebarLink` | **Button** (in item) | label + link; gets class `active` for the current one |
| `#reg46Box` | Container, hidden | wraps the Reg. 46 table (shown when `layout = disclosures`) |
| `#reg46Repeater` | Repeater (inside `#reg46Box`) | table rows |
| `#reg46SrNo` `#reg46Particular` `#reg46Regulation` | Text (in item) | columns |
| `#reg46Link` | Button (in item) | "View" link |
| `#reg46Na` | Text (in item) | dash shown when `linkUrl` is blank |

### Hub `/investors` (`investorsHub.js`)

`#hubGroupsRepeater` (outer: one per group) containing `#groupTag`, `#groupTitle`, `#groupDescription` and the inner
`#sectionsRepeater`, whose items contain `#cardTitle`, `#cardDescription`, `#cardLink` (Button or the whole card
as a link). Also `#loadingState`, `#errorState`, `#errorMessage`.

### Standalone SEBI page (`sebiLodr.js`)

`#reg46Repeater`, `#reg46SrNo`, `#reg46Particular`, `#reg46Regulation`, `#reg46Link`, `#reg46Na`, `#loadingState`,
`#errorState`, `#errorMessage`.

## Must be done by hand in the editor

1. Create the three collections (see `wix/docs/cms-collections.md`), set permissions, import the CSVs.
2. Create the dynamic page, hub page and optional Reg. 46 page; set the element IDs above; paste the snippets.
3. Set the dataset to read `InvestorSections`; turn on Sitemap for the dynamic page in SEO settings.
4. Add the `active` class; add the Velo `jobs.config` via Git sync (it lives in `src/backend/`).
5. Upload the real PDFs into each `InvestorDocuments` item's `file` field (the legacy links are 96/104 broken).
