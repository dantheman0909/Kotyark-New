import { redirect } from 'next/navigation';
import { getCurrentUser, can } from '@/lib/auth';
import PageEditor from '../_components/PageEditor';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit page', robots: { index: false, follow: false } };

export default async function AdminPageEditor({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!can(user, 'pages:write')) redirect('/admin');
  const { id } = await params;
  return <PageEditor id={id} />;
}
