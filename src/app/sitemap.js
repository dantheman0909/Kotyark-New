import getDb from '@/lib/db';

const BASE_URL = process.env.SITE_URL || 'https://www.kotyark.com';

export default async function sitemap() {
  const db = getDb();

  // Static pages
  const staticPages = [
    { url: `${BASE_URL}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/products`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/sustainability`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/programs`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/investors`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
  ];

  // Dynamic investor pages from CMS folders
  const folders = db.prepare('SELECT slug, created_at FROM folders WHERE parent_id IS NOT NULL ORDER BY sort_order').all();
  const folderPages = folders.map(f => ({
    url: `${BASE_URL}/investors/${f.slug}`,
    lastModified: new Date(f.created_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Documents — include external URLs for discoverability
  const docs = db.prepare(`
    SELECT d.title, d.file_path, d.is_external, d.created_at, f.slug as folder_slug, f.name as folder_name
    FROM documents d
    JOIN folders f ON f.id = d.folder_id
    ORDER BY d.created_at DESC
  `).all();

  const docPages = docs
    .filter(d => d.is_external)
    .map(d => ({
      url: d.file_path,
      lastModified: new Date(d.created_at),
      changeFrequency: 'yearly',
      priority: 0.5,
    }));

  return [...staticPages, ...folderPages, ...docPages];
}
