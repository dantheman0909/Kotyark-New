'use client';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PopupHost from '@/components/popups/PopupHost';
import Motion from '@/components/site/Motion';

// Client half of LayoutShell: hides the public chrome on admin and login routes.
export default function ShellClient({ headerNav, footerNav, popups, popupsPath, quote = null, year, children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/login');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="kd-site">
        <a href="#main-content" className="kd-sr">Skip to content</a>
        <Navbar items={headerNav} quote={quote} />
        <main id="main-content">{children}</main>
        <Footer nav={footerNav} year={year} />
        <Motion />
      </div>
      <PopupHost popups={popups} initialPath={popupsPath} />
    </>
  );
}
