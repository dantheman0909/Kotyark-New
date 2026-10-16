import { redirect } from 'next/navigation';
import { getCurrentUser, can } from '@/lib/auth';
import UsersClient from './UsersClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Users' };

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!can(user, 'users:manage')) redirect('/admin');
  return <UsersClient meId={user.id} />;
}
