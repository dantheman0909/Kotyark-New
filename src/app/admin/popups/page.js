import { redirect } from 'next/navigation';
import { getCurrentUser, can } from '@/lib/auth';
import PopupsClient from './PopupsClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pop-ups', robots: { index: false, follow: false } };

export default async function AdminPopupsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!can(user, 'popups:write')) redirect('/admin');
  return <PopupsClient />;
}
