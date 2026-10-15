'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Modal from './Modal';
import FormField from './FormField';
import { ToastProvider, useToast } from './Toast';
import { api } from './api';
import styles from './admin.module.css';

// cap = capability required to see the link (see PERMISSIONS in src/lib/auth.js)
const NAV = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/pages', label: 'Pages', cap: 'pages:write' },
  { href: '/admin/documents', label: 'Documents', cap: 'documents:write' },
  { href: '/admin/media', label: 'Media', cap: 'media:write' },
  { href: '/admin/navigation', label: 'Navigation', cap: 'nav:write' },
  { href: '/admin/redirects', label: 'Redirects', cap: 'redirects:write' },
  { section: 'Administration' },
  { href: '/admin/settings', label: 'Settings', cap: 'settings:write' },
  { href: '/admin/users', label: 'Users', cap: 'users:manage' },
  { href: '/admin/audit', label: 'Audit log', cap: 'audit:read' },
];

function ChangePasswordModal({ onClose }) {
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (next.length < 12) return setError('New password must be at least 12 characters.');
    if (next !== confirm) return setError('New passwords do not match.');
    setBusy(true);
    try {
      await api('/api/users/me/password', { method: 'POST', body: { currentPassword: current, newPassword: next } });
      toast('Password changed');
      onClose();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <Modal
      title="Change my password" onClose={onClose}
      footer={<>
        <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose}>Cancel</button>
        <button type="submit" form="change-pw-form" className={styles.btn} disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button>
      </>}
    >
      <form id="change-pw-form" onSubmit={submit}>
        {error && <div className={styles.alert} role="alert">{error}</div>}
        <FormField label="Current password" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        <FormField label="New password" type="password" autoComplete="new-password" hint="At least 12 characters." value={next} onChange={(e) => setNext(e.target.value)} required />
        <FormField label="Confirm new password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      </form>
    </Modal>
  );
}

function Inner({ user, permissions, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  const allowed = new Set(permissions);
  const items = NAV.filter((n) => n.section || !n.cap || allowed.has(n.cap));
  // Drop a section heading if nothing follows it.
  const visible = items.filter((n, i) => !n.section || (items[i + 1] && !items[i + 1].section));

  const isActive = (n) => (n.exact ? pathname === n.href : pathname === n.href || pathname?.startsWith(n.href + '/'));

  const logout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    router.push('/login');
    router.refresh();
  };

  return (
    <div className={styles.shell}>
      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`} aria-label="Admin navigation">
        <div className={styles.brand}>Kotyark<small>Content admin</small></div>
        <nav className={styles.nav}>
          {visible.map((n) => n.section
            ? <div key={n.section} className={styles.navSection}>{n.section}</div>
            : (
              <Link key={n.href} href={n.href} className={`${styles.navLink} ${isActive(n) ? styles.navActive : ''}`}
                aria-current={isActive(n) ? 'page' : undefined}>{n.label}</Link>
            ))}
        </nav>
      </aside>
      {open && <div className={styles.backdrop} onClick={() => setOpen(false)} />}

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button type="button" className={styles.menuBtn} onClick={() => setOpen((o) => !o)} aria-label="Toggle navigation" aria-expanded={open}>&#9776;</button>
          <div className={styles.spacer} />
          <div className={styles.userBox}>
            <span className={styles.userName}>{user.name || user.email}</span>
            <span className={styles.userRole}>{user.role}</span>
          </div>
          <button type="button" className={styles.topBtn} onClick={() => setPwOpen(true)}>Password</button>
          <a className={styles.topLink} href="/" target="_blank" rel="noopener">View site</a>
          <button type="button" className={styles.topBtn} onClick={logout}>Log out</button>
        </header>
        <div className={styles.content}>{children}</div>
      </div>
      {pwOpen && <ChangePasswordModal onClose={() => setPwOpen(false)} />}
    </div>
  );
}

/**
 * Props: user {id,email,name,role}, permissions string[] (capabilities from PERMISSIONS).
 * Child pages render inside `.content` (max-width 1280px, padded) and can use
 * useToast() from './Toast' and the classes in './admin.module.css'.
 */
export default function AdminShell({ user, permissions, children }) {
  return (
    <ToastProvider>
      <Inner user={user} permissions={permissions}>{children}</Inner>
    </ToastProvider>
  );
}
