import { redirect } from 'next/navigation';
import { getCurrentUser, can } from '@/lib/auth';
import AuditClient from './AuditClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Audit log' };

export default async function AuditPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!can(user, 'audit:read')) redirect('/admin');
  return <AuditClient />;
}
