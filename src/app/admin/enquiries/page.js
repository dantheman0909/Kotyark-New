import { redirect } from 'next/navigation';
import { getCurrentUser, can } from '@/lib/auth';
import EnquiriesClient from './EnquiriesClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Enquiries' };

export default async function EnquiriesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!can(user, 'enquiries:read')) redirect('/admin');
  return <EnquiriesClient canWrite={can(user, 'enquiries:write')} canDelete={can(user, 'enquiries:delete')} />;
}
