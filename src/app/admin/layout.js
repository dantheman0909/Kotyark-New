import { redirect } from 'next/navigation';
import { getCurrentUser, can, PERMISSIONS } from '@/lib/auth';
import AdminShell from '@/components/admin/AdminShell';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: { default: 'Admin', template: '%s | Admin' },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const permissions = Object.keys(PERMISSIONS).filter((c) => can(user, c));
  return (
    <AdminShell
      user={{ id: user.id, email: user.email, name: user.name, role: user.role }}
      permissions={permissions}
    >
      {children}
    </AdminShell>
  );
}
