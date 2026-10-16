import { redirect } from 'next/navigation';
import { getCurrentUser, can } from '@/lib/auth';
import PopupEditor from '../PopupEditor';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit pop-up', robots: { index: false, follow: false } };

export default async function AdminPopupEditorPage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!can(user, 'popups:write')) redirect('/admin');
  const { id } = await params;
  return <PopupEditor id={id} />;
}
