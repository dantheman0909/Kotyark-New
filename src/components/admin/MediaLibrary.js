'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

// Standalone media library tab: upload, browse, copy URL, delete.
export default function MediaLibrary() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(null);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/uploads');
      const data = await res.json();
      setMedia(data.media || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/uploads', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Upload failed');
      else await load();
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this file? Links to it will break.')) return;
    await fetch(`/api/uploads/${id}`, { method: 'DELETE' });
    load();
  };

  const copyUrl = async (m) => {
    const full = `${window.location.origin}${m.url}`;
    try { await navigator.clipboard.writeText(full); } catch { /* ignore */ }
    setCopied(m.id);
    setTimeout(() => setCopied(null), 1500);
  };

  const isImage = (m) => (m.mime || '').startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(m.url);

  return (
    <div className="admin-media-tab">
      <div className="admin-panel-header">
        <div>
          <h2>Media Library</h2>
          <span className="admin-slug">Images and files you can insert into pages or link to.</span>
        </div>
        <label className="admin-upload-btn" style={{ cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {uploading ? 'Uploading…' : 'Upload File'}
          <input ref={fileRef} type="file" onChange={handleUpload} style={{ display: 'none' }} disabled={uploading} />
        </label>
      </div>

      {error && <p className="admin-inline-error">{error}</p>}

      <div className="admin-media-grid">
        {loading ? (
          <p className="admin-empty">Loading…</p>
        ) : media.length === 0 ? (
          <p className="admin-empty">No media yet. Upload a file to get started.</p>
        ) : (
          media.map((m) => (
            <div key={m.id} className="admin-media-item admin-media-managed">
              {isImage(m) ? (
                <img src={m.url} alt={m.original_name} />
              ) : (
                <div className="admin-media-file">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span>{m.url.split('.').pop().toUpperCase()}</span>
                </div>
              )}
              <span className="admin-media-name">{m.original_name}</span>
              <div className="admin-media-actions">
                <button className="admin-mini-btn" onClick={() => copyUrl(m)}>{copied === m.id ? 'Copied!' : 'Copy URL'}</button>
                <button className="admin-mini-btn danger" onClick={() => handleDelete(m.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
