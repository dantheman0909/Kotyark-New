import { revalidatePath, revalidateTag } from 'next/cache';
import { query, queryOne } from '@/lib/db';
import { requireUser, errorResponse, httpError } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { TAGS } from '@/lib/revalidate';
import { SETTING_KEYS, SETTINGS, emptySetting, validateSetting } from './schema';

export const dynamic = 'force-dynamic';

// Any logged-in user may read.
export async function GET() {
  try {
    await requireUser();
    const rows = await query(`SELECT key, value, updated_at FROM site_settings WHERE key = ANY($1)`, [SETTING_KEYS]);
    const settings = {};
    const updatedAt = {};
    for (const k of SETTING_KEYS) {
      const row = rows.find((r) => r.key === k);
      settings[k] = { ...emptySetting(k), ...(row?.value || {}) };
      updatedAt[k] = row?.updated_at ?? null;
    }
    return Response.json({ settings, updatedAt }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return errorResponse(e); }
}

// PUT { key, value } : upsert one known key.
export async function PUT(req) {
  try {
    const user = await requireUser('settings:write');
    let body;
    try { body = await req.json(); } catch { throw httpError(400, 'Invalid JSON body'); }
    const key = body?.key;
    if (!SETTINGS[key]) throw httpError(400, `Unknown setting: ${key}`);
    const value = validateSetting(key, body.value);

    const before = await queryOne(`SELECT value FROM site_settings WHERE key = $1`, [key]);
    await query(
      `INSERT INTO site_settings(key, value, updated_at) VALUES ($1, $2::jsonb, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [key, JSON.stringify(value)]);

    await audit(user, 'update', 'setting', key, `Updated ${SETTINGS[key].label} settings`,
      { before: before?.value ?? null, after: value });
    revalidatePath('/', 'layout');
    revalidateTag(TAGS.settings, 'max');
    return Response.json({ ok: true, key, value });
  } catch (e) { return errorResponse(e); }
}
