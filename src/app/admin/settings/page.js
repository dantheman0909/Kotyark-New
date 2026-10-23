import { redirect } from 'next/navigation';
import { getCurrentUser, can } from '@/lib/auth';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return <SettingsClient canEdit={can(user, 'settings:write')} />;
}
