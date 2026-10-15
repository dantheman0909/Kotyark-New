'use client';
import { useEffect, useState } from 'react';
import FormField from '@/components/admin/FormField';
import MediaPicker from '@/components/admin/MediaPicker';
import { useToast } from '@/components/admin/Toast';
import { api } from '@/components/admin/api';
import { SETTINGS } from '@/app/api/settings/fields';
import styles from '@/components/admin/admin.module.css';

function Section({ k, def, initial, canEdit }) {
  const toast = useToast();
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dirty = JSON.stringify(value) !== JSON.stringify(saved);

  const save = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const r = await api('/api/settings', { method: 'PUT', body: { key: k, value } });
      setValue(r.value); setSaved(r.value);
      toast(`${def.label} saved`);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <form className={styles.card} style={{ marginBottom: 16 }} onSubmit={save}>
      <h2 className={styles.cardTitle}>{def.label}</h2>
      {error && <div className={styles.alert} role="alert">{error}</div>}
      <div className={styles.formRow}>
        {Object.entries(def.fields).map(([f, spec]) => (
          spec.image ? (
            <div key={f} className={styles.field}>
              <span className={styles.label}>{spec.label}</span>
              {canEdit
                ? <MediaPicker value={value[f]} onChange={(v) => setValue((s) => ({ ...s, [f]: v ? (/^[0-9a-f-]{36}$/i.test(v) ? `/media/${v}` : v) : '' }))} />
                : <span>{value[f] || '—'}</span>}
            </div>
          ) : (
            <FormField
              key={f} id={`${k}-${f}`} label={spec.label}
              as={spec.multiline ? 'textarea' : 'input'}
              value={value[f]} disabled={!canEdit}
              onChange={(e) => setValue((s) => ({ ...s, [f]: e.target.value }))}
            />
          )
        ))}
      </div>
      {canEdit && <button type="submit" className={styles.btn} disabled={busy || !dirty}>{busy ? 'Saving…' : 'Save'}</button>}
    </form>
  );
}

export default function SettingsClient({ canEdit }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('/api/settings').then((d) => setData(d.settings)).catch((e) => setError(e.message)); }, []);

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Settings</h1>
          <p className={styles.pageSub}>Site-wide details used in the footer, structured data and SEO.{!canEdit && ' Read only for your role.'}</p>
        </div>
      </div>
      {error && <div className={styles.alert}>{error}</div>}
      {!data ? <p className={styles.empty}>Loading…</p> : Object.entries(SETTINGS).map(([k, def]) => (
        <Section key={k} k={k} def={def} initial={data[k]} canEdit={canEdit} />
      ))}
    </>
  );
}
