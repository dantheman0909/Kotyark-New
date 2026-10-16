import { notFound, redirect } from 'next/navigation';
import PageView from '@/components/blocks/PageView';
import '@/components/blocks/blocks.css';
import { getCurrentUser } from '@/lib/auth';
import { getPageByPreviewToken, pageMetadata } from '@/lib/pages';

// Admin-only preview of a page's WORKING copy (draft or published). Never indexed.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { token } = await params;
  const user = await getCurrentUser();
  const page = user ? await getPageByPreviewToken(token) : null;
  const base = page ? pageMetadata(page, { noindex: true }) : { title: 'Preview' };
  return { ...base, robots: { index: false, follow: false, nocache: true } };
}

export default async function PreviewPage({ params }) {
  const { token } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const page = await getPageByPreviewToken(token);
  if (!page) notFound();
  return (
    <>
      <PageView page={page} preview />
      <div className="cms-preview-banner" role="status">
        <strong>Preview</strong>
        <span>{page.status === 'published' ? 'Working copy (may differ from the live page)' : 'Draft, not published'} · {page.title}</span>
        <a href={`/admin/pages/${page.id}`}>Back to editor</a>
      </div>
    </>
  );
}
