'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Modal from '@/components/admin/Modal';
import ConfirmButton from '@/components/admin/ConfirmButton';
import FormField from '@/components/admin/FormField';
import { useToast } from '@/components/admin/Toast';
import { api } from '@/components/admin/api';
import styles from '@/components/admin/admin.module.css';

const kb = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default function MediaClient() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [alt, setAlt] = useState('');
  const [edit, setEdit] = useState(null);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    try { setItems((await api('/api/media')).media); } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const upload = async (files) => {
    if (!files?.length) return;
    setUploading(true); setError('');
    for (const file of files) {
      try {
        const fd = new FormData();
        fd.append('file', file); fd.append('alt', alt);
        await api('/api/media', { method: 'POST', body: fd });
        toast(`Uploaded ${file.name}`);
      } catch (e) { setError(`${file.name}: ${e.message}`); }
    }
    setUploading(false); setAlt('');
    if (fileRef.current) fileRef.current.value = '';
    load();
  };

  const copy = async (m) => {
    const full = `${window.location.origin}${m.url}`;
    try { await navigator.clipboard.writeText(full); toast('URL copied'); } catch { toast(full, 'error'); }
  };

  const remove = (m) => async () => {
    try {
      try { await api(`/api/media/${m.id}`, { method: 'DELETE' }); }
      catch (e) {
        if (!/in use/i.test(e.message) || !window.confirm(`${e.message}\n\nDelete anyway?`)) throw e;
        await api(`/api/media/${m.id}?force=1`, { method: 'DELETE' });
      }
      toast('Image deleted'); load();
    } catch (e) { toast(e.message, 'error'); throw e; }
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Media</h1>
          <p className={styles.pageSub}>PNG, JPG, WebP or GIF up to 10 MB. Always add alt text for accessibility and SEO.</p>
        </div>
      </div>

      <div className={styles.card} style={{ marginBottom: 20 }}>
        <div className={styles.filters}>
          <FormField label="Alt text (applied to this upload)" value={alt} maxLength={300} onChange={(e) => setAlt(e.target.value)} placeholder="Describe the image" />
          <input ref={fileRef} type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => upload([...e.target.files])} />
          <button type="button" className={styles.btn} disabled={uploading} onClick={() => fileRef.current?.click()}>{uploading ? 'Uploading…' : 'Upload images'}</button>
        </div>
      </div>

      {error && <div className={styles.alert} role="alert">{error}</div>}
      {!items ? <p className={styles.empty}>Loading…</p> : items.length === 0 ? <p className={styles.empty}>No images yet.</p> : (
        <div className={styles.mediaGrid}>
          {items.map((m) => (
            <div key={m.id} className={styles.mediaItem}>
              <div className={styles.mediaThumb}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={m.url} alt={m.alt} loading="lazy" /></div>
              <div className={styles.mediaMeta}>
                <span className={styles.mediaName} title={m.filename}>{m.filename}</span>
                <span className={styles.muted}>{m.width && m.height ? `${m.width}×${m.height} · ` : ''}{kb(m.size)}</span>
                <span className={styles.muted}>{m.alt ? `Alt: ${m.alt}` : 'No alt text'}</span>
              </div>
              <div className={styles.mediaActions}>
                <button type="button" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} onClick={() => setEdit(m)}>Alt</button>
                <button type="button" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} onClick={() => copy(m)}>Copy URL</button>
                <ConfirmButton title="Delete image?" message={`Delete ${m.filename}? This cannot be undone.`} confirmLabel="Delete" onConfirm={remove(m)}>Delete</ConfirmButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {edit && <AltModal media={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); toast('Alt text saved'); load(); }} />}
    </>
  );
}

function AltModal({ media, onClose, onSaved }) {
  const [alt, setAlt] = useState(media.alt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try { await api(`/api/media/${media.id}`, { method: 'PUT', body: { alt } }); onSaved(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return (
    <Modal title={`Alt text: ${media.filename}`} onClose={onClose}
      footer={<>
        <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose}>Cancel</button>
        <button type="submit" form="alt-form" className={styles.btn} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
      </>}>
      <form id="alt-form" onSubmit={submit}>
        {error && <div className={styles.alert} role="alert">{error}</div>}
        <FormField label="Alt text" as="textarea" value={alt} maxLength={300} onChange={(e) => setAlt(e.target.value)} autoFocus />
      </form>
    </Modal>
  );
}
