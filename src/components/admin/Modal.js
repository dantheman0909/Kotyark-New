'use client';
import { useEffect, useRef } from 'react';
import styles from './admin.module.css';

export default function Modal({ title, onClose, children, footer, wide = false }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current?.(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, []);

  return (
    <div className={styles.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className={`${styles.modal} ${wide ? styles.modalWide : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className={styles.modalHead}>
          <h2>{title}</h2>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className={styles.modalBody}>{children}</div>
        {footer ? <div className={styles.modalFoot}>{footer}</div> : null}
      </div>
    </div>
  );
}
