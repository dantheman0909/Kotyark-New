// Dashboard queries, shared by the API route and the /admin server component.
import { query, queryOne } from '@/lib/db';
import { LINK_ATTENTION_SQL } from '@/lib/documents';

export async function loadDashboard({ includeAudit = false } = {}) {
  const [counts, recent, broken, staleDrafts] = await Promise.all([
    queryOne(
      `SELECT
         (SELECT count(*)::int FROM pages WHERE status = 'published') AS published_pages,
         (SELECT count(*)::int FROM pages WHERE status = 'draft') AS draft_pages,
         (SELECT count(*)::int FROM documents) AS documents,
         (SELECT count(*)::int FROM documents d WHERE ${LINK_ATTENTION_SQL}) AS broken_links,
         (SELECT count(*)::int FROM users WHERE active) AS users,
         (SELECT count(*)::int FROM enquiries WHERE status = 'new') AS new_enquiries`),
    includeAudit ? query(
      `SELECT id, user_email, action, entity, entity_id, summary, created_at
         FROM audit_log ORDER BY id DESC LIMIT 15`) : Promise.resolve(null),
    query(
      `SELECT d.id, d.title, d.external_url, d.link_http_code, d.link_checked_at, f.name AS folder_name, f.slug AS folder_slug
         FROM documents d LEFT JOIN document_folders f ON f.id = d.folder_id
        WHERE ${LINK_ATTENTION_SQL}
        ORDER BY d.link_checked_at DESC NULLS LAST, d.title LIMIT 10`),
    query(
      `SELECT id, title, path, updated_at FROM pages
        WHERE status = 'draft' AND updated_at < now() - interval '14 days'
        ORDER BY updated_at ASC LIMIT 10`),
  ]);
  return { counts, ...(recent ? { recent } : {}), broken, staleDrafts }; // `recent` only for audit:read
}
