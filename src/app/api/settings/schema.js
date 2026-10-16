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
  number: (v, label, spec) => {
    if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
      if (spec.required) throw httpError(400, `${label} is required`);
      return '';
    }
    const n = typeof v === 'number' ? v : (typeof v === 'string' && /^[-+]?\d+(\.\d+)?$/.test(v.trim()) ? Number(v) : NaN);
    if (!Number.isFinite(n)) throw httpError(400, `${label} must be a number`);
    if (n < spec.min || n > spec.max) throw httpError(400, `${label} must be between ${spec.min} and ${spec.max}`);
    return n;
  },
  datetime: (v, label) => {
    const t = text(v, label, 40);
    if (!t) return '';
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) throw httpError(400, `${label} must be a valid date and time`);
    if (d.getTime() > Date.now() + 86_400_000) throw httpError(400, `${label} cannot be in the future`);
    return d.toISOString();
  },
  ga4: (v, label) => {
    const t = text(v, label, 30);
    if (t && !/^G-[A-Z0-9]{6,14}$/.test(t)) throw httpError(400, `${label} must look like G-XXXXXXXXXX`);
    return t;
  },
};

export function emptySetting(key) {
  return Object.fromEntries(Object.entries(SETTINGS[key].fields).map(([f, spec]) => [f, spec.default ?? '']));
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
  if (key === 'stock_quote') checkStockQuote(out);
  return out;
}

// Cross-field sanity for the manual stock fallback: catches swapped or mistyped figures before they reach the site.
function checkStockQuote(v) {
  const has = (k) => typeof v[k] === 'number';
  if (has('dayLow') && has('dayHigh') && v.dayLow > v.dayHigh) throw httpError(400, 'Day low cannot be above day high');
  if (has('low52') && has('high52') && v.low52 > v.high52) throw httpError(400, '52-week low cannot be above 52-week high');
  if (has('price') && has('prevClose') && has('change') && Math.abs(v.change - (v.price - v.prevClose)) > 0.02) {
    throw httpError(400, `Day change should equal last price minus previous close (${(v.price - v.prevClose).toFixed(2)})`);
  }
}
