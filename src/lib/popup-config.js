// Pop-up constants, defaults and pure helpers shared by the server (validation, loading), the public
// host and the admin editor/preview. No DB and no Node-only imports.

export const POPUP_ENUMS = {
  preset: ['brand', 'light', 'dark', 'amber'],
  layout: ['modal', 'slide-in', 'top-bar', 'bottom-bar', 'fullscreen'],
  position: ['bottom-right', 'bottom-left'],
  width: ['sm', 'md', 'lg'],
  buttonStyle: ['solid', 'outline'],
  animation: ['fade', 'slide', 'zoom', 'none'],
  font: ['brand', 'system', 'serif'],
  imagePosition: ['top', 'left', 'right', 'background'],
  trigger: ['load', 'delay', 'scroll', 'exit-intent'],
  devices: ['all', 'desktop', 'mobile'],
  frequency: ['every-visit', 'session', 'days', 'once'],
};

export const MOBILE_MAX_WIDTH = 767;

// Brand presets, from the site tokens in globals.css.
export const PRESETS = {
  brand: { background: '#0d3b24', text: '#f0fff4', accent: '#d97706' },
  light: { background: '#ffffff', text: '#0c1f13', accent: '#1b5e3a' },
  dark:  { background: '#071a10', text: '#f0fff4', accent: '#2e8b57' },
  amber: { background: '#fef3c7', text: '#3b2305', accent: '#b45309' },
};

export const FONT_STACKS = {
  heading: {
    brand: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
  },
  body: {
    brand: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
  },
};

export const WIDTHS = { sm: 380, md: 480, lg: 640 };

export const DEFAULT_CONTENT = {
  eyebrow: '', heading: '', bodyHtml: '', imageId: '', imageAlt: '', imagePosition: 'top',
  primaryCta: { label: '', href: '' }, secondaryCta: { label: '', href: '' }, dismissLabel: 'No thanks',
};
export const DEFAULT_DESIGN = {
  preset: 'brand', layout: 'slide-in', position: 'bottom-right', width: 'md', radius: 16,
  background: '', text: '', accent: '', buttonStyle: 'solid', overlayOpacity: 55, animation: 'slide',
  fontHeading: 'brand', fontBody: 'brand',
};
export const DEFAULT_RULES = {
  trigger: 'delay', delaySeconds: 5, scrollPercent: 50, includePaths: [], excludePaths: [],
  devices: 'all', frequency: 'session', frequencyDays: 7, startAt: null, endAt: null,
};

export const isModalLayout = (layout) => layout === 'modal' || layout === 'fullscreen';

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

function hexToRgb(hex) {
  let h = String(hex || '').replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  return Number.isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/** Readable text colour (dark or white) for a filled background. */
export const onColor = (bg) => (luminance(bg) > 0.4 ? '#0c1f13' : '#ffffff');

/** Preset colours with any explicit overrides applied. */
export function resolveColors(design = {}) {
  const p = PRESETS[design.preset] || PRESETS.brand;
  const background = design.background || p.background;
  const text = design.text || p.text;
  const accent = design.accent || p.accent;
  return { background, text, accent, onAccent: onColor(accent) };
}

export function widthPx(design = {}) { return WIDTHS[design.width] || WIDTHS.md; }

/** Does `pathname` match a pattern? `*` matches any characters (including '/'); everything else is literal. */
export function pathMatches(pattern, pathname) {
  const pat = String(pattern || '').trim();
  if (!pat) return false;
  const norm = (s) => (s.length > 1 ? s.replace(/\/+$/, '') : s) || '/';
  const re = new RegExp('^' + norm(pat).split('*').map((p) => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
  return re.test(norm(String(pathname || '/')));
}

/** include empty = every page; exclude always wins. */
export function pathAllowed(rules = {}, pathname) {
  const inc = rules.includePaths || [];
  const exc = rules.excludePaths || [];
  if (exc.some((p) => pathMatches(p, pathname))) return false;
  return inc.length === 0 || inc.some((p) => pathMatches(p, pathname));
}

/** Routes where a pop-up never shows, whatever its rules. */
export const isBlockedRoute = (pathname) => /^\/(admin|login|preview)(\/|$)/.test(String(pathname || ''));

// --- IST text <-> ISO (the editor's schedule inputs are 'YYYY-MM-DD HH:mm' in India time, no DST) ---
const IST_MS = 5.5 * 3600_000;
const TEXT_RE = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/;

/** 'YYYY-MM-DD HH:mm' (IST) -> ISO string, or null if invalid. */
export function istTextToIso(text) {
  const m = TEXT_RE.exec(String(text || '').trim());
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
  const t = Date.UTC(y, mo - 1, d, h, mi) - IST_MS;
  const back = new Date(t + IST_MS);
  if (back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return null; // e.g. 31 Feb
  return new Date(t).toISOString();
}
/** ISO -> 'YYYY-MM-DD HH:mm' in IST ('' for null/invalid). */
export function isoToIstText(iso) {
  if (!iso) return '';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  return new Date(t + IST_MS).toISOString().slice(0, 16).replace('T', ' ');
}

/** Google intrusive-interstitial guard. Returns warning strings (shown in the editor and returned by the API). */
export function seoWarnings(design = {}, rules = {}) {
  const out = [];
  const mobileVisible = rules.devices !== 'desktop';
  const early = rules.trigger === 'load' || (rules.trigger === 'delay' && Number(rules.delaySeconds) < 3);
  if (mobileVisible && isModalLayout(design.layout) && early) {
    out.push('A full-screen or modal pop-up that opens within 3 seconds of page load on mobile can be treated as an intrusive interstitial by Google and hurt search ranking. Use a slide-in or bar, delay it by 3 seconds or more, or show it on desktop only.');
  }
  if (rules.trigger === 'exit-intent' && rules.devices === 'mobile') {
    out.push('Exit-intent only works with a mouse, so this pop-up will never appear on mobile.');
  }
  return out;
}

export { clamp };
