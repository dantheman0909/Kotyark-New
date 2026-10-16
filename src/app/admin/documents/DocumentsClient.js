'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';
import FolderPanel from './FolderPanel';
import DocumentTable from './DocumentTable';
import UploadPanel from './UploadPanel';
import LinkHealthPanel from './LinkHealthPanel';
import s from './documents.module.css';

// Content only: the admin shell (header, logout) is provided by src/app/admin/layout.js.
export default function AdminDocumentsPage() {
  const [folders, setFolders] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [docs, setDocs] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [version, setVersion] = useState(0);
  const [highlightId, setHighlightId] = useState(null);

  // The selected section lives in state (for rendering) AND a ref (for async code), so a refresh or a slow
  // response can never act on a section the user has already left. Every load is sequence-numbered and a
  // response is applied only if it is still the latest request (and, for documents, still the selected section).
  const selectedRef = useRef(null);
  const docsSeq = useRef(0);
  const foldersSeq = useRef(0);

  const selectFolder = useCallback((id) => {
    if (selectedRef.current !== id) setDocs([]); // never show one section's documents under another's heading
    selectedRef.current = id;
    setSelectedId(id);
  }, []);

  const loadFolders = useCallback(async () => {
    const seq = ++foldersSeq.current;
    const { folders: list } = await api('/api/folders');
    if (seq === foldersSeq.current) setFolders(list);
    return list;
  }, []);

  const loadDocs = useCallback(async (folderId) => {
    const seq = ++docsSeq.current;
    if (!folderId) { setDocs([]); return; }
    const { documents } = await api(`/api/documents?folderId=${encodeURIComponent(folderId)}`);
    if (seq === docsSeq.current && folderId === selectedRef.current) setDocs(documents);
  }, []);

  useEffect(() => {
    loadFolders().then((list) => { if (list.length && !selectedRef.current) selectFolder(list[0].id); }).catch((e) => setError(e.message));
  }, [loadFolders, selectFolder]);

  useEffect(() => { loadDocs(selectedId).catch((e) => setError(e.message)); }, [selectedId, loadDocs]);

  // After any mutation: refresh counts + current list.
  const refresh = useCallback(async () => {
    try { await Promise.all([loadFolders(), loadDocs(selectedRef.current)]); setVersion((v) => v + 1); } catch (e) { setError(e.message); }
  }, [loadFolders, loadDocs]);

  const checkLinks = async () => {
    setChecking(true); setError(''); setNotice('');
    try {
      const r = await api('/api/documents/link-check', { method: 'POST' });
      setResult(r);
      await Promise.all([loadFolders(), loadDocs(selectedRef.current)]);
    } catch (e) { setError(e.message); } finally { setChecking(false); }
  };

  const openDoc = useCallback((d) => {
    selectFolder(d.folder_id); setHighlightId(d.id);
    setTimeout(() => setHighlightId((cur) => (cur === d.id ? null : cur)), 6000);
  }, [selectFolder]);

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
        </div>
      )}

      <LinkHealthPanel result={result} version={version} onError={setError} onChanged={refresh} onOpen={openDoc} />

      <FolderPanel folders={folders || []} selectedId={selectedId} onSelect={selectFolder} onChanged={refresh} onError={setError} />

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
            <DocumentTable key={folder.id} highlightId={highlightId} docs={docs} folders={folders} folderId={folder.id} onChanged={refresh} onError={setError} />
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
