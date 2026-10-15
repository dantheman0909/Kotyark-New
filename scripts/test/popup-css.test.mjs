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

test('strips url(javascript:) and other disallowed urls, keeps only /media', () => {
  const r = run('.kp-a{background:url(javascript:alert(1))} .kp-b{background:url("data:image/png;base64,xx")} .kp-c{background:url(http://x/y.png)} .kp-d{background:url(/media/abc)} .kp-e{background:url("https://cdn.test/a.png")} .kp-f{background:url(/images/a.png)}');
  assert.ok(!/javascript|data:|http:\/\/|\/images\//.test(r.css));
  assert.ok(r.css.includes('url(/media/abc)'));
  assert.ok(!r.css.includes('cdn.test'));
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

test('@font-face is dropped entirely, with a warning', () => {
  const r = run('@font-face{font-family:X;src:url(/media/abc)} @font-face{font-family:Y;src:local(Arial)} .kp-body{font-family:X}');
  assert.ok(!/@font-face/.test(r.css));
  assert.ok(r.warnings.some((w) => /Custom fonts are not allowed; choose fonts in Design\./.test(w)));
  assert.ok(r.css.includes('.kp-body'));
});

test('escaped @keyframes names are decoded and prefixed, never emitted as the bare name', () => {
  const r = run('@keyframes sp\\69n{from{opacity:0}to{opacity:1}} .kp-dialog{animation:sp\\69n 1s} .kp-heading{animation-name:spin}');
  assert.ok(r.css.includes('@keyframes kp-11111111-spin'));
  assert.ok(!/@keyframes\s+spin/.test(r.css));
  assert.ok(r.css.includes('animation:kp-11111111-spin 1s'));
  assert.ok(r.css.includes('animation-name:kp-11111111-spin'));
});

test('@keyframes with an invalid decoded name is dropped', () => {
  const r = run('@keyframes a\\3b b{from{opacity:0}} @keyframes "x y"{from{opacity:0}} .kp-body{color:red}');
  assert.ok(!/@keyframes/.test(r.css));
  assert.ok(r.css.includes('color:red'));
  assert.equal(r.warnings.length, 2);
});

test('remote url() of any kind is stripped; /media stays', () => {
  const r = run('.kp-a{background:url(https://tracker/p.gif)} .kp-b{background-image:url("//tracker/p.gif")} .kp-c{background:url(/media/abc)}');
  assert.ok(!/tracker/.test(r.css));
  assert.ok(r.css.includes('url(/media/abc)'));
  assert.equal(r.warnings.length, 2);
});

test('position fixed/sticky declarations are stripped (also escaped / important)', () => {
  const r = run('.kp-a{position:fixed;color:red} .kp-b{position:sticky !important} .kp-c{position:\\66ixed} .kp-d{position:absolute} .kp-e{position:relative}');
  assert.ok(!/fixed|sticky/i.test(r.css));
  assert.ok(r.css.includes('position:absolute') && r.css.includes('position:relative') && r.css.includes('color:red'));
  assert.equal(r.warnings.length, 3);
});

test('sibling combinators directly after the root are rejected', () => {
  const r = run('body ~ div{display:none} .kp-root + p{color:red} :root+main{x:y} html.a ~ b{x:y} .kp-heading ~ .kp-body{color:red} body > .kp-body{color:blue}');
  assert.ok(!/ ~ div|\+ p|\+main|~ b/.test(r.css));
  assert.ok(r.css.includes(`${ROOT} .kp-heading ~ .kp-body`));
  assert.ok(r.css.includes(`${ROOT} .kp-body`));
  assert.equal(r.warnings.length, 4);
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
