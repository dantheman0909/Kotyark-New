import PagesTree from './_components/PagesTree';

export const metadata = { title: 'Pages', robots: { index: false, follow: false } };

export default function AdminPagesPage() {
  return <PagesTree />;
}
