import { redirect } from 'next/navigation';
import { getCurrentUser, can } from '@/lib/auth';
import RedirectsManager from './_components/RedirectsManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Redirects', robots: { index: false, follow: false } };

export default async function AdminRedirectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!can(user, 'redirects:write')) redirect('/admin');
  return <RedirectsManager />;
}
