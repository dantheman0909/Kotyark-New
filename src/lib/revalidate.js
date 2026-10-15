// Cache invalidation after a publish/mutation. Every mutation that changes
// public output calls one of these.
import { revalidatePath, revalidateTag } from 'next/cache';

export const TAGS = { nav: 'nav', pages: 'pages', documents: 'documents', settings: 'settings', redirects: 'redirects' };

/** Revalidate a page path, all its ancestors, nav, and sitemap. */
export function revalidatePagePath(pagePath) {
  const parts = (pagePath || '/').split('/').filter(Boolean);
  revalidatePath('/');
  for (let i = 1; i <= parts.length; i++) revalidatePath('/' + parts.slice(0, i).join('/'));
  revalidatePath('/sitemap.xml');
  revalidateTag(TAGS.pages, 'max');
  revalidateTag(TAGS.nav, 'max');
}

/** Revalidate investor pages for a folder (and the investors hub + sitemap). */
export function revalidateFolder(folderSlug) {
  revalidatePath('/investors');
  if (folderSlug) revalidatePath(`/investors/${folderSlug}`);
  revalidatePath('/investors/[section]', 'page');
  revalidatePath('/investors/[section]/[doc]', 'page');
  revalidatePath('/sitemap.xml');
  revalidateTag(TAGS.documents, 'max');
}
