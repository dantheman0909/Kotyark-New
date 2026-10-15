import { redirect } from 'next/navigation';
import { getCurrentUser, can } from '@/lib/auth';
import PagesTree from './_components/PagesTree';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pages', robots: { index: false, follow: false } };

export default async function AdminPagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!can(user, 'pages:write')) redirect('/admin');
  return <PagesTree />;
}
