import { redirect } from 'next/navigation';
import { getCurrentUser, can } from '@/lib/auth';
import MediaClient from './MediaClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Media' };

export default async function MediaPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!can(user, 'media:write')) redirect('/admin');
  return <MediaClient />;
}
