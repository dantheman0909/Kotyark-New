import PageEditor from '../_components/PageEditor';

export const metadata = { title: 'Edit page', robots: { index: false, follow: false } };

export default async function AdminPageEditor({ params }) {
  const { id } = await params;
  return <PageEditor id={id} />;
}
