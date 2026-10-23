import { redirect } from 'next/navigation';
import { getCurrentUser, can } from '@/lib/auth';
import NavEditor from './_components/NavEditor';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Navigation', robots: { index: false, follow: false } };

export default async function AdminNavigationPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!can(user, 'nav:write')) redirect('/admin');
  return <NavEditor />;
}
