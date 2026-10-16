'use client';
import { useState } from 'react';
import Modal from './Modal';
import styles from './admin.module.css';

/** A button that asks before running onConfirm (async ok; a throw keeps the dialog open). */
export default function ConfirmButton({
  children, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Confirm',
  danger = true, small = true, disabled = false, className = '',
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try { await onConfirm(); setOpen(false); }
    catch { /* caller reports the error (toast); keep dialog open */ }
    finally { setBusy(false); }
  };

  return (
    <>
      <button
        type="button" disabled={disabled}
        className={`${styles.btn} ${danger ? styles.btnDanger : styles.btnGhost} ${small ? styles.btnSm : ''} ${className}`}
        onClick={() => setOpen(true)}
      >{children}</button>
      {open && (
        <Modal
          title={title} onClose={() => !busy && setOpen(false)}
          footer={<>
            <button type="button" className={`${styles.btn} ${styles.btnGhost}`} disabled={busy} onClick={() => setOpen(false)}>Cancel</button>
            <button type="button" className={`${styles.btn} ${danger ? styles.btnDanger : ''}`} disabled={busy} onClick={run}>
              {busy ? 'Working…' : confirmLabel}
            </button>
          </>}
        >
          <p style={{ margin: 0 }}>{message}</p>
        </Modal>
      )}
    </>
  );
}
