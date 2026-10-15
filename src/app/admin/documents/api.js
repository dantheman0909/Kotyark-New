// Fetch helper for the Documents admin screen. Redirects to /login when a session is missing/expired.
export async function api(url, { method = 'GET', json, formData } = {}) {
  const init = { method, credentials: 'same-origin', headers: {} };
  if (json !== undefined) { init.body = JSON.stringify(json); init.headers['Content-Type'] = 'application/json'; }
  if (formData) init.body = formData;
  const res = await fetch(url, init);
  if (res.status === 401) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Session expired. Redirecting to sign in...');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export function formatBytes(n) {
  if (!n) return '-';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const DATE_PATTERN = '\\d{4}-\\d{2}-\\d{2}';

/** Indian FY label for a YYYY-MM-DD date ('FY 2024-25'), or ''. */
export function fyOf(iso) {
  const m = /^(\d{4})-(\d{2})-\d{2}$/.exec(iso || '');
  if (!m) return '';
  const start = Number(m[2]) >= 4 ? Number(m[1]) : Number(m[1]) - 1;
  return `FY ${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}
