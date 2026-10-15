import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo';
import { getBreadcrumbs, getCmsOverride } from '@/lib/pages';
import BlockRenderer from './BlockRenderer';

/** A CMS page: its blocks plus BreadcrumbList JSON-LD. */
export default async function PageView({ page, preview = false }) {
  let crumbs = [];
  if (!preview) {
    try { crumbs = await getBreadcrumbs(page); } catch (err) { console.error('[cms] breadcrumbs failed:', err.message); }
  }
  return (
    <>
      {crumbs.length > 1 && <JsonLd data={breadcrumbJsonLd(crumbs)} />}
      <BlockRenderer blocks={page.blocks} preview={preview} />
    </>
  );
}

/**
 * Static-route wrapper: render the published CMS page at `path` if one exists,
 * otherwise the legacy hard-coded page passed as children.
 */
export async function CmsOrLegacy({ path, children }) {
  const page = await getCmsOverride(path);
  if (page) return <PageView page={page} />;
  return children;
}
