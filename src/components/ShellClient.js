'use client';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Client half of LayoutShell: hides the public chrome on admin and login routes.
export default function ShellClient({ headerNav, footerNav, children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/login');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar items={headerNav} />
      <main id="main-content">{children}</main>
      <Footer nav={footerNav} />
    </>
  );
}
