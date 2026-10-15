import { headers } from 'next/headers';
import { connection } from 'next/server';
import ShellClient from '@/components/ShellClient';
import { loadSiteNav } from '@/lib/pages';
import { loadActivePopups } from '@/lib/popups';

// Server component used unchanged by src/app/layout.js. Loads header/footer navigation from the
// database on each request (so a nav edit shows immediately and no build-time DB access is needed),
// falling back to the hard-coded menu if the table is empty or the database is unreachable.
export default async function LayoutShell({ children }) {
  await connection();
  // loadActivePopups never throws (returns [] on any DB problem), so pop-ups can never break the site.
  // The proxy stamps the request path, so only the pop-ups that apply to THIS page are sent in the HTML.
  // (The client fetches the full active list once, on its first navigation to another page.)
  // The matcher skips some routes (/api, files), so the header may be absent or client-supplied: validate it.
  const rawPath = (await headers()).get('x-kp-path');
  const path = typeof rawPath === 'string' && rawPath.startsWith('/') && rawPath.length <= 512 && !/[\u0000-\u001f\u007f]/.test(rawPath) ? rawPath : null;
  const [nav, popups] = await Promise.all([loadSiteNav(), loadActivePopups(path)]);
  return <ShellClient headerNav={nav.header} footerNav={nav.footer} popups={popups} popupsPath={path}>{children}</ShellClient>;
}
