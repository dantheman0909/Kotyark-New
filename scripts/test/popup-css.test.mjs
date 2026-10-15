import test from 'node:test';
import assert from 'node:assert/strict';
import { scopePopupCss, MAX_POPUP_CSS_BYTES } from '../../src/lib/popup-css.js';

const ID = '11111111-2222-3333-4444-555555555555';
const ROOT = `[data-kp="${ID}"]`;
const run = (css) => scopePopupCss(css, ID);

test('scopes every rule and every selector in a list', () => {
  const { css, fatal } = run('.kp-heading, .kp-body a { color: red } .kp-cta:hover { opacity: .8 }');
  assert.equal(fatal, false);
  assert.match(css, new RegExp(`\\${ROOT.slice(0, 1)}data-kp="${ID}"\\] \\.kp-heading`));
  assert.ok(css.includes(`${ROOT} .kp-body a`));
  assert.ok(css.includes(`${ROOT} .kp-cta:hover`));
  for (const sel of css.match(/[^{}]+(?=\{)/g)) for (const s of sel.split(',')) assert.ok(s.trim().startsWith(ROOT), s);
});

test('scopes rules inside @media and prefixes keyframes', () => {
  const { css } = run('@media (max-width:600px){.kp-heading{font-size:1rem}} @keyframes pop{from{opacity:0}to{opacity:1}} .kp-dialog{animation:pop 1s}');
  assert.ok(css.includes(`${ROOT} .kp-heading`));
  assert.ok(css.includes('@keyframes kp-11111111-pop'));
  assert.ok(css.includes('animation:kp-11111111-pop 1s'));
  assert.ok(!/(^|[{}\s])from\s*\{/.test(css) || css.includes('from{') || css.includes('from {'));
});

test('strips @import, @charset and @namespace with a warning', () => {
  const r = run('@charset "utf-8"; @import url(https://evil.test/x.css); @namespace svg url(http://x); .kp-body{color:red}');
  assert.ok(!/@import|@charset|@namespace/.test(r.css));
  assert.ok(r.css.includes('color:red'));
  assert.equal(r.warnings.length, 3);
});

test('strips url(javascript:) and other disallowed urls, keeps /media and https', () => {
  const r = run('.kp-a{background:url(javascript:alert(1))} .kp-b{background:url("data:image/png;base64,xx")} .kp-c{background:url(http://x/y.png)} .kp-d{background:url(/media/abc)} .kp-e{background:url("https://cdn.test/a.png")} .kp-f{background:url(/images/a.png)}');
  assert.ok(!/javascript|data:|http:\/\/|\/images\//.test(r.css));
  assert.ok(r.css.includes('url(/media/abc)'));
  assert.ok(r.css.includes('https://cdn.test/a.png'));
  assert.ok(r.warnings.length >= 4);
});

test('catches CSS-escaped javascript:, expression(), behavior, -moz-binding', () => {
  const r = run('.a{background:url(\\6a avascript:alert(1))} .b{width:expression(alert(1))} .c{behavior:url(x.htc)} .d{-moz-binding:url(x)} .e{color:red}');
  assert.ok(!/avascript|expression|behavior|binding/i.test(r.css));
  assert.ok(r.css.includes('color:red'));
});

test('rejects </style outright', () => {
  for (const css of ['.a{color:red}</style><script>alert(1)</script>', '.a{content:"</STYLE"}']) {
    const r = run(css);
    assert.equal(r.fatal, true);
    assert.equal(r.css, '');
  }
});

test('maps :root, html and body to the popup root', () => {
  const { css } = run(':root{--x:1} html{color:red} body{margin:0} body .kp-heading{color:blue} html > body{top:0} .kp-root.kp-mobile{gap:2px}');
  assert.ok(css.includes(`${ROOT}{--x:1}`));
  assert.ok(css.includes(`${ROOT}{color:red}`));
  assert.ok(css.includes(`${ROOT}{margin:0}`));
  assert.ok(css.includes(`${ROOT} .kp-heading{color:blue}`));
  assert.ok(css.includes(`${ROOT}.kp-mobile{gap:2px}`));
  assert.ok(!/\sbody|\shtml/.test(css.replace(/\[data-kp[^\]]*\]/g, '')));
});

test('@font-face: https and same-origin allowed, others dropped', () => {
  const ok = run('@font-face{font-family:X;src:url(https://fonts.test/x.woff2)} @font-face{font-family:Y;src:url(/media/abc)}');
  assert.equal((ok.css.match(/@font-face/g) || []).length, 2);
  const bad = run('@font-face{font-family:Z;src:url(http://evil/x.woff2)} @font-face{font-family:W;src:url(data:font/woff2;base64,AA)}');
  assert.ok(!/@font-face/.test(bad.css));
});

test('size limit', () => {
  const big = `.a{color:red}${' '.repeat(MAX_POPUP_CSS_BYTES)}`;
  const r = run(big);
  assert.equal(r.fatal, true);
  assert.equal(run('.a{color:red}').fatal, false);
});

test('syntax errors are fatal; empty input is fine; nested rules and unknown at-rules dropped', () => {
  assert.equal(run('.a{color:red').fatal, true);
  assert.deepEqual(run('   '), { css: '', warnings: [], fatal: false });
  const r = run('@page{margin:0} .a{color:red; .b{color:blue}}');
  assert.ok(!/@page/.test(r.css) && !/\.b/.test(r.css));
});
