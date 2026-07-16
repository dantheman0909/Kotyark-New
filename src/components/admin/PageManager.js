'use client';
import { useState, useEffect, useCallback } from 'react';
import RichTextEditor from './RichTextEditor';

const INVESTOR_ROOT_ID = 'inv-root';

// Manage investor-section pages: rich content + metadata + attached documents.
export default function PageManager() {
  const [pages, setPages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [docs, setDocs] = useState([]);

  // Editor form state
  const [name, setName] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [visible, setVisible] = useState(true);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  // New page + document add state
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [docUrl, setDocUrl] = useState('');
  const [docMode, setDocMode] = useState('file');
  const [busy, setBusy] = useState(false);

  const loadPages = useCallback(async () => {
    const res = await fetch('/api/folders');
    const data = await res.json();
    const investorPages = (data.folders || []).filter((f) => f.parent_id === INVESTOR_ROOT_ID);
    setPages(investorPages);
    return investorPages;
  }, []);

  const loadDocs = useCallback(async (folderId) => {
    if (!folderId) return setDocs([]);
    const res = await fetch(`/api/documents?folderId=${folderId}`);
    const data = await res.json();
    setDocs(data.documents || []);
  }, []);

  useEffect(() => { loadPages(); }, [loadPages]);

  const selected = pages.find((p) => p.id === selectedId) || null;

  const selectPage = (page) => {
    setSelectedId(page.id);
    setName(page.name || '');
    setMetaDescription(page.meta_description || '');
    setVisible(!!page.visible_in_menu);
    setContent(page.content || '');
    setSavedAt(null);
    loadDocs(page.id);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/folders/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, metaDescription, visibleInMenu: visible, content }),
      });
      if (res.ok) {
        const updated = await loadPages();
        const still = updated.find((p) => p.id === selected.id);
        if (still) setSelectedId(still.id);
        setSavedAt(new Date());
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, parentId: INVESTOR_ROOT_ID, visibleInMenu: true }),
      });
      const data = await res.json();
      if (res.ok && data.folder) {
        setShowNew(false);
        setNewName('');
        const updated = await loadPages();
        const created = updated.find((p) => p.id === data.folder.id);
        if (created) selectPage(created);
      } else {
        alert(data.error || 'Could not create page');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDeletePage = async (page) => {
    if (!confirm(`Delete the page "${page.name}" and all its documents?`)) return;
    await fetch(`/api/folders/${page.id}`, { method: 'DELETE' });
    if (selectedId === page.id) { setSelectedId(null); setDocs([]); }
    loadPages();
  };

  const handleAddDoc = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('folderId', selected.id);
      fd.append('title', docTitle);
      if (docMode === 'file' && docFile) fd.append('file', docFile);
      else if (docMode === 'url' && docUrl) fd.append('externalUrl', docUrl);
      else { setBusy(false); return; }
      const res = await fetch('/api/documents', { method: 'POST', body: fd });
      if (res.ok) {
        setDocTitle(''); setDocFile(null); setDocUrl('');
        loadDocs(selected.id);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteDoc = async (id) => {
    if (!confirm('Delete this document?')) return;
    await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    loadDocs(selected.id);
  };

  return (
    <div className="admin-body">
      <aside className="admin-folders">
        <div className="admin-panel-header">
          <h2>Investor Pages</h2>
          <button onClick={() => setShowNew(true)} className="admin-add-btn" title="New page">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {showNew && (
          <form onSubmit={handleCreate} className="admin-inline-form">
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Page title..." autoFocus required />
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Appears under Investor Relations at <code>/investors/&lt;slug&gt;</code>.
            </p>
            <div className="admin-inline-actions">
              <button type="submit" className="admin-save-btn" disabled={busy}>Create</button>
              <button type="button" onClick={() => { setShowNew(false); setNewName(''); }} className="admin-cancel-btn">Cancel</button>
            </div>
          </form>
        )}

        <div className="admin-folder-list">
          {pages.length === 0 ? (
            <p className="admin-empty">No pages yet. Create one to get started.</p>
          ) : (
            pages.map((p) => (
              <div key={p.id} className={`admin-folder-item ${selectedId === p.id ? 'active' : ''}`} onClick={() => selectPage(p)} style={{ paddingLeft: '24px' }}>
                <div className="admin-folder-info">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className="admin-folder-name">{p.name}</span>
                  {!p.visible_in_menu && <span className="admin-tag hidden-tag">Hidden</span>}
                </div>
                <div className="admin-folder-actions" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleDeletePage(p)} title="Delete page" className="admin-icon-btn admin-delete-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      <main className="admin-documents">
        {selected ? (
          <div className="admin-page-editor">
            <div className="admin-panel-header">
              <div>
                <h2>Edit Page</h2>
                <span className="admin-slug">/investors/{selected.slug}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <a href={`/investors/${selected.slug}`} target="_blank" rel="noopener noreferrer" className="admin-link-btn">View</a>
                <button onClick={handleSave} className="admin-save-btn" disabled={saving}>{saving ? 'Saving…' : 'Save Page'}</button>
              </div>
            </div>
            {savedAt && <p className="admin-saved-note">✓ Saved at {savedAt.toLocaleTimeString()}</p>}

            <div className="form-group">
              <label>Page Title</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Meta Description (SEO)</label>
              <input type="text" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} placeholder="Short description for search engines…" />
            </div>
            <label className="admin-checkbox">
              <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
              Show in Investor Relations menu
            </label>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label>Page Content</label>
              <RichTextEditor value={content} onChange={setContent} />
            </div>

            <div className="admin-page-docs">
              <h3>Documents on this page</h3>
              <form onSubmit={handleAddDoc} className="admin-doc-add">
                <div className="admin-upload-tabs">
                  <button type="button" className={`admin-tab ${docMode === 'file' ? 'active' : ''}`} onClick={() => setDocMode('file')}>📎 File</button>
                  <button type="button" className={`admin-tab ${docMode === 'url' ? 'active' : ''}`} onClick={() => setDocMode('url')}>🔗 URL</button>
                </div>
                <input type="text" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="Document title…" required />
                {docMode === 'file' ? (
                  <input key="docfile" type="file" onChange={(e) => setDocFile(e.target.files[0])} required />
                ) : (
                  <input key="docurl" type="url" value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="https://…" required />
                )}
                <button type="submit" className="admin-save-btn" disabled={busy}>Add</button>
              </form>

              <div className="admin-doc-list">
                {docs.length === 0 ? (
                  <p className="admin-empty">No documents yet.</p>
                ) : (
                  docs.map((doc) => (
                    <div key={doc.id} className="admin-doc-item">
                      <div className="admin-doc-info">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                        </svg>
                        <div>
                          <span className="admin-doc-title">{doc.title}</span>
                          <span className="admin-doc-meta">{doc.is_external ? '🔗 External' : `📎 ${(doc.file_size / 1024).toFixed(1)} KB`}</span>
                        </div>
                      </div>
                      <div className="admin-doc-actions">
                        <a href={doc.file_path} target="_blank" rel="noopener noreferrer" className="admin-icon-btn" title="Open">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                        <button onClick={() => handleDeleteDoc(doc.id)} className="admin-icon-btn admin-delete-btn" title="Delete">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="admin-no-selection">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
            <h3>Select a page</h3>
            <p>Choose an investor page to edit its content and documents, or create a new page.</p>
          </div>
        )}
      </main>
    </div>
  );
}
