'use client';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error || `Request failed (${status})`);
    this.status = status;
    this.body = body;
  }
}

/**
 * Returns api(url, { method, body }) -> parsed JSON. Objects are sent as JSON.
 * A 401 sends the user to /login (and still throws so callers stop).
 */
export function useApi() {
  const router = useRouter();
  return useCallback(async (url, { method = 'GET', body } = {}) => {
    const res = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
    const data = await res.json().catch(() => null);
    if (res.status === 401) {
      router.push('/login');
      throw new ApiError(401, { error: 'Session expired. Please sign in again.' });
    }
    if (!res.ok) throw new ApiError(res.status, data);
    return data;
  }, [router]);
}

/** Warn on tab close / reload while `dirty`. */
export function beforeUnloadGuard(dirty) {
  const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
  if (dirty) window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
}

export const formatDate = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '');
