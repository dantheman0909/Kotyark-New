// Pop-up custom CSS: parse with postcss, drop anything dangerous, and scope every rule under the
// popup's root element ([data-kp="<popupId>"]). Pure (no DB), so it runs on the server and in tests.
// Only the scoped output is ever rendered; the raw input is stored for editing.
import postcss from 'postcss';

export const MAX_POPUP_CSS_BYTES = 10 * 1024;

const ROOT_ONLY = /^(?::root|html|body)$/i;
const ROOT_PREFIX = /^(?:(?::root|html|body)(?=[\s>+~]|$)\s*(?:[>+~]\s*)?)+/i;
const DROP_AT_RULES = new Set(['import', 'charset', 'namespace']);
const RECURSE_AT_RULES = new Set(['media', 'supports', 'container', 'layer']);
const BAD_PROPS = /^(?:behavior|-moz-binding)$/i;

/** Decode CSS escapes (\6a, \j) and strip comments so obfuscated payloads are seen as written. */
function decodeCss(s) {
  return String(s)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\\([0-9a-f]{1,6})\s?/gi, (_, h) => { const n = parseInt(h, 16); return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : ''; })
    .replace(/\\(\r\n|\n|\r|\f)/g, '')
    .replace(/\\(.)/g, '$1');
}

const sameOriginMedia = (u) => /^\/media\/[A-Za-z0-9._~%\-\/]+$/.test(u) && !u.includes('..');
const sameOriginPath = (u) => /^\/(?![\/\\])[^\s"'()\\]*$/.test(u) && !u.includes('..');
const httpsUrl = (u) => /^https:\/\/[^\s"'()\\]+$/i.test(u);

/** Returns a reason string if `value` is unsafe, else ''. fontFace allows any same-origin path. */
function unsafeValue(rawValue, { fontFace = false } = {}) {
  const v = decodeCss(rawValue);
  const lower = v.toLowerCase();
  if (lower.includes('expression(')) return 'expression()';
  if (/(?:java|vb)script\s*:/.test(lower)) return 'script URL';
  if (lower.includes('-moz-binding') || /\bbehavior\s*:/.test(lower)) return 'binding/behavior';
  if (/\b(?:image-set|-webkit-image-set|src)\s*\(/.test(lower)) return 'image-set()/src() is not allowed';
  const urlRe = /url\(\s*(['"]?)([\s\S]*?)\1\s*\)/gi;
  let m;
  while ((m = urlRe.exec(v))) {
    const u = m[2].trim();
    const ok = httpsUrl(u) || sameOriginMedia(u) || (fontFace && sameOriginPath(u));
    if (!ok) return `url(${u.slice(0, 40)}) (only /media/... or https: URLs are allowed)`;
  }
  // A bare `url(` we could not parse, or a string-only url token, is rejected too.
  if (/url\(/i.test(v) && !/url\(\s*(['"]?)[\s\S]*?\1\s*\)/i.test(v)) return 'malformed url()';
  return '';
}

function scopeSelector(sel, root) {
  let s = sel.trim();
  if (!s) return null;
  if (ROOT_ONLY.test(s)) return root;
  if (ROOT_PREFIX.test(s)) {
    const rest = s.replace(ROOT_PREFIX, '').trim();
    return rest ? `${root} ${rest}` : root;
  }
  // `.kp-root` IS the root element: `.kp-root.kp-mobile`, `.kp-root:hover`
  if (/^\.kp-root(?![\w-])/.test(s)) return root + s.slice('.kp-root'.length);
  return `${root} ${s}`;
}

/**
 * @param {string} rawCss author input
 * @param {string} popupId uuid; becomes the [data-kp] value
 * @returns {{ css: string, warnings: string[], fatal: boolean }}
 *   fatal = nothing usable (too big, contains </style, or does not parse): css is '' and the API answers 400.
 */
export function scopePopupCss(rawCss, popupId) {
  const warnings = [];
  const raw = String(rawCss ?? '');
  if (!raw.trim()) return { css: '', warnings, fatal: false };
  const fail = (msg) => ({ css: '', warnings: [...warnings, msg], fatal: true });

  if (Buffer.byteLength(raw, 'utf8') > MAX_POPUP_CSS_BYTES) return fail(`Custom CSS is larger than ${MAX_POPUP_CSS_BYTES / 1024} KB.`);
  if (/<\/style/i.test(raw) || /<\/style/i.test(decodeCss(raw))) return fail('Custom CSS must not contain "</style".');
  const id = String(popupId || '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return fail('Invalid pop-up id.');

  const root = `[data-kp="${id}"]`;
  const kfPrefix = `kp-${id.slice(0, 8)}-`;
  let doc;
  try { doc = postcss.parse(raw); }
  catch (e) { return fail(`CSS syntax error: ${e.reason || e.message}${e.line ? ` (line ${e.line})` : ''}`); }

  const keyframeNames = new Map();
  doc.walkAtRules(/^(?:-\w+-)?keyframes$/i, (r) => {
    const name = r.params.trim().replace(/^["']|["']$/g, '');
    if (/^[\w-]+$/.test(name)) keyframeNames.set(name, kfPrefix + name);
  });

  const line = (n) => (n.source?.start?.line ? ` (line ${n.source.start.line})` : '');

  const cleanDecls = (container, opts = {}) => {
    container.walkDecls((d) => {
      if (BAD_PROPS.test(d.prop)) { warnings.push(`Removed "${d.prop}"${line(d)}.`); d.remove(); return; }
      const bad = unsafeValue(d.value, opts) || unsafeValue(d.raws?.value?.raw ?? d.value, opts) || unsafeValue(d.prop, opts);
      if (bad) { warnings.push(`Removed "${d.prop}": ${bad}${line(d)}.`); d.remove(); return; }
      if (/^(?:-\w+-)?animation(?:-name)?$/i.test(d.prop) && keyframeNames.size) {
        d.value = d.value.replace(/[\w-]+/g, (w) => keyframeNames.get(w) || w);
      }
    });
  };

  const process = (container, inKeyframes = false) => {
    for (const node of [...container.nodes]) {
      if (node.type === 'comment') { node.remove(); continue; }
      if (node.type === 'decl') continue; // declarations at the top level are invalid CSS and dropped below
      if (node.type === 'atrule') {
        const name = node.name.toLowerCase().replace(/^-\w+-/, '');
        if (DROP_AT_RULES.has(name)) { warnings.push(`Removed @${node.name}${line(node)}.`); node.remove(); continue; }
        if (name === 'font-face') {
          let bad = '';
          node.walkDecls((d) => {
            if (bad) return;
            bad = unsafeValue(d.value, { fontFace: true }) || unsafeValue(d.raws?.value?.raw ?? d.value, { fontFace: true });
            if (!bad && /^src$/i.test(d.prop) && /url\(/i.test(d.value) === false && !/local\(/i.test(d.value)) bad = 'src must be a url() or local()';
          });
          if (bad) { warnings.push(`Removed @font-face: ${bad}${line(node)}.`); node.remove(); }
          continue;
        }
        if (/^keyframes$/.test(name)) {
          const n = node.params.trim().replace(/^["']|["']$/g, '');
          if (keyframeNames.has(n)) node.params = keyframeNames.get(n);
          cleanDecls(node);
          continue; // inner selectors (from/to/%) must not be scoped
        }
        if (RECURSE_AT_RULES.has(name) && node.nodes) {
          const bad = name === 'media' || name === 'container' || name === 'layer' ? '' : unsafeValue(node.params);
          if (bad) { warnings.push(`Removed @${node.name}: ${bad}${line(node)}.`); node.remove(); continue; }
          process(node);
          continue;
        }
        warnings.push(`Removed unsupported @${node.name}${line(node)}.`);
        node.remove();
        continue;
      }
      if (node.type === 'rule') {
        const out = node.selectors.map((s) => scopeSelector(s, root)).filter(Boolean);
        if (!out.length) { node.remove(); continue; }
        node.selectors = out;
        cleanDecls(node);
        // nested rules (CSS nesting) are not supported: drop them rather than leave them unscoped
        node.each((child) => { if (child.type === 'rule' || child.type === 'atrule') { warnings.push(`Removed nested rule${line(child)}; write each rule at the top level.`); child.remove(); } });
        if (!node.nodes.length) node.remove();
        continue;
      }
    }
  };

  // Drop stray top-level declarations (invalid), then process rules.
  doc.each((n) => { if (n.type === 'decl') { warnings.push(`Removed top-level declaration "${n.prop}"${line(n)}; wrap it in a selector.`); n.remove(); } });
  process(doc);

  let css = doc.toString().trim();
  if (/<\/style/i.test(css) || /<!--/.test(css)) return fail('Custom CSS must not contain "</style".');
  if (Buffer.byteLength(css, 'utf8') > MAX_POPUP_CSS_BYTES * 2) return fail('Scoped CSS is too large.');
  return { css, warnings, fatal: false };
}
