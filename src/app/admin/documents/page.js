import { redirect } from 'next/navigation';
import { getCurrentUser, can } from '@/lib/auth';
import DocumentsClient from './DocumentsClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Documents', robots: { index: false, follow: false } };

export default async function AdminDocumentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!can(user, 'documents:write')) redirect('/admin');
  return <DocumentsClient />;
}
