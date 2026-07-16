'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

// Modal media library used both standalone and by the rich text editor.
// onSelect(media) is called with { url, original_name, mime } when the user picks a file.
export default function MediaPicker({ onSelect, onClose, filter }) {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
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
      if (!res.ok) {
        setError(data.error || 'Upload failed');
      } else {
        await load();
      }
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const isImage = (m) => (m.mime || '').startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(m.url);
  const shown = filter === 'image' ? media.filter(isImage) : media;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3>Media Library</h3>
          <button onClick={onClose} className="admin-icon-btn" title="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="admin-modal-toolbar">
          <label className="admin-save-btn" style={{ cursor: 'pointer' }}>
            {uploading ? 'Uploading…' : '⬆ Upload New'}
            <input ref={fileRef} type="file" onChange={handleUpload} style={{ display: 'none' }} disabled={uploading} />
          </label>
          {error && <span className="admin-inline-error">{error}</span>}
        </div>

        <div className="admin-media-grid">
          {loading ? (
            <p className="admin-empty">Loading…</p>
          ) : shown.length === 0 ? (
            <p className="admin-empty">No media yet. Upload a file to get started.</p>
          ) : (
            shown.map((m) => (
              <button
                type="button"
                key={m.id}
                className="admin-media-item"
                onClick={() => onSelect?.(m)}
                title={m.original_name}
              >
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
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
