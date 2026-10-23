'use client';
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import styles from './admin.module.css';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const seq = useRef(0);

  const toast = useCallback((message, type = 'success') => {
    const id = ++seq.current;
    setItems((cur) => [...cur, { id, message, type }]);
    setTimeout(() => setItems((cur) => cur.filter((t) => t.id !== id)), type === 'error' ? 6000 : 3500);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className={styles.toasts} aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`${styles.toast} ${t.type === 'error' ? styles.toastError : ''}`}>{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** const toast = useToast(); toast('Saved'); toast('Failed', 'error'); */
export function useToast() {
  return useContext(ToastContext) || ((m) => console.log('[toast]', m));
}
