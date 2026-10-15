import { connection } from 'next/server';
import ShellClient from '@/components/ShellClient';
import { loadSiteNav } from '@/lib/pages';

// Server component used unchanged by src/app/layout.js. Loads header/footer navigation from the
// database on each request (so a nav edit shows immediately and no build-time DB access is needed),
// falling back to the hard-coded menu if the table is empty or the database is unreachable.
export default async function LayoutShell({ children }) {
  await connection();
  const nav = await loadSiteNav();
  return <ShellClient headerNav={nav.header} footerNav={nav.footer}>{children}</ShellClient>;
}
