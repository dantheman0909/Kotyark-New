'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './login.module.css';

export const dynamic = 'force-dynamic';

// Only same-origin relative paths inside /admin are honoured.
function safeNext(value) {
  if (typeof value !== 'string') return '/admin';
  if (!value.startsWith('/admin')) return '/admin';
  if (value.startsWith('//') || value.includes('\\') || /[\r\n]/.test(value)) return '/admin';
  if (value !== '/admin' && !/^\/admin[/?#]/.test(value)) return '/admin';
  return value;
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        router.push(safeNext(params.get('next')));
        router.refresh();
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.band}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/kil-logo-white-trim.png" alt="Kotyark Industries" className={styles.logo} />
      </div>
      <form onSubmit={handleSubmit} className={styles.card}>
        <div className={styles.eyebrow}>Investor portal</div>
        <h1 className={styles.title}>Sign in to publish filings</h1>

        <label className={styles.field} htmlFor="email">
          <span className={styles.label}>Email</span>
          <input
            id="email"
            type="text"
            inputMode="email"
            autoComplete="username"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            className={styles.input}
            required
            autoFocus
          />
        </label>

        <label className={styles.field} htmlFor="password">
          <span className={styles.label}>Password</span>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            className={styles.input}
            required
          />
        </label>

        <span className={styles.error} role="alert">{error}</span>

        <button type="submit" className={styles.submit} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <span className={styles.foot}>Kotyark Industries Limited — Internal use only</span>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
