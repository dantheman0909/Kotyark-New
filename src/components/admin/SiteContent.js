'use client';
import { useState, useEffect, useCallback } from 'react';
import RichTextEditor from './RichTextEditor';

// Editable content blocks for existing bespoke pages (About / Products).
// Each block renders above the built-in page content when non-empty.
const BLOCKS = [
  { key: 'about-intro', title: 'About Page — Intro Block', page: '/about' },
  { key: 'products-intro', title: 'Products Page — Intro Block', page: '/products' },
];

export default function SiteContent() {
  const [selected, setSelected] = useState(BLOCKS[0]);
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const load = useCallback(async (key) => {
    setLoading(true);
    setSavedAt(null);
    try {
      const res = await fetch(`/api/content-blocks/${key}`);
      if (res.ok) {
        const data = await res.json();
        setHtml(data.block?.html || '');
      } else {
        setHtml('');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(selected.key); }, [selected, load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/content-blocks/${selected.key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, title: selected.title }),
      });
      if (res.ok) setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-body">
      <aside className="admin-folders">
        <div className="admin-panel-header"><h2>Site Content</h2></div>
        <div className="admin-folder-list">
          {BLOCKS.map((b) => (
            <div key={b.key} className={`admin-folder-item ${selected.key === b.key ? 'active' : ''}`} onClick={() => setSelected(b)} style={{ paddingLeft: '24px' }}>
              <div className="admin-folder-info">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <span className="admin-folder-name">{b.title}</span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="admin-documents">
        <div className="admin-page-editor">
          <div className="admin-panel-header">
            <div>
              <h2>{selected.title}</h2>
              <span className="admin-slug">Shown at the top of <code>{selected.page}</code>. Leave empty to use the built-in copy.</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <a href={selected.page} target="_blank" rel="noopener noreferrer" className="admin-link-btn">View</a>
              <button onClick={handleSave} className="admin-save-btn" disabled={saving || loading}>{saving ? 'Saving…' : 'Save Block'}</button>
            </div>
          </div>
          {savedAt && <p className="admin-saved-note">✓ Saved at {savedAt.toLocaleTimeString()}</p>}
          {loading ? <p className="admin-empty">Loading…</p> : <RichTextEditor value={html} onChange={setHtml} />}
        </div>
      </main>
    </div>
  );
}
