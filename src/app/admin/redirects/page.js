import RedirectsManager from './_components/RedirectsManager';

export const metadata = { title: 'Redirects', robots: { index: false, follow: false } };

export default function AdminRedirectsPage() {
  return <RedirectsManager />;
}
