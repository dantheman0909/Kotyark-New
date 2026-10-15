// Site-wide constants and settings access.
import { queryOne } from './db';

export const SITE_URL = (process.env.SITE_URL || 'https://www.kotyark.com').replace(/\/$/, '');
export const SITE_NAME = 'Kotyark Industries';

export function absoluteUrl(p = '/') {
  return `${SITE_URL}${p.startsWith('/') ? p : `/${p}`}`;
}

/** Read one site_settings value (JSON) or fallback. */
export async function getSetting(key, fallback = null) {
  const row = await queryOne('SELECT value FROM site_settings WHERE key = $1', [key]);
  return row ? row.value : fallback;
}
