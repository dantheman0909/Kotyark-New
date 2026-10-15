'use client';
import { useCallback, useEffect, useState } from 'react';
import Modal from '@/components/admin/Modal';
import FormField from '@/components/admin/FormField';
import { useToast } from '@/components/admin/Toast';
import { api } from '@/components/admin/api';
import styles from '@/components/admin/admin.module.css';

const ROLES = ['owner', 'editor', 'compliance'];
const ROLE_HELP = {
  owner: 'Full access, including users, settings and audit log.',
  editor: 'Pages, navigation, redirects and media.',
  compliance: 'Investor documents, media and the audit log.',
};
const fmt = (d) => d ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(d)) : 'Never';

export default function UsersClient({ meId }) {
  const toast = useToast();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // {type:'create'} | {type:'edit', user} | {type:'reset', user}

  const load = useCallback(async () => {
    try { setUsers((await api('/api/users')).users); } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Users</h1>
          <p className={styles.pageSub}>Who can sign in to the admin, and what they can do.</p>
        </div>
        <button type="button" className={styles.btn} onClick={() => setModal({ type: 'create' })}>Add user</button>
      </div>

      {error && <div className={styles.alert}>{error}</div>}
      {!users ? <p className={styles.empty}>Loading…</p> : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last login</th><th /></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name || '—'}{u.id === meId ? <span className={styles.muted}> (you)</span> : null}</td>
                  <td>{u.email}</td>
                  <td><span className={styles.badge}>{u.role}</span></td>
                  <td><span className={`${styles.badge} ${u.active ? '' : styles.badgeOff}`}>{u.active ? 'Active' : 'Inactive'}</span></td>
                  <td>{fmt(u.last_login_at)}</td>
                  <td>
                    <div className={styles.actions}>
                      <button type="button" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} onClick={() => setModal({ type: 'edit', user: u })}>Edit</button>
                      <button type="button" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} onClick={() => setModal({ type: 'reset', user: u })}>Reset password</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal?.type === 'create' && <CreateModal onClose={() => setModal(null)} onDone={() => { setModal(null); load(); toast('User created'); }} />}
      {modal?.type === 'edit' && <EditModal user={modal.user} isMe={modal.user.id === meId} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); toast('User updated'); }} />}
      {modal?.type === 'reset' && <ResetModal user={modal.user} onClose={() => setModal(null)} onDone={() => { setModal(null); toast('Password reset'); }} />}
    </>
  );
}

function RoleSelect({ value, onChange, disabled }) {
  return (
    <FormField label="Role" as="select" value={value} onChange={onChange} disabled={disabled} hint={ROLE_HELP[value]}>
      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
    </FormField>
  );
}

function useSubmit(fn, onDone) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try { await fn(); onDone(); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return { busy, error, submit };
}

function Footer({ formId, busy, onClose, label }) {
  return (
    <>
      <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose}>Cancel</button>
      <button type="submit" form={formId} className={styles.btn} disabled={busy}>{busy ? 'Saving…' : label}</button>
    </>
  );
}

function CreateModal({ onClose, onDone }) {
  const [f, setF] = useState({ email: '', name: '', role: 'editor', password: '' });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const { busy, error, submit } = useSubmit(() => api('/api/users', { method: 'POST', body: f }), onDone);
  return (
    <Modal title="Add user" onClose={onClose} footer={<Footer formId="create-user" busy={busy} onClose={onClose} label="Create user" />}>
      <form id="create-user" onSubmit={submit}>
        {error && <div className={styles.alert} role="alert">{error}</div>}
        <FormField label="Name" value={f.name} onChange={set('name')} required />
        <FormField label="Email" type="text" inputMode="email" value={f.email} onChange={set('email')} required />
        <RoleSelect value={f.role} onChange={set('role')} />
        <FormField label="Temporary password" type="text" autoComplete="off" hint="At least 12 characters. Share it securely; the user should change it after signing in." value={f.password} onChange={set('password')} minLength={12} required />
      </form>
    </Modal>
  );
}

function EditModal({ user, isMe, onClose, onDone }) {
  const [f, setF] = useState({ name: user.name, role: user.role, active: user.active });
  const { busy, error, submit } = useSubmit(() => api(`/api/users/${user.id}`, { method: 'PUT', body: f }), onDone);
  return (
    <Modal title={`Edit ${user.email}`} onClose={onClose} footer={<Footer formId="edit-user" busy={busy} onClose={onClose} label="Save changes" />}>
      <form id="edit-user" onSubmit={submit}>
        {error && <div className={styles.alert} role="alert">{error}</div>}
        {isMe && <p className={styles.hint}>You cannot change your own role or deactivate yourself.</p>}
        <FormField label="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
        <RoleSelect value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} disabled={isMe} />
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '.9rem' }}>
          <input type="checkbox" checked={f.active} disabled={isMe} onChange={(e) => setF({ ...f, active: e.target.checked })} />
          Active (can sign in)
        </label>
      </form>
    </Modal>
  );
}

function ResetModal({ user, onClose, onDone }) {
  const [password, setPassword] = useState('');
  const { busy, error, submit } = useSubmit(() => api(`/api/users/${user.id}/password`, { method: 'POST', body: { password } }), onDone);
  return (
    <Modal title={`Reset password for ${user.email}`} onClose={onClose} footer={<Footer formId="reset-pw" busy={busy} onClose={onClose} label="Reset password" />}>
      <form id="reset-pw" onSubmit={submit}>
        {error && <div className={styles.alert} role="alert">{error}</div>}
        <FormField label="New temporary password" type="text" autoComplete="off" hint="At least 12 characters. The user is signed out of all other sessions." value={password} onChange={(e) => setPassword(e.target.value)} minLength={12} required />
      </form>
    </Modal>
  );
}
