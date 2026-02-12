'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  // Dialog state
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParent, setNewFolderParent] = useState('');
  const [newFolderVisible, setNewFolderVisible] = useState(true);
  const [uploadTitle, setUploadTitle] = useState('');
  // Ensure all controlled inputs have defined string values (never undefined)
  const [uploadFile, setUploadFile] = useState(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [uploadMode, setUploadMode] = useState('file');
  const [actionLoading, setActionLoading] = useState(false);

  // Check auth
  useEffect(() => {
    fetch('/api/auth/check')
      .then(r => r.json())
      .then(data => {
        if (!data.authenticated) router.push('/login');
        else setLoading(false);
      })
      .catch(() => router.push('/login'));
  }, [router]);

  // Load folders
  const loadFolders = useCallback(async () => {
    const res = await fetch('/api/folders');
    const data = await res.json();
    const all = data.folders || [];
    setFolders(all);
    // Auto-expand root folders on first load
    if (expandedFolders.size === 0) {
      const roots = all.filter(f => !f.parent_id).map(f => f.id);
      setExpandedFolders(new Set(roots));
    }
  }, []);

  // Load documents for selected folder
  const loadDocuments = useCallback(async (folderId) => {
    const url = folderId ? `/api/documents?folderId=${folderId}` : '/api/documents';
    const res = await fetch(url);
    const data = await res.json();
    setDocuments(data.documents || []);
  }, []);

  useEffect(() => {
    if (!loading) {
      loadFolders();
      loadDocuments();
    }
  }, [loading, loadFolders, loadDocuments]);

  useEffect(() => {
    if (selectedFolder) loadDocuments(selectedFolder.id);
  }, [selectedFolder, loadDocuments]);

  // Build folder tree
  const rootFolders = useMemo(() => folders.filter(f => !f.parent_id), [folders]);
  const childrenOf = useCallback((parentId) => folders.filter(f => f.parent_id === parentId), [folders]);
  // Only folders that can be parents (i.e., top-level or explicitly parentable)
  const parentOptions = useMemo(() => folders.filter(f => !f.parent_id || rootFolders.some(r => r.id === f.id)), [folders, rootFolders]);

  const toggleExpand = (folderId) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName,
          parentId: newFolderParent || null,
          visibleInMenu: newFolderVisible,
        }),
      });
      if (res.ok) {
        setShowNewFolder(false);
        setNewFolderName('');
        setNewFolderParent('');
        setNewFolderVisible(true);
        await loadFolders();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFolder) return;
    setActionLoading(true);

    try {
      const formData = new FormData();
      formData.append('folderId', selectedFolder.id);
      formData.append('title', uploadTitle);

      if (uploadMode === 'file' && uploadFile) {
        formData.append('file', uploadFile);
      } else if (uploadMode === 'url' && externalUrl) {
        formData.append('externalUrl', externalUrl);
      } else {
        setActionLoading(false);
        return;
      }

      const res = await fetch('/api/documents', { method: 'POST', body: formData });
      if (res.ok) {
        setShowUpload(false);
        setUploadTitle('');
        setUploadFile(null);
        setExternalUrl('');
        setUploadMode('file');
        loadDocuments(selectedFolder.id);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteFolder = async (id) => {
    if (!confirm('Delete this folder and all its documents?')) return;
    await fetch(`/api/folders/${id}`, { method: 'DELETE' });
    if (selectedFolder?.id === id) setSelectedFolder(null);
    loadFolders();
    loadDocuments();
  };

  const handleToggleVisibility = async (folder) => {
    await fetch(`/api/folders/${folder.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visibleInMenu: !folder.visible_in_menu }),
    });
    loadFolders();
  };

  const handleDeleteDocument = async (id) => {
    if (!confirm('Delete this document?')) return;
    await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    if (selectedFolder) loadDocuments(selectedFolder.id);
    else loadDocuments();
  };

  // Render a single folder row
  const FolderRow = ({ folder, depth = 0 }) => {
    const children = childrenOf(folder.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedFolders.has(folder.id);

    return (
      <>
        <div
          className={`admin-folder-item ${selectedFolder?.id === folder.id ? 'active' : ''}`}
          onClick={() => setSelectedFolder(folder)}
          style={{ paddingLeft: `${24 + depth * 20}px` }}
        >
          <div className="admin-folder-info">
            {hasChildren ? (
              <button
                className="admin-expand-btn"
                onClick={(e) => { e.stopPropagation(); toggleExpand(folder.id); }}
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            ) : (
              <span style={{ width: '20px', display: 'inline-block' }} />
            )}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <span className="admin-folder-name">{folder.name}</span>
            {!folder.visible_in_menu && (
              <span className="admin-tag hidden-tag">Hidden</span>
            )}
            {hasChildren && (
              <span className="admin-tag" style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '0.68rem' }}>{children.length}</span>
            )}
          </div>
          <div className="admin-folder-actions" onClick={e => e.stopPropagation()}>
            <button onClick={() => handleToggleVisibility(folder)} title={folder.visible_in_menu ? 'Hide from menu' : 'Show in menu'} className="admin-icon-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {folder.visible_in_menu ? (
                  <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                ) : (
                  <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                )}
              </svg>
            </button>
            <button onClick={() => handleDeleteFolder(folder.id)} title="Delete folder" className="admin-icon-btn admin-delete-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
        {isExpanded && children.map(child => (
          <FolderRow key={child.id} folder={child} depth={depth + 1} />
        ))}
      </>
    );
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="login-spinner" />
        <p>Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Admin Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <h1>📁 Document Manager</h1>
          <span className="admin-badge">Admin Panel</span>
        </div>
        <div className="admin-header-right">
          <a href="/investors" target="_blank" className="admin-link-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            View Public Site
          </a>
          <button onClick={handleLogout} className="admin-logout-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </header>

      <div className="admin-body">
        {/* Folder Panel */}
        <aside className="admin-folders">
          <div className="admin-panel-header">
            <h2>Folders</h2>
            <button onClick={() => setShowNewFolder(true)} className="admin-add-btn" title="Create folder">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>

          {/* New Folder Dialog */}
          {showNewFolder && (
            <form onSubmit={handleCreateFolder} className="admin-inline-form">
              <input
                type="text"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="Folder name..."
                autoFocus
                required
              />
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  Parent Folder
                </label>
                <select
                  value={newFolderParent}
                  onChange={e => setNewFolderParent(e.target.value)}
                  className="admin-select"
                >
                  <option value="">— Top Level (no parent) —</option>
                  {folders.filter(f => !f.parent_id).map(f => (
                    <option key={f.id} value={f.id}>
                      📁 {f.name}
                    </option>
                  ))}
                </select>
              </div>
              <label className="admin-checkbox">
                <input type="checkbox" checked={newFolderVisible} onChange={e => setNewFolderVisible(e.target.checked)} />
                Visible in menu
              </label>
              <div className="admin-inline-actions">
                <button type="submit" className="admin-save-btn" disabled={actionLoading}>Create</button>
                <button type="button" onClick={() => { setShowNewFolder(false); setNewFolderParent(''); }} className="admin-cancel-btn">Cancel</button>
              </div>
            </form>
          )}

          {/* Folder Tree */}
          <div className="admin-folder-list">
            {folders.length === 0 ? (
              <p className="admin-empty">No folders yet. Create one to get started.</p>
            ) : (
              rootFolders.map(folder => (
                <FolderRow key={folder.id} folder={folder} depth={0} />
              ))
            )}
          </div>
        </aside>

        {/* Documents Panel */}
        <main className="admin-documents">
          {selectedFolder ? (
            <>
              <div className="admin-panel-header">
                <div>
                  <h2>{selectedFolder.name}</h2>
                  <span className="admin-slug">
                    {selectedFolder.parent_id
                      ? `Sub-folder of: ${folders.find(f => f.id === selectedFolder.parent_id)?.name || 'Unknown'}`
                      : 'Top-level folder'
                    }
                    {' · '}Slug: {selectedFolder.slug}
                  </span>
                </div>
                <button onClick={() => setShowUpload(true)} className="admin-upload-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Upload Document
                </button>
              </div>

              {/* Upload Dialog */}
              {showUpload && (
                <form onSubmit={handleUpload} className="admin-upload-form">
                  <div className="admin-upload-tabs">
                    <button type="button" className={`admin-tab ${uploadMode === 'file' ? 'active' : ''}`} onClick={() => setUploadMode('file')}>
                      📎 Upload File
                    </button>
                    <button type="button" className={`admin-tab ${uploadMode === 'url' ? 'active' : ''}`} onClick={() => setUploadMode('url')}>
                      🔗 External URL
                    </button>
                  </div>

                  <div className="form-group">
                    <label>Display Title</label>
                    <input type="text" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="Document title as shown on website..." required />
                  </div>

                  {uploadMode === 'file' ? (
                    <div className="form-group">
                      <label>File (PDF, DOC, etc.)</label>
                      <input type="file" onChange={e => setUploadFile(e.target.files[0])} required />
                    </div>
                  ) : (
                    <div className="form-group">
                      <label>External URL</label>
                      <input type="url" value={externalUrl} onChange={e => setExternalUrl(e.target.value)} placeholder="https://..." required />
                    </div>
                  )}

                  <div className="admin-inline-actions">
                    <button type="submit" className="admin-save-btn" disabled={actionLoading}>
                      {actionLoading ? 'Uploading...' : 'Add Document'}
                    </button>
                    <button type="button" onClick={() => setShowUpload(false)} className="admin-cancel-btn">Cancel</button>
                  </div>
                </form>
              )}

              {/* Document List */}
              <div className="admin-doc-list">
                {documents.length === 0 ? (
                  <p className="admin-empty">No documents in this folder yet. Upload one to get started.</p>
                ) : (
                  documents.map(doc => (
                    <div key={doc.id} className="admin-doc-item">
                      <div className="admin-doc-info">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                        </svg>
                        <div>
                          <span className="admin-doc-title">{doc.title}</span>
                          <span className="admin-doc-meta">
                            {doc.is_external ? '🔗 External' : `📎 ${(doc.file_size / 1024).toFixed(1)} KB`}
                            {' · '}
                            {new Date(doc.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="admin-doc-actions">
                        <a href={doc.file_path} target="_blank" rel="noopener noreferrer" className="admin-icon-btn" title="Open">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                        </a>
                        <button onClick={() => handleDeleteDocument(doc.id)} className="admin-icon-btn admin-delete-btn" title="Delete">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="admin-no-selection">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <h3>Select a folder</h3>
              <p>Choose a folder from the left panel to manage its documents, or create a new folder to get started.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
