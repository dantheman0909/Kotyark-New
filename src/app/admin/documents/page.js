'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import FolderPanel from './FolderPanel';
import DocumentTable from './DocumentTable';
import UploadPanel from './UploadPanel';
import s from './documents.module.css';

// Content only: the admin shell (header, logout) is provided by src/app/admin/layout.js.
export default function AdminDocumentsPage() {
  const [folders, setFolders] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [docs, setDocs] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [checking, setChecking] = useState(false);
  const [broken, setBroken] = useState(null);

  const loadFolders = useCallback(async () => {
    const { folders: list } = await api('/api/folders');
    setFolders(list);
    return list;
  }, []);

  const loadDocs = useCallback(async (folderId) => {
    if (!folderId) { setDocs([]); return; }
    const { documents } = await api(`/api/documents?folderId=${encodeURIComponent(folderId)}`);
    setDocs(documents);
  }, []);

  useEffect(() => {
    loadFolders().then((list) => { if (list.length) setSelectedId((cur) => cur || list[0].id); }).catch((e) => setError(e.message));
  }, [loadFolders]);

  useEffect(() => { loadDocs(selectedId).catch((e) => setError(e.message)); }, [selectedId, loadDocs]);

  // After any mutation: refresh counts + current list.
  const refresh = useCallback(async () => {
    try { await loadFolders(); await loadDocs(selectedId); } catch (e) { setError(e.message); }
  }, [loadFolders, loadDocs, selectedId]);

  const checkLinks = async () => {
    setChecking(true); setError(''); setNotice(''); setBroken(null);
    try {
      const r = await api('/api/documents/link-check', { method: 'POST' });
      setNotice(`Checked ${r.checked} external link${r.checked === 1 ? '' : 's'}: ${r.ok} OK, ${r.broken} broken, ${r.error} unreachable.`);
      setBroken(r.brokenDocuments);
      await loadDocs(selectedId);
    } catch (e) { setError(e.message); } finally { setChecking(false); }
  };

  const folder = folders?.find((f) => f.id === selectedId) || null;

  if (folders === null && !error) return <div className="admin-loading" style={{ minHeight: 240 }}>Loading documents...</div>;

  return (
    <div className={s.shell}>
      <div className={s.pageTitle}>
        <h1>Investor Documents</h1>
        <button className="admin-upload-btn" onClick={checkLinks} disabled={checking}>{checking ? 'Checking links...' : 'Check links'}</button>
      </div>

      {(error || notice) && (
        <div style={{ gridColumn: '1 / -1' }}>
          {error && <div className={s.error} style={{ margin: 0 }}>{error}</div>}
          {notice && <div className={s.notice} style={{ margin: 0 }}>{notice}</div>}
          {broken && broken.length > 0 && (
            <ul style={{ margin: '8px 0 0', paddingLeft: 20, fontSize: '0.82rem', color: '#b91c1c' }}>
              {broken.map((b) => <li key={b.id}>{b.title}: {b.external_url} ({b.http_code || b.status})</li>)}
            </ul>
          )}
        </div>
      )}

      <FolderPanel folders={folders || []} selectedId={selectedId} onSelect={setSelectedId} onChanged={refresh} onError={setError} />

      <div className={s.col}>
        {folder ? (
          <>
            <div className="admin-panel-header">
              <div>
                <h2>{folder.name}</h2>
                <span className="admin-slug">/investors/{folder.slug}{!folder.visible ? ' (hidden)' : ''}</span>
              </div>
              <a className={s.textBtn} href={`/investors/${folder.slug}`} target="_blank" rel="noopener noreferrer">View public page</a>
            </div>
            <UploadPanel folderId={folder.id} onError={setError}
              onUploaded={async (n) => { setNotice(`Uploaded ${n} item${n === 1 ? '' : 's'}.`); await refresh(); }} />
            <DocumentTable docs={docs} folders={folders} folderId={folder.id} onChanged={refresh} onError={setError} />
          </>
        ) : (
          <div className="admin-no-selection" style={{ padding: 60 }}>
            <h3>Select a folder</h3>
            <p>Choose a folder on the left, or create a new one, to manage its documents.</p>
          </div>
        )}
      </div>
    </div>
  );
}
