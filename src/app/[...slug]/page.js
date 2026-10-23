import { notFound, permanentRedirect, redirect } from 'next/navigation';
import PageView from '@/components/blocks/PageView';
import { findRedirect, getPublishedPageByPath, normalizePath, pageMetadata } from '@/lib/pages';

// Catch-all for CMS pages. Static routes (/admin, /investors/..., /files, /media, /search ...) win over this.
export const dynamic = 'force-dynamic';

function pathFrom(slug) {
  const parts = (slug || []).map(s => { try { return decodeURIComponent(s); } catch { return s; } });
  return normalizePath('/' + parts.join('/'));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = await getPublishedPageByPath(pathFrom(slug));
  if (!page) return { title: 'Page not found', robots: { index: false, follow: false } };
  return pageMetadata(page);
}

export default async function CmsPage({ params }) {
  const { slug } = await params;
  const path = pathFrom(slug);
  const page = await getPublishedPageByPath(path);
  if (page) return <PageView page={page} />;

  const hit = await findRedirect(path);
  if (hit && hit.to !== path) {
    if (hit.code === 302) redirect(hit.to);
    permanentRedirect(hit.to);
  }
  notFound();
}
