import Link from 'next/link';
import { query, queryOne } from '@/lib/db';

function DocCard({ doc, folderSlug }) {
  return (
    <Link href={`/investors/${folderSlug}/${doc.slug}`} className="doc-card">
      <div className="doc-card-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      </div>
      <div className="doc-card-info">
        <span className="doc-card-title">{doc.title}</span>
        <span className="doc-card-badge">PDF</span>
      </div>
    </Link>
  );
}

const yearOf = d => (d ? new Date(d).getUTCFullYear() : null);

function group(docs, mode) {
  if (mode === 'none') return [{ label: null, docs }];
  const map = new Map();
  for (const d of docs) {
    const key = mode === 'fy' ? (d.fy || 'Other') : String(yearOf(d.doc_date) ?? 'Other');
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(d);
  }
  const keys = [...map.keys()].sort((a, b) => (a === 'Other') - (b === 'Other') || b.localeCompare(a));
  return keys.map(k => ({ label: k, docs: map.get(k) }));
}

export default async function DocumentList({ props, preview }) {
  const folderId = String(props.folderId || '');
  let folder = null;
  let docs = [];
  let failed = false;
  if (folderId) {
    try {
      folder = await queryOne('SELECT id, slug, name, group_by FROM document_folders WHERE id = $1 AND visible', [folderId]);
      if (folder) {
        const limit = Number(props.limit) > 0 ? Number(props.limit) : null;
        docs = await query(
          `SELECT id, title, slug, fy, doc_date FROM documents
            WHERE folder_id = $1 AND status = 'published'
            ORDER BY sort_order, doc_date DESC NULLS LAST, title
            ${limit ? 'LIMIT $2' : ''}`,
          limit ? [folderId, limit] : [folderId]);
      }
    } catch (err) {
      console.error('[cms] document_list query failed:', err.message);
      failed = true;
    }
  }
  const mode = !props.groupBy || props.groupBy === 'folder-default' ? (folder?.group_by || 'none') : props.groupBy;
  const groups = group(docs, mode);

  if (!folder && !preview) return null;
  return (
    <section className="section">
      <div className="container">
        {props.heading && <h2 style={{ marginBottom: '24px' }}>{props.heading}</h2>}
        {preview && !folder && <div className="cms-block-warning">Document list: folder not found{failed ? ' (database error)' : ''}.</div>}
        {folder && docs.length === 0 && <p className="cms-empty">No documents have been published in this section yet.</p>}
        {groups.map((g, i) => (
          <div className="cms-doc-group" key={g.label ?? i}>
            {g.label && <h3>{g.label}</h3>}
            <div className="doc-card-grid">
              {g.docs.map(d => <DocCard key={d.id} doc={d} folderSlug={folder.slug} />)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
