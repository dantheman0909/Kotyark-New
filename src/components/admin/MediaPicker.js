'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import { useToast } from './Toast';
import { api } from './api';
import styles from './admin.module.css';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const srcOf = (v) => (!v ? null : UUID.test(v) ? `/media/${v}` : v);

/**
 * Pick (or upload) an image from the media library.
 * Props:
 *   value     media id (uuid), a /media/<id> or other URL, or '' / null
 *   onChange  (idOrUrl: string) => void   called with the media id on selection, '' when cleared
 *   label     optional button label
 */
export default function MediaPicker({ value, onChange, label = 'Choose image' }) {
  const [open, setOpen] = useState(false);
  const src = srcOf(value);

  return (
    <div className={styles.pickerValue}>
      <div className={styles.pickerThumb}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {src ? <img src={src} alt="" /> : <span className={styles.muted}>None</span>}
      </div>
      <div className={styles.actions}>
        <button type="button" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} onClick={() => setOpen(true)}>{src ? 'Change' : label}</button>
        {src && <button type="button" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} onClick={() => onChange?.('')}>Remove</button>}
      </div>
      {open && <PickerModal selected={value} onClose={() => setOpen(false)} onPick={(m) => { onChange?.(m.id); setOpen(false); }} />}
    </div>
  );
}

function PickerModal({ selected, onClose, onPick }) {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [q, setQ] = useState('');
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    try { setItems((await api('/api/media')).media); } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const upload = async (file) => {
    if (!file) return;
    setUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('alt', '');
      const { media } = await api('/api/media', { method: 'POST', body: fd });
      toast('Image uploaded');
      onPick(media);
    } catch (e) { setError(e.message); } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const shown = (items || []).filter((m) => !q || m.filename.toLowerCase().includes(q.toLowerCase()) || m.alt.toLowerCase().includes(q.toLowerCase()));

  return (
    <Modal title="Media library" wide onClose={onClose}
      footer={<button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose}>Cancel</button>}>
      <div className={styles.filters}>
        <input className={styles.input} style={{ maxWidth: 260 }} placeholder="Search images…" value={q} onChange={(e) => setQ(e.target.value)} />
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => upload(e.target.files?.[0])} />
        <button type="button" className={styles.btn} disabled={uploading} onClick={() => fileRef.current?.click()}>{uploading ? 'Uploading…' : 'Upload new'}</button>
      </div>
      {error && <div className={styles.alert} role="alert">{error}</div>}
      {!items ? <p className={styles.empty}>Loading…</p> : shown.length === 0 ? <p className={styles.empty}>No images yet.</p> : (
        <div className={styles.mediaGrid}>
          {shown.map((m) => (
            <button key={m.id} type="button" onClick={() => onPick(m)}
              className={`${styles.mediaItem} ${styles.mediaSelectable} ${selected === m.id || selected === m.url ? styles.mediaSelected : ''}`}>
              <span className={styles.mediaThumb}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={m.url} alt={m.alt} loading="lazy" /></span>
              <span className={styles.mediaMeta}><span className={styles.mediaName}>{m.filename}</span></span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
