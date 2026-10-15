// Validation for known site_settings keys (server). Unknown keys/fields are rejected.
import { httpError } from '@/lib/auth';
import { SETTINGS, SETTING_KEYS } from './fields';

export { SETTINGS, SETTING_KEYS };

function text(v, label, max) {
  if (v === undefined || v === null) return '';
  if (typeof v !== 'string') throw httpError(400, `${label} must be text`);
  const t = v.trim();
  if (t.length > max) throw httpError(400, `${label} is too long (max ${max})`);
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(t)) throw httpError(400, `${label} contains invalid characters`);
  return t;
}

const KINDS = {
  text: (v, label, spec) => text(v, label, spec.max || 200),
  email: (v, label) => {
    const t = text(v, label, 254);
    if (t && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) throw httpError(400, `${label} must be a valid email`);
    return t;
  },
  url: (v, label) => {
    const t = text(v, label, 500);
    if (t) {
      let u;
      try { u = new URL(t); } catch { throw httpError(400, `${label} must be a full URL starting with https://`); }
      if (u.protocol !== 'https:' && u.protocol !== 'http:') throw httpError(400, `${label} must be an http(s) URL`);
    }
    return t;
  },
  image: (v, label) => {
    const t = text(v, label, 500);
    if (t && !/^\/media\/[0-9a-f-]{36}$/i.test(t) && !/^https?:\/\//i.test(t)) {
      throw httpError(400, `${label} must be a media item (/media/<id>) or an http(s) URL`);
    }
    return t;
  },
  ga4: (v, label) => {
    const t = text(v, label, 30);
    if (t && !/^G-[A-Z0-9]{6,14}$/.test(t)) throw httpError(400, `${label} must look like G-XXXXXXXXXX`);
    return t;
  },
};

export function emptySetting(key) {
  return Object.fromEntries(Object.keys(SETTINGS[key].fields).map((f) => [f, '']));
}

/** Validate and normalise a value for `key`; throws httpError(400). */
export function validateSetting(key, value) {
  const def = SETTINGS[key];
  if (!def) throw httpError(400, `Unknown setting: ${key}`);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw httpError(400, 'Value must be an object');
  for (const f of Object.keys(value)) {
    if (!def.fields[f]) throw httpError(400, `Unknown field: ${key}.${f}`);
  }
  const out = {};
  for (const [f, spec] of Object.entries(def.fields)) out[f] = KINDS[spec.kind](value[f], spec.label, spec);
  return out;
}
