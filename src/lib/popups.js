// Pop-ups: server-side validation, row shaping and loading. Server-only (DB).
import { query, queryOne } from './db';
import { httpError } from './auth';
import { sanitizeRichText, htmlToText } from './sanitize';
import { scopePopupCss } from './popup-css';
import {
  blockingPublishMessage, POPUP_ENUMS, DEFAULT_CONTENT, DEFAULT_DESIGN, DEFAULT_RULES, istTextToIso, seoWarnings, isBlockedRoute, pathAllowed,
} from './popup-config';
import { imageSrc } from './blocks/schemas';

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const POPUP_COLUMNS = `id, name, status, priority, content, design, custom_css, scoped_css, rules,
  published_at, created_by, updated_by, created_at, updated_at`;

export function assertUuid(id) { if (!UUID_RE.test(String(id || ''))) throw httpError(404, 'Pop-up not found'); }

// --- field validators -----------------------------------------------------------------------

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const str = (v, label, max, { required = false } = {}) => {
  const s = v == null ? '' : String(v).trim();
  if (required && !s) throw httpError(400, `${label} is required`);
  if (s.length > max) throw httpError(400, `${label} must be at most ${max} characters`);
  return s;
};
const oneOf = (v, label, list) => {
  if (!list.includes(v)) throw httpError(400, `${label} must be one of: ${list.join(', ')}`);
  return v;
};
const intIn = (v, label, lo, hi) => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  if (!Number.isInteger(n) || n < lo || n > hi) throw httpError(400, `${label} must be a whole number from ${lo} to ${hi}`);
  return n;
};
const hex = (v, label) => {
  const s = String(v ?? '').trim();
  if (s === '') return '';
  if (!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) throw httpError(400, `${label} must be a hex colour like #0d3b24`);
  return s.toLowerCase();
};
/** Relative '/path' (not '//' or with a backslash) or https. */
export const isSafeHref = (h) => (/^\/(?![\/\\])[^\s\\]*$/.test(h) || /^https:\/\/[^\s\\]+$/i.test(h));

function cleanCta(v, label) {
  const o = isObj(v) ? v : {};
  const l = str(o.label, `${label} label`, 40);
  const href = str(o.href, `${label} link`, 500);
  if (!l && !href) return { label: '', href: '' };
  if (!l) throw httpError(400, `${label} needs a label`);
  if (!href || !isSafeHref(href)) throw httpError(400, `${label} link must start with / (e.g. /contact) or https://`);
  return { label: l, href };
}

async function cleanImage(v) {
  const s = String(v ?? '').trim();
  if (!s) return '';
  if (UUID_RE.test(s)) {
    if (!(await queryOne('SELECT 1 FROM media WHERE id = $1', [s]))) throw httpError(400, 'Image not found in the media library');
    return s.toLowerCase();
  }
  if (s.length > 500 || !isSafeHref(s)) throw httpError(400, 'Image must be a media-library image, a /path or an https:// URL');
  return s;
}

async function cleanContent(input) {
  const c = { ...DEFAULT_CONTENT, ...(isObj(input) ? input : {}) };
  const bodyHtml = sanitizeRichText(String(c.bodyHtml ?? ''));
  if (bodyHtml.length > 8000) throw httpError(400, 'Body text is too long');
  const imageId = await cleanImage(c.imageId);
  const imageAlt = str(c.imageAlt, 'Image alt text', 200);
  if (imageId && !imageAlt) throw httpError(400, 'Alt text is required when an image is set');
  return {
    eyebrow: str(c.eyebrow, 'Eyebrow', 60),
    heading: str(c.heading, 'Heading', 140),
    bodyHtml,
    imageId,
    imageAlt: imageId ? imageAlt : '',
    imagePosition: oneOf(c.imagePosition, 'Image position', POPUP_ENUMS.imagePosition),
    primaryCta: cleanCta(c.primaryCta, 'Primary button'),
    secondaryCta: cleanCta(c.secondaryCta, 'Secondary button'),
    dismissLabel: str(c.dismissLabel, 'Dismiss label', 40),
  };
}

function cleanDesign(input) {
  const d = { ...DEFAULT_DESIGN, ...(isObj(input) ? input : {}) };
  return {
    preset: oneOf(d.preset, 'Preset', POPUP_ENUMS.preset),
    layout: oneOf(d.layout, 'Layout', POPUP_ENUMS.layout),
    position: oneOf(d.position, 'Position', POPUP_ENUMS.position),
    width: oneOf(d.width, 'Width', POPUP_ENUMS.width),
    radius: intIn(d.radius, 'Corner radius', 0, 40),
    background: hex(d.background, 'Background colour'),
    text: hex(d.text, 'Text colour'),
    accent: hex(d.accent, 'Accent colour'),
    buttonStyle: oneOf(d.buttonStyle, 'Button style', POPUP_ENUMS.buttonStyle),
    overlayOpacity: intIn(d.overlayOpacity, 'Overlay opacity', 0, 90),
    animation: oneOf(d.animation, 'Animation', POPUP_ENUMS.animation),
    fontHeading: oneOf(d.fontHeading, 'Heading font', POPUP_ENUMS.font),
    fontBody: oneOf(d.fontBody, 'Body font', POPUP_ENUMS.font),
  };
}

function cleanPaths(v, label) {
  if (v == null || v === '') return [];
  const list = Array.isArray(v) ? v : String(v).split(/\r?\n/);
  const out = [];
  for (const raw of list) {
    const p = String(raw).trim().replace(/\*{2,}/g, '*');
    if (!p) continue;
    if (p.length > 100 || !/^\/[A-Za-z0-9_\-.~%*\/]*$/.test(p) || p.startsWith('//')) {
      throw httpError(400, `${label}: "${p.slice(0, 60)}" must start with / and use only letters, digits, - _ . ~ % / and * (wildcard)`);
    }
    if (!out.includes(p)) out.push(p);
  }
  if (out.length > 30) throw httpError(400, `${label}: at most 30 patterns`);
  return out;
}

/** ISO string, 'YYYY-MM-DD HH:mm' (India time) or empty -> ISO | null. */
function cleanWhen(v, label) {
  if (v == null || String(v).trim() === '') return null;
  const s = String(v).trim();
  const iso = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}$/.test(s) ? istTextToIso(s)
    : (/^\d{4}-\d{2}-\d{2}T[\d:.]+(Z|[+-]\d{2}:?\d{2})$/.test(s) && !Number.isNaN(Date.parse(s)) ? new Date(s).toISOString() : null);
  if (!iso) throw httpError(400, `${label} must look like 2026-11-01 09:30 (India time)`);
  return iso;
}

function cleanRules(input) {
  const r = { ...DEFAULT_RULES, ...(isObj(input) ? input : {}) };
  const startAt = cleanWhen(r.startAt, 'Start');
  const endAt = cleanWhen(r.endAt, 'End');
  if (startAt && endAt && Date.parse(endAt) <= Date.parse(startAt)) throw httpError(400, 'End must be after start');
  return {
    trigger: oneOf(r.trigger, 'Trigger', POPUP_ENUMS.trigger),
    delaySeconds: intIn(r.delaySeconds, 'Delay (seconds)', 0, 120),
    scrollPercent: intIn(r.scrollPercent, 'Scroll percent', 5, 100),
    includePaths: cleanPaths(r.includePaths, 'Show on pages'),
    excludePaths: cleanPaths(r.excludePaths, 'Never show on pages'),
    devices: oneOf(r.devices, 'Devices', POPUP_ENUMS.devices),
    frequency: oneOf(r.frequency, 'Frequency', POPUP_ENUMS.frequency),
    frequencyDays: intIn(r.frequencyDays, 'Frequency days', 1, 365),
    startAt, endAt,
  };
}

/**
 * Validate a create/update body. `base` is the existing popup (PUT) or null (POST); sections not
 * supplied keep the base values (sub-fields are merged). Returns the row values + CSS warnings.
 */
export async function cleanPopup(body, popupId, base = null) {
  if (!isObj(body)) throw httpError(400, 'Invalid request body');
  const merged = (key) => (body[key] === undefined ? base?.[key] : { ...(base?.[key] || {}), ...(isObj(body[key]) ? body[key] : {}) });
  const name = str(body.name ?? base?.name, 'Name', 120, { required: true });
  const priority = intIn(body.priority ?? base?.priority ?? 0, 'Priority', 0, 1000);
  const content = await cleanContent(merged('content'));
  const design = cleanDesign(merged('design'));
  const rules = cleanRules(merged('rules'));
  const customCss = String(body.customCss ?? base?.customCss ?? '');
  const scoped = scopePopupCss(customCss, popupId);
  if (scoped.fatal) throw httpError(400, scoped.warnings[scoped.warnings.length - 1] || 'Custom CSS was rejected');
  return { name, priority, content, design, rules, customCss, scopedCss: scoped.css, warnings: [...scoped.warnings, ...seoWarnings(design, rules)] };
}

/** Publishing needs something to show. */
export function assertPublishable(p) {
  const block = blockingPublishMessage(p.design, p.rules);
  if (block) throw httpError(400, block);
  if (!p.content.heading && !htmlToText(p.content.bodyHtml)) throw httpError(400, 'Add a heading or body text before publishing');
}

// --- row shaping ----------------------------------------------------------------------------

/** Full admin shape (includes raw CSS). */
export function shapePopup(r) {
  const content = { ...DEFAULT_CONTENT, ...(r.content || {}) };
  const design = { ...DEFAULT_DESIGN, ...(r.design || {}) };
  const rules = { ...DEFAULT_RULES, ...(r.rules || {}) };
  return {
    id: r.id, name: r.name, status: r.status, priority: r.priority,
    content, design, rules, customCss: r.custom_css || '', scopedCss: r.scoped_css || '',
    publishedAt: r.published_at, createdAt: r.created_at, updatedAt: r.updated_at,
    warnings: seoWarnings(design, rules),
  };
}

/** Minimal public payload: no raw CSS, no audit fields, no unpublished metadata. */
export function toPublicPopup(r) {
  const c = { ...DEFAULT_CONTENT, ...(r.content || {}) };
  const d = { ...DEFAULT_DESIGN, ...(r.design || {}) };
  const ru = { ...DEFAULT_RULES, ...(r.rules || {}) };
  return {
    id: r.id,
    content: {
      eyebrow: c.eyebrow, heading: c.heading, bodyHtml: sanitizeRichText(String(c.bodyHtml ?? '')), imageSrc: imageSrc(c.imageId), imageAlt: c.imageAlt,
      imagePosition: c.imagePosition, primaryCta: c.primaryCta, secondaryCta: c.secondaryCta, dismissLabel: c.dismissLabel,
    },
    design: d,
    css: r.scoped_css || '',
    rules: {
      trigger: ru.trigger, delaySeconds: ru.delaySeconds, scrollPercent: ru.scrollPercent,
      includePaths: ru.includePaths, excludePaths: ru.excludePaths, devices: ru.devices,
      frequency: ru.frequency, frequencyDays: ru.frequencyDays,
    },
  };
}

/**
 * Published pop-ups inside their schedule window, highest priority first. Never throws: [] on any failure.
 * With `path`, only pop-ups whose include/exclude patterns match it (and none on /admin, /login, /preview).
 */
export async function loadActivePopups(path = null) {
  try {
    const rows = await query(
      `SELECT id, content, design, scoped_css, rules FROM popups
        WHERE status = 'published'
          AND (NULLIF(rules->>'startAt','') IS NULL OR (rules->>'startAt')::timestamptz <= now())
          AND (NULLIF(rules->>'endAt','')   IS NULL OR (rules->>'endAt')::timestamptz   >  now())
        ORDER BY priority DESC, updated_at DESC LIMIT 20`);
    const all = rows.map(toPublicPopup);
    if (path == null) return all;
    return isBlockedRoute(path) ? [] : all.filter((p) => pathAllowed(p.rules, path));
  } catch (err) {
    console.error('[cms] popups load failed, rendering none:', err.message);
    return [];
  }
}

/** Day bucket used by popup_stats (India calendar day). */
export const STATS_DAY_SQL = `(now() AT TIME ZONE 'Asia/Kolkata')::date`;
