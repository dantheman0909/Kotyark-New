// Pop-up custom CSS as an ALLOWLIST. The author's CSS is parsed (postcss + postcss-selector-parser), every
// escape and comment is decoded away, and the stylesheet is then REBUILT from the pieces that match a known-safe
// construct: allowed classes/pseudo-states in selectors, allowed properties with checked values, @media with a
// few conditions, and this pop-up's own @keyframes. Nothing is copied through; anything else is dropped with a
// warning. Output rules are always `[data-kp="<id>"] <selector>` (descendant of the root, never the root itself).
// Pure (no DB), so it runs on the server and in tests. Only the scoped output is rendered; the raw input is stored.
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import {
  POPUP_CSS_CLASSES, POPUP_CSS_PSEUDO_CLASSES, POPUP_CSS_PSEUDO_ELEMENTS, POPUP_CSS_BODY_ELEMENTS,
  POPUP_CSS_FONT_FAMILIES, POPUP_CSS_ALLOWED_PROPERTIES,
} from './popup-css-spec.js';

export * from './popup-css-spec.js';
export const MAX_POPUP_CSS_BYTES = 10 * 1024;

const CLASS_SET = new Set(POPUP_CSS_CLASSES.map((c) => c.slice(1)));
const PSEUDO_CLASS_SET = new Set(POPUP_CSS_PSEUDO_CLASSES);
const PSEUDO_ELEMENT_SET = new Set(POPUP_CSS_PSEUDO_ELEMENTS);
const BODY_EL_SET = new Set(POPUP_CSS_BODY_ELEMENTS);
const FONT_SET = new Set(POPUP_CSS_FONT_FAMILIES);

/** Decode CSS escapes (\6a, \j) and strip comments so obfuscated payloads are seen as written. */
export function decodeCss(s) {
  return String(s)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\\([0-9a-f]{1,6})\s?/gi, (_, h) => { const n = parseInt(h, 16); return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : ''; })
    .replace(/\\(\r\n|\n|\r|\f)/g, '')
    .replace(/\\(.)/g, '$1');
}
const squash = (s) => s.replace(/\s+/g, ' ').trim();
const short = (s) => { const t = squash(String(s)); return t.length > 60 ? `${t.slice(0, 57)}...` : t; };

// ---------- selectors ----------

/** Returns { sel, pseudoElement } (sel is unprefixed) or { reason }. Rebuilt from validated tokens only. */
function checkSelector(raw) {
  const text = squash(decodeCss(raw));
  if (!text) return { reason: 'empty selector' };
  let root;
  try { root = selectorParser().astSync(text); } catch { return { reason: 'unparseable selector' }; }
  if (root.nodes.length !== 1) return { reason: 'selector lists must be written as separate comma-separated selectors that each parse' };
  const nodes = root.nodes[0].nodes;
  if (!nodes.length) return { reason: 'empty selector' };

  // Split into compounds separated by combinators.
  const compounds = []; // { nodes: [], combinator: ' ' | '>' (the one BEFORE this compound) }
  let pending = null;
  let cur = null;
  for (const n of nodes) {
    if (n.type === 'combinator') {
      const v = n.value.trim();
      if (!cur) return { reason: 'a selector cannot start with a combinator' };
      if (v !== '' && v !== '>') return { reason: `combinator "${v}" is not allowed` };
      pending = v === '>' ? '>' : ' ';
      compounds.push(cur); cur = null;
    } else {
      if (!cur) cur = { nodes: [], combinator: pending };
      cur.nodes.push(n);
    }
  }
  if (!cur) return { reason: 'a selector cannot end with a combinator' };
  compounds.push(cur);

  let seenBody = false;
  let seenTag = false;
  let pseudoElement = false;
  const parts = [];
  for (let i = 0; i < compounds.length; i += 1) {
    const { nodes: cn, combinator } = compounds[i];
    if (pseudoElement) return { reason: 'a pseudo-element must end the selector' };
    const head = cn[0];
    let text1;
    if (head.type === 'class') {
      if (seenTag) return { reason: 'classes cannot follow body elements' };
      if (!CLASS_SET.has(head.value)) return { reason: `class .${head.value} is not allowed` };
      text1 = `.${head.value}`;
      if (head.value === 'kp-body') seenBody = true;
    } else if (head.type === 'tag' && head.namespace === undefined) {
      const tag = head.value.toLowerCase();
      if (!BODY_EL_SET.has(tag)) return { reason: `element "${head.value}" is not allowed` };
      if (!seenBody) return { reason: `element "${tag}" is only allowed inside .kp-body` };
      seenTag = true;
      text1 = tag;
    } else {
      return { reason: `"${head.toString().trim()}" is not allowed` };
    }
    for (const n of cn.slice(1)) {
      if (n.type !== 'pseudo' || (n.nodes && n.nodes.length)) return { reason: `"${n.toString().trim()}" is not allowed` };
      const v = n.value.toLowerCase();
      if (v.startsWith('::')) {
        if (!PSEUDO_ELEMENT_SET.has(v)) return { reason: `${v} is not allowed` };
        if (pseudoElement) return { reason: 'only one pseudo-element is allowed' };
        pseudoElement = v;
      } else {
        if (!PSEUDO_CLASS_SET.has(v)) return { reason: `${v} is not allowed` };
        if (pseudoElement) return { reason: 'pseudo-classes cannot follow a pseudo-element' };
      }
      text1 += v;
    }
    parts.push(i === 0 ? text1 : `${combinator === '>' ? ' > ' : ' '}${text1}`);
  }
  return { sel: parts.join(''), pseudoElement: !!pseudoElement && (pseudoElement === '::before' || pseudoElement === '::after') };
}

// ---------- values ----------

const MEDIA_URL = /^\/media\/[0-9a-f-]{36}$/;
const COLOR_FNS = ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color-mix', 'color'];
const MATH_FNS = ['calc', 'min', 'max', 'clamp'];
const GRADIENT_FNS = ['linear-gradient', 'radial-gradient', 'conic-gradient', 'repeating-linear-gradient', 'repeating-radial-gradient', 'repeating-conic-gradient'];
const FILTER_FNS = ['blur', 'brightness', 'contrast', 'grayscale', 'saturate', 'drop-shadow'];
const TIMING_FNS = ['cubic-bezier', 'steps'];
const BASE_FNS = new Set([...COLOR_FNS, ...MATH_FNS]);
const BG_FNS = new Set([...BASE_FNS, ...GRADIENT_FNS]);
const FILTER_SET = new Set([...COLOR_FNS, ...FILTER_FNS]);
const TIMING_SET = new Set([...BASE_FNS, ...TIMING_FNS]);

/** Normalises a declaration value; returns { v } or { reason }. url() only when `allowUrl` and exactly /media/<uuid>. */
function cleanValue(rawValue, { funcs = BASE_FNS, allowUrl = false } = {}) {
  let v = squash(decodeCss(rawValue)).replace(/\s*!\s*important$/i, '').trim();
  if (!v) return { reason: 'empty value' };
  const lower = v.toLowerCase();
  if (lower.includes('expression(')) return { reason: 'expression()' };
  if (/(?:java|vb)script\s*:/.test(lower)) return { reason: 'script URL' };
  const urls = [];
  const rest = v.replace(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)"'\s]*))\s*\)/gi, (m, a, b, c) => { urls.push(a ?? b ?? c ?? ''); return ' __url__ '; });
  if (/url\s*\(/i.test(rest)) return { reason: 'malformed url()' };
  for (const u of urls) {
    if (!allowUrl) return { reason: 'url() is not allowed here' };
    if (!MEDIA_URL.test(u)) return { reason: `url(${short(u)}) (only url(/media/<image id>) is allowed)` };
  }
  if (!/^[\w\s#%.,()/+*"'-]*$/.test(rest) || rest.includes('/*') || rest.includes('*/')) return { reason: 'contains characters that are not allowed in a value' };
  for (const m of rest.matchAll(/([a-z][a-z0-9-]*)\s*\(/gi)) {
    const fn = m[1].toLowerCase();
    if (fn !== '__url__' && !funcs.has(fn)) return { reason: `function ${fn}() is not allowed here` };
  }
  // A function name must stand alone: '--calc(' or 'x-calc(' must not pass as calc(.
  for (const m of rest.matchAll(/([\w-]+)\s*\(/g)) {
    const fn = m[1].toLowerCase();
    if (fn !== '__url__' && !funcs.has(fn)) return { reason: `function ${short(fn)}() is not allowed here` };
  }
  return { v };
}

const MARGIN_MAX = { px: 64, rem: 4, em: 4 };
function checkMargin(raw) {
  const c = cleanValue(raw, { funcs: new Set() });
  if (c.reason) return c;
  for (const tok of c.v.split(' ')) {
    if (tok === '0' || tok === 'auto') continue;
    const m = /^(\d+(?:\.\d+)?)(px|rem|em)$/i.exec(tok);
    if (!m || parseFloat(m[1]) > MARGIN_MAX[m[2].toLowerCase()]) return { reason: `margin must have no negative value and be at most 64px / 4rem / 4em per side (got "${short(tok)}")` };
  }
  return c;
}
// Size caps for every property that can grow the pop-up box. Only px / rem / em (and unitless where noted);
// viewport, percentage and absolute units are refused so a bar or slide-in can never be stretched over the page.
const LEN_CAPS = [
  [/^padding(-(top|right|bottom|left))?$/, { px: 64, rem: 4, em: 4 }],
  [/^(row-|column-)?gap$/, { px: 48, rem: 3, em: 3 }],
  [/^font-size$/, { px: 72, rem: 4.5, em: 4.5 }],
  [/^line-height$/, { px: 96, rem: 6, em: 6, '': 3 }],
  [/^(letter|word)-spacing$/, { px: 16, rem: 1, em: 1 }],
  [/^(border(-(top|right|bottom|left))?(-width)?|outline(-width)?|outline-offset|text-decoration-thickness|text-underline-offset)$/, { px: 16, rem: 1, em: 1 }],
  [/^border(-(top|bottom)-(left|right))?-radius$/, { px: 999, rem: 60, em: 60, '%': 50 }],
];
function capFor(prop) { for (const [re, cap] of LEN_CAPS) if (re.test(prop)) return cap; return null; }
function checkLengths(c, prop, cap) {
  for (const m of c.v.matchAll(/(-?\d*\.?\d+)([a-z%]*)/gi)) {
    const unit = m[2].toLowerCase();
    const n = Math.abs(parseFloat(m[1]));
    if (n === 0) continue;
    if (!(unit in cap)) return { reason: `${prop} only accepts px, rem or em sizes (got "${short(m[0])}")` };
    if (n > cap[unit]) return { reason: `${prop} is limited to ${cap[unit]}${unit} (got "${short(m[0])}")` };
  }
  return c;
}
function checkMaxWidth(raw) {
  const c = cleanValue(raw, { funcs: new Set() });
  if (c.reason) return c;
  const m = /^(\d+(?:\.\d+)?)%$/.exec(c.v);
  if (!m || parseFloat(m[1]) > 100) return { reason: 'max-width may only be a percentage up to 100%' };
  return c;
}
function checkFontFamily(raw) {
  const c = cleanValue(raw, { funcs: new Set() });
  if (c.reason) return c;
  for (const fam of c.v.split(',')) {
    const f = fam.trim().replace(/^(["'])(.*)\1$/, '$2').trim().toLowerCase();
    if (!FONT_SET.has(f)) return { reason: `font "${short(fam)}" is not available (use Plus Jakarta Sans, Inter, system-ui, sans-serif or serif)` };
  }
  return c;
}
const CURSORS = new Set(['auto', 'default', 'pointer', 'text', 'help', 'not-allowed', 'wait', 'progress', 'move', 'grab', 'grabbing', 'zoom-in', 'zoom-out']);
function checkCursor(raw) {
  const c = cleanValue(raw, { funcs: new Set() });
  if (c.reason) return c;
  if (!CURSORS.has(c.v.toLowerCase())) return { reason: 'cursor must be a plain keyword' };
  return c;
}
const ANIM_KEYWORDS = new Set(['none', 'infinite', 'normal', 'reverse', 'alternate', 'alternate-reverse', 'forwards', 'backwards', 'both', 'running', 'paused',
  'ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'step-start', 'step-end', 'start', 'end', 'initial']);
function checkAnimation(raw, names) {
  const c = cleanValue(raw, { funcs: TIMING_SET });
  if (c.reason) return c;
  let bad = '';
  const out = c.v.replace(/(?<![\w.-])-{0,2}[a-z_][a-z0-9_-]*/gi, (w, off, str) => {
    if (str[off + w.length] === '(') return w; // cubic-bezier( / steps( (function names are checked in cleanValue)
    if (ANIM_KEYWORDS.has(w.toLowerCase())) return w.toLowerCase();
    if (names.has(w)) return names.get(w);
    if (!bad) bad = w;
    return w;
  });
  if (bad) return { reason: `"${short(bad)}" does not name a @keyframes defined in this pop-up` };
  return { v: out };
}
const PLAIN_QUOTED = /^(["'])[^"'\\<>@]*\1$/;

/** Returns { v } or { reason } for one declaration (prop and value raw, as parsed). */
function checkDecl(rawProp, rawValue, ctx) {
  const prop = squash(decodeCss(rawProp)).toLowerCase();
  if (prop === 'content') {
    if (!ctx.pseudoContent) return { prop, reason: '"content" is only allowed on ::before / ::after' };
    const c = cleanValue(rawValue, { funcs: new Set() });
    if (c.reason) return { prop, reason: c.reason };
    if (!PLAIN_QUOTED.test(c.v)) return { prop, reason: '"content" must be a plain quoted string' };
    return { prop, v: c.v };
  }
  if (prop.startsWith('--')) return { prop, reason: 'custom properties are not allowed' };
  if (!POPUP_CSS_ALLOWED_PROPERTIES.has(prop)) return { prop, reason: `property "${short(prop)}" is not allowed` };
  let r;
  if (/^margin(-(top|right|bottom|left))?$/.test(prop)) r = checkMargin(rawValue);
  else if (prop === 'max-width') r = checkMaxWidth(rawValue);
  else if (prop === 'font-family') r = checkFontFamily(rawValue);
  else if (prop === 'cursor') r = checkCursor(rawValue);
  else if (prop.startsWith('animation')) r = checkAnimation(rawValue, ctx.keyframes);
  else if (prop === 'background' || prop === 'background-image') r = cleanValue(rawValue, { funcs: BG_FNS, allowUrl: true });
  else if (prop.includes('filter')) r = cleanValue(rawValue, { funcs: FILTER_SET });
  else if (prop.startsWith('transition')) r = cleanValue(rawValue, { funcs: TIMING_SET });
  else if (capFor(prop)) {
    // No calc()/min()/max()/clamp() for sizes: the caps must be checkable token by token.
    const c = cleanValue(rawValue, { funcs: new Set() });
    r = c.reason ? c : checkLengths(c, prop, capFor(prop));
  }
  else r = cleanValue(rawValue, { funcs: BASE_FNS });
  return r.reason ? { prop, reason: r.reason } : { prop, v: r.v };
}

// ---------- at-rules ----------

const MEDIA_COND = String.raw`\(\s*(?:(?:min-|max-)?width\s*:\s*\d+(?:\.\d+)?(?:px|em|rem)|orientation\s*:\s*(?:portrait|landscape)|prefers-reduced-motion\s*:\s*(?:reduce|no-preference)|prefers-color-scheme\s*:\s*(?:light|dark)|hover\s*:\s*(?:hover|none))\s*\)`;
const MEDIA_QUERY = new RegExp(`^(?:(?:screen|all)\\s+and\\s+)?${MEDIA_COND}(?:\\s+and\\s+${MEDIA_COND})*$`, 'i');
const KEYFRAME_NAME = /^[a-z][a-z0-9-]{0,40}$/;
const KEYFRAME_STOP = /^(?:from|to|\d{1,3}(?:\.\d+)?%)$/i;

/** Returns canonical media params, or null if any query uses a condition outside the allowlist. */
function checkMediaParams(raw) {
  const text = squash(decodeCss(raw));
  const queries = text.split(',').map((q) => q.trim());
  if (!queries.length || !queries.every((q) => MEDIA_QUERY.test(q))) return null;
  return queries.map((q) => q.toLowerCase().replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').replace(/\s*:\s*/g, ':')).join(',');
}

/**
 * @param {string} rawCss author input
 * @param {string} popupId uuid; becomes the [data-kp] value
 * @returns {{ css: string, warnings: string[], fatal: boolean }}
 *   fatal = nothing usable (too big, contains </style or <!--, or does not parse): css is '' and the API answers 400.
 */
export function scopeCss(rawCss, popupId) {
  const warnings = [];
  const raw = String(rawCss ?? '');
  if (!raw.trim()) return { css: '', warnings, fatal: false };
  const fail = (msg) => ({ css: '', warnings: [...warnings, msg], fatal: true });

  if (Buffer.byteLength(raw, 'utf8') > MAX_POPUP_CSS_BYTES) return fail(`Custom CSS is larger than ${MAX_POPUP_CSS_BYTES / 1024} KB.`);
  const decoded = decodeCss(raw);
  if (/<\/style|<!--/i.test(raw) || /<\/style|<!--/i.test(decoded)) return fail('Custom CSS must not contain "</style" or "<!--".');
  const id = String(popupId || '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return fail('Invalid pop-up id.');

  const root = `[data-kp="${id}"]`;
  const kfPrefix = `kp-${id.slice(0, 8)}-`;
  let doc;
  try { doc = postcss.parse(raw); }
  catch (e) { return fail(`CSS syntax error: ${e.reason || e.message}${e.line ? ` (line ${e.line})` : ''}`); }

  const line = (n) => (n.source?.start?.line ? ` (line ${n.source.start.line})` : '');
  const atName = (n) => squash(decodeCss(n.name)).toLowerCase();
  const warn = (msg, n) => warnings.push(`${msg}${n ? line(n) : ''}`);

  // Pre-pass: this pop-up's own, validly named top-level @keyframes (animation values may only reference these).
  const keyframes = new Map();
  doc.each((n) => {
    if (n.type === 'atrule' && atName(n) === 'keyframes') {
      const name = squash(decodeCss(n.params)).replace(/^(["'])(.*)\1$/, '$2');
      if (KEYFRAME_NAME.test(name)) keyframes.set(name, kfPrefix + name);
    }
  });

  const declsOf = (container, ctx) => {
    const out = [];
    for (const d of container.nodes) {
      if (d.type === 'comment') continue;
      if (d.type !== 'decl') { warn(`Removed nested ${d.type === 'rule' ? 'rule' : `@${d.name}`}; write each rule at the top level`, d); continue; }
      const r = checkDecl(d.prop, d.raws?.value?.raw ?? d.value, ctx);
      if (r.reason) { warn(`Removed "${short(r.prop || d.prop)}": ${r.reason}`, d); continue; }
      out.push(`${r.prop}:${r.v}`);
    }
    return out;
  };

  const ruleOut = (node) => {
    const parsed = [];
    const sel = squash(decodeCss(node.raws?.selector?.raw ?? node.selector));
    // Split on commas using the parser's own tokenisation of the decoded selector.
    let list;
    try { list = selectorParser().astSync(sel).nodes; } catch { warn(`Removed rule "${short(sel)}": unparseable selector`, node); return ''; }
    for (const s of list) {
      const r = checkSelector(s.toString());
      if (r.reason) { warn(`Removed rule "${short(sel)}": ${r.reason}`, node); return ''; }
      parsed.push(r);
    }
    if (!parsed.length) return '';
    const decls = declsOf(node, { keyframes, pseudoContent: parsed.every((p) => p.pseudoElement) });
    if (!decls.length) return '';
    return `${parsed.map((p) => `${root} ${p.sel}`).join(',')}{${decls.join(';')}}`;
  };

  const out = [];
  for (const node of doc.nodes) {
    if (node.type === 'comment') continue;
    if (node.type === 'decl') { warn(`Removed top-level declaration "${short(node.prop)}"; wrap it in a selector`, node); continue; }
    if (node.type === 'rule') { const o = ruleOut(node); if (o) out.push(o); continue; }
    // at-rules
    const name = atName(node);
    if (name === 'media' && node.nodes) {
      const params = checkMediaParams(node.params);
      if (!params) { warn(`Removed @media (${short(node.params)}): only width, orientation, prefers-reduced-motion, prefers-color-scheme and hover conditions are allowed`, node); continue; }
      const inner = [];
      for (const c of node.nodes) {
        if (c.type === 'comment') continue;
        if (c.type === 'rule') { const o = ruleOut(c); if (o) inner.push(o); }
        else warn(`Removed ${c.type === 'atrule' ? `nested @${c.name}` : 'declaration'} inside @media; only style rules are allowed there`, c);
      }
      if (inner.length) out.push(`@media ${params}{${inner.join('')}}`);
      continue;
    }
    if (name === 'keyframes' && node.nodes) {
      const kname = squash(decodeCss(node.params)).replace(/^(["'])(.*)\1$/, '$2');
      if (!keyframes.has(kname)) { warn(`Removed @keyframes "${short(kname)}": names must be lower-case letters, digits and hyphens, starting with a letter`, node); continue; }
      const stops = [];
      for (const c of node.nodes) {
        if (c.type === 'comment') continue;
        if (c.type !== 'rule') { warn('Removed a non-stop entry inside @keyframes', c); continue; }
        const sel = squash(decodeCss(c.selector));
        const parts = sel.split(',').map((s) => s.trim());
        if (!parts.every((s) => KEYFRAME_STOP.test(s))) { warn(`Removed keyframe "${short(sel)}"`, c); continue; }
        const decls = declsOf(c, { keyframes, pseudoContent: false });
        if (decls.length) stops.push(`${parts.map((s) => s.toLowerCase()).join(',')}{${decls.join(';')}}`);
      }
      if (stops.length) out.push(`@keyframes ${keyframes.get(kname)}{${stops.join('')}}`);
      continue;
    }
    if (name === 'font-face') { warn('Removed @font-face: custom fonts are not allowed; choose fonts in the Design tab', node); continue; }
    warn(`Removed @${short(node.name)}: only @media and @keyframes are allowed`, node);
  }

  const css = out.join('\n');
  if (/<\/style|<!--/i.test(css)) return fail('Custom CSS must not contain "</style" or "<!--".');
  return { css, warnings, fatal: false };
}

// Existing name used by the routes and lib/popups.js.
export const scopePopupCss = scopeCss;
