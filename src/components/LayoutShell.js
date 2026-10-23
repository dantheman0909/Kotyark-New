import { headers } from 'next/headers';
import { connection } from 'next/server';
import ShellClient from '@/components/ShellClient';
import { loadSiteNav } from '@/lib/pages';
import { loadActivePopups } from '@/lib/popups';
import { getQuote } from '@/lib/stock';

// The share price must never delay or break a page: any failure or a slow feed just hides the nav ticker.
async function safeQuote() {
  try {
    return await Promise.race([getQuote(), new Promise((resolve) => setTimeout(() => resolve(null), 2000))]);
  } catch {
    return null;
  }
}

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
  // The admin and login screens show no ticker: skip the quote there entirely.
  const showTicker = !(path && (path === '/admin' || path.startsWith('/admin/') || path === '/login' || path.startsWith('/login/')));
  // Computed once here (server, IST) and passed down, so server and client render the same year around New Year.
  const year = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric' }).format(new Date());
  const [nav, popups, quote] = await Promise.all([loadSiteNav(), loadActivePopups(path), showTicker ? safeQuote() : null]);
  return <ShellClient headerNav={nav.header} footerNav={nav.footer} popups={popups} popupsPath={path} quote={quote} year={year}>{children}</ShellClient>;
}
