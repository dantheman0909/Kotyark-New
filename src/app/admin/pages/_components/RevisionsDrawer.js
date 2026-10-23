'use client';
import { useEffect, useState } from 'react';
import { formatDate, useApi } from './api';

export default function RevisionsDrawer({ pageId, onClose, onRestore, busy }) {
  const api = useApi();
  const [revs, setRevs] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api(`/api/pages/${pageId}/revisions`).then((d) => alive && setRevs(d.revisions)).catch((e) => alive && setError(e.message));
    return () => { alive = false; };
  }, [api, pageId]);

  return (
    <>
      <div className="cmsa-drawer-back" onClick={onClose} />
      <aside className="cmsa-drawer" role="dialog" aria-label="Revision history">
        <div className="cmsa-head" style={{ marginBottom: 8 }}>
          <h2>Revision history</h2>
          <button type="button" className="cmsa-btn sm" onClick={onClose}>Close</button>
        </div>
        <p className="cmsa-hint" style={{ marginBottom: 8 }}>
          A revision is saved each time the page is published. Restoring copies it into your draft; the live page does not change until you publish.
        </p>
        {error && <div className="cmsa-alert error">{error}</div>}
        {!revs && !error && <p>Loading…</p>}
        {revs && revs.length === 0 && <p className="cmsa-hint">No revisions yet. Publish the page to create the first one.</p>}
        {revs && revs.map((r) => (
          <div className="cmsa-rev" key={r.id}>
            <div>
              <strong>{r.note || 'Revision'}</strong> · {r.blockCount} block{r.blockCount === 1 ? '' : 's'}
              <small>{formatDate(r.createdAt)}{r.createdBy ? ` · ${r.createdBy}` : ''}</small>
              <small>{r.title}</small>
            </div>
            <button type="button" className="cmsa-btn sm" disabled={busy} onClick={() => onRestore(r)}>Restore</button>
          </div>
        ))}
      </aside>
    </>
  );
}
