import test from 'node:test';
import assert from 'node:assert/strict';
import postcss from 'postcss';
import {
  scopePopupCss, scopeCss, MAX_POPUP_CSS_BYTES, POPUP_CSS_CLASSES, POPUP_CSS_ALLOWED_PROPERTIES, POPUP_CSS_FORBIDDEN_PROPERTIES, POPUP_CSS_FONT_FAMILIES,
} from '../../src/lib/popup-css.js';
import { blockingPublishMessage } from '../../src/lib/popup-config.js';

const ID = '11111111-2222-3333-4444-555555555555';
const MEDIA_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const ROOT = `[data-kp="${ID}"]`;
const run = (css) => scopePopupCss(css, ID);

test('scopeCss and scopePopupCss are the same function', () => assert.equal(scopeCss, scopePopupCss));

// ---- every reviewer probe is rejected outright (nothing emitted, a warning given) ----
const REJECTED = {
  'escaped property name (pos\\ition)': '.kp-dialog{pos\\ition:fixed}',
  'escaped property name (p\\6fsition)': '.kp-dialog{p\\6fsition:fixed}',
  'out-specifying the root rules': '.kp-root.kp-root.kp-root.kp-root:not(.kp-preview){position:absolute!important}',
  'covering the page with the dialog': '.kp-dialog{position:absolute;top:-100vh;left:-100vw;width:300vw;height:300vh}',
  'leading ~ combinator': '~ main{display:none}',
  'leading + combinator': '+ *{color:red}',
  ':not() with a list then sibling': '.kp-root:not(.a, .b) ~ main{}',
  ':is() then sibling': '.kp-root:is(.kp-root, .z) ~ *{}',
  'attribute selector then sibling': '.kp-root[data-x="a b"] ~ *{}',
  'encoded ../ in a media url': '.kp-heading{background:url(/media/%2e%2e/api/popups/x)}',
  'body selector': 'body{outline:1px solid red}',
  '@import': '@import url(/x.css); @import "y.css";',
  '@font-face': '@font-face{font-family:X;src:url(/media/' + MEDIA_ID + ')}',
  'remote url': '.kp-heading{background:url(https://evil.test/x.png)}',
  'custom property with remote url': '.kp-dialog{--x:url(https://e)}',
  'custom property at top level': '--x:url(https://e)',
  'negative margin': '.kp-dialog{margin:-500px}',
  'transform': '.kp-dialog{transform:scale(10)}',
  'content with url()': '.kp-heading{content:url(x)}',
  'root class': '.kp-root{color:red}',
  'html / :root': 'html{color:red} :root{color:red}',
  'universal selector': '*{color:red}',
  'id selector': '#x{color:red}',
  'attribute selector': '.kp-cta[href]{color:red}',
  'sibling combinators between allowed compounds': '.kp-heading ~ .kp-body{color:red} .kp-heading + .kp-body{color:red}',
  'element outside .kp-body': 'a{color:red} .kp-heading a{color:red}',
  'escaped selector hiding body': 'b\\6fdy{color:red}',
  ':where / :has': '.kp-dialog:where(.a){color:red} .kp-dialog:has(a){color:red}',
  'position': '.kp-dialog{position:relative}',
  'width / height': '.kp-dialog{width:300vw} .kp-dialog{height:100vh}',
  'z-index / inset': '.kp-dialog{z-index:99999} .kp-dialog{inset:0}',
  'display:none': '.kp-close{display:none}',
  'pointer-events': '.kp-dialog{pointer-events:none}',
  'margin above the cap': '.kp-dialog{margin:65px} .kp-dialog{margin:5rem} .kp-dialog{margin:0 0 0 -1px} .kp-dialog{margin:calc(1px)}',
  'max-width above 100%': '.kp-dialog{max-width:101%} .kp-dialog{max-width:500px}',
  'font outside the site stacks': '.kp-heading{font-family:Comic Sans MS}',
  'content on a non-pseudo element': '.kp-heading{content:"x"}',
  'content with attr()': '.kp-heading::before{content:attr(title)}',
  'vendor property': '.kp-dialog{-moz-binding:url(x)} .kp-dialog{-webkit-text-fill-color:red} .kp-dialog{-webkit-mask:red}',
  'expression()': '.kp-dialog{color:expression(alert(1))}',
  'javascript url': '.kp-dialog{background:url(javascript:alert(1))}',
  'url with a trailing path': '.kp-dialog{background:url(/media/' + MEDIA_ID + '/x)} .kp-dialog{background:url(/media/' + MEDIA_ID.replace('a', '%') + ')}',
  'url on a property other than background': '.kp-dialog{border-image:url(/media/' + MEDIA_ID + ')} .kp-dialog{cursor:url(/media/' + MEDIA_ID + '),auto}',
  'filter url': '.kp-dialog{filter:url(#x)} .kp-dialog{backdrop-filter:url(/x)}',
  'filter with a non-filter function': '.kp-dialog{filter:invert(1)}',
  'animation naming something undefined': '.kp-dialog{animation:spin 1s}',
  'keyframes with a bad name': '@keyframes Pop{from{opacity:0}} @keyframes "a b"{from{opacity:0}}',
  '@media with other conditions': '@media (min-height:1px){.kp-heading{color:red}} @media print{.kp-heading{color:red}} @media (max-width:600px) and (pointer:fine){.kp-heading{color:red}}',
  '@supports / @container / @layer / @page': '@supports (display:grid){.kp-heading{color:red}} @container (min-width:1px){.kp-heading{color:red}} @layer a{.kp-heading{color:red}} @page{margin:0}',
  'nested @media': '@media (max-width:600px){@media (max-width:300px){.kp-heading{color:red}}}',
  'keyframes inside @media': '@media (max-width:600px){@keyframes a{from{opacity:0}}}',
  'empty selector in a list': '.kp-heading,,.kp-body{color:red}',
};
for (const [name, css] of Object.entries(REJECTED)) {
  test(`rejects: ${name}`, () => {
    const r = run(css);
    // The accepted pieces of the probe (none) must not appear; what matters is that nothing dangerous is emitted.
    assert.equal(r.fatal, false);
    assert.equal(r.css, '', `emitted: ${r.css}`);
    assert.ok(r.warnings.length > 0, 'a warning is expected');
  });
}

test('CSS nesting is dropped with a warning; the outer declarations stay', () => {
  const r = run('.kp-dialog{color:red; .kp-heading{color:blue}}');
  assert.equal(r.css, `${ROOT} .kp-dialog{color:red}`);
  assert.equal(r.warnings.length, 1);
});

test('a rejected rule does not take down its accepted neighbours', () => {
  const r = run('body{color:red} .kp-heading{color:#fff} .kp-heading{position:fixed;color:blue}');
  assert.equal(r.css, `${ROOT} .kp-heading{color:#fff}\n${ROOT} .kp-heading{color:blue}`);
  assert.equal(r.warnings.length, 2);
});

// ---- accepted cases and their exact scoped output ----
test('accepts letter-spacing and colour', () => {
  assert.equal(run('.kp-heading{letter-spacing:2px;color:#0b5d3b}').css, `${ROOT} .kp-heading{letter-spacing:2px;color:#0b5d3b}`);
});
test('accepts a gradient on :hover', () => {
  const r = run('.kp-cta:hover{background:linear-gradient(90deg,#0b5d3b,#22c55e)}');
  assert.equal(r.css, `${ROOT} .kp-cta:hover{background:linear-gradient(90deg,#0b5d3b,#22c55e)}`);
  assert.deepEqual(r.warnings, []);
});
test('accepts descendant elements inside .kp-body', () => {
  assert.equal(run('.kp-body a:hover{text-decoration:underline}').css, `${ROOT} .kp-body a:hover{text-decoration:underline}`);
  assert.equal(run('.kp-body > ul li:first-child{margin:0 0 4px}').css, `${ROOT} .kp-body > ul li:first-child{margin:0 0 4px}`);
  assert.equal(run('.kp-dialog .kp-content > .kp-heading{color:red}').css, `${ROOT} .kp-dialog .kp-content > .kp-heading{color:red}`);
});
test('scopes every selector in a list, each as a descendant of the root', () => {
  const r = run('.kp-heading, .kp-eyebrow:hover, .kp-cta::before{color:red}');
  assert.equal(r.css, `${ROOT} .kp-heading,${ROOT} .kp-eyebrow:hover,${ROOT} .kp-cta::before{color:red}`);
});
test('escaped selectors are decoded then rebuilt canonically', () => {
  assert.equal(run('.kp-he\\61 ding{color:red}').css, `${ROOT} .kp-heading{color:red}`);
});
test('accepts @media with allowed conditions', () => {
  assert.equal(run('@media (max-width:600px){.kp-heading{font-size:20px}}').css, `@media (max-width:600px){${ROOT} .kp-heading{font-size:20px}}`);
  const r = run('@media (prefers-reduced-motion: reduce) and (hover:none){.kp-cta{transition:none}} @media (orientation:landscape),(prefers-color-scheme:dark){.kp-body{opacity:.9}}');
  assert.equal(r.warnings.length, 0);
  assert.ok(r.css.includes('@media (prefers-reduced-motion:reduce) and (hover:none){'));
  assert.ok(r.css.includes('@media (orientation:landscape),(prefers-color-scheme:dark){'));
});
test('keyframes and the animation that uses them are both rewritten to the prefixed name', () => {
  const r = run('@keyframes pop{from{opacity:0}to{opacity:1}} .kp-dialog{animation:pop .3s}');
  assert.equal(r.css, `@keyframes kp-11111111-pop{from{opacity:0}to{opacity:1}}\n${ROOT} .kp-dialog{animation:kp-11111111-pop .3s}`);
  assert.equal(run('@keyframes a\\62 c{from{opacity:0}} .kp-dialog{animation-name:abc;animation-duration:1s;animation-timing-function:cubic-bezier(.1,.7,1,.1)}').css.includes('animation-name:kp-11111111-abc'), true);
});
test('accepts a /media/<uuid> background in every quoting', () => {
  for (const u of [`url(/media/${MEDIA_ID})`, `url("/media/${MEDIA_ID}")`, `url('/media/${MEDIA_ID}')`]) {
    assert.equal(run(`.kp-image{background-image:${u}}`).css, `${ROOT} .kp-image{background-image:${u}}`);
  }
});
test('accepts ::before content as a plain string, strips !important, lower-cases property names', () => {
  assert.equal(run('.kp-heading::before{content:"* ";COLOR:red !important}').css, `${ROOT} .kp-heading::before{content:"* ";color:red}`);
});
test('accepts margins within the cap and the site font stacks', () => {
  assert.equal(run('.kp-body{margin:0 auto 4rem;font-family:"Plus Jakarta Sans", Inter, sans-serif;max-width:100%}').css,
    `${ROOT} .kp-body{margin:0 auto 4rem;font-family:"Plus Jakarta Sans", Inter, sans-serif;max-width:100%}`);
  assert.deepEqual(POPUP_CSS_FONT_FAMILIES.sort(), ['inter', 'plus jakarta sans', 'sans-serif', 'serif', 'system-ui']);
});
test('accepts filters with allowed functions', () => {
  assert.equal(run('.kp-image{filter:blur(2px) brightness(.9);backdrop-filter:saturate(1.2)}').css, `${ROOT} .kp-image{filter:blur(2px) brightness(.9);backdrop-filter:saturate(1.2)}`);
});

// ---- fatal and size cases ----
test('</style and <!-- are fatal, also escaped', () => {
  for (const css of ['.a{color:red}</style><script>alert(1)</script>', '.kp-body{content:"</STYLE"}', '<!-- .kp-body{color:red}', '.kp-body{color:red}</st\\79 le>']) {
    const r = run(css);
    assert.equal(r.fatal, true, css);
    assert.equal(r.css, '');
  }
});
test('size limit, syntax errors, empty input', () => {
  assert.equal(run(`.kp-body{color:red}${' '.repeat(MAX_POPUP_CSS_BYTES)}`).fatal, true);
  assert.equal(run('.kp-body{color:red}').fatal, false);
  assert.equal(run('.kp-body{color:red').fatal, true);
  assert.deepEqual(run('   '), { css: '', warnings: [], fatal: false });
  assert.equal(scopePopupCss('.kp-body{color:red}', 'not-a-uuid').fatal, true);
});

// ---- layout guard and fuzz ----
test('blockingPublishMessage still guards mobile full-screen interstitials', () => {
  assert.ok(blockingPublishMessage({ layout: 'fullscreen' }, { devices: 'all', trigger: 'load' }));
  assert.ok(blockingPublishMessage({ layout: 'fullscreen' }, { devices: 'mobile', trigger: 'delay', delaySeconds: 2 }));
  assert.equal(blockingPublishMessage({ layout: 'fullscreen' }, { devices: 'desktop', trigger: 'load' }), '');
  assert.equal(blockingPublishMessage({ layout: 'fullscreen' }, { devices: 'all', trigger: 'delay', delaySeconds: 3 }), '');
  assert.ok(blockingPublishMessage({ layout: 'modal' }, { devices: 'all', trigger: 'load' })); // modal is a mobile interstitial too
  assert.equal(blockingPublishMessage({ layout: 'slide-in' }, { devices: 'all', trigger: 'load' }), '');
});

function rng(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 2 ** 32; }; }

test('fuzz: no accepted CSS can set root/dialog position or size (2,000 random combinations)', () => {
  const rand = rng(20260915);
  const pick = (a) => a[Math.floor(rand() * a.length)];
  const escape = (s) => [...s].map((ch) => (/[a-z]/i.test(ch) && rand() < 0.35 ? (rand() < 0.5 ? `\\${ch}` : `\\${ch.charCodeAt(0).toString(16)} `) : ch)).join('');
  const SELECTORS = [
    ...POPUP_CSS_CLASSES, '.kp-dialog:hover', '.kp-cta::before', '.kp-body a', '.kp-body > p', '.kp-dialog .kp-body li:last-child',
    '.kp-root', '.kp-root.kp-root.kp-root', '.kp-root:not(.kp-preview)', '.kp-root:is(.a,.b) ~ *', 'body', 'html', ':root', '*', '#x', '~ main', '+ *', '> .kp-dialog',
    '.kp-heading ~ .kp-body', '.kp-heading + .kp-body', '.kp-cta[href]', 'main', '.kp-body:has(a)', 'a', '.kp-dialog:not(.x)', '.kp-layout-modal', '.kp-mobile .kp-dialog', '[data-kp]',
  ];
  const FORBIDDEN = [...POPUP_CSS_FORBIDDEN_PROPERTIES, '--x', '-moz-binding', '-webkit-mask', 'behavior', 'content'];
  const ALLOWED = [...POPUP_CSS_ALLOWED_PROPERTIES];
  const VALUES = [
    'fixed', 'absolute', '0', '-100vh', '300vw', '100%', '10px', 'red', '#0b5d3b', 'none', 'scale(10)', 'url(https://e/x)', `url(/media/${MEDIA_ID})`, 'url(/media/%2e%2e/x)',
    '-500px', '64px', '65px', '4rem', 'auto', 'linear-gradient(red,blue)', 'inherit', '"x"', 'calc(100vw*3)', 'pop 1s', '1s ease', 'blur(3px)', 'attr(x)', 'expression(1)', 'Inter', 'Comic Sans MS',
  ];
  const BAD_PROPS = new Set(FORBIDDEN);
  const forbiddenIn = (prop) => BAD_PROPS.has(prop) && !(prop === 'content');
  let accepted = 0;
  for (let i = 0; i < 2000; i += 1) {
    const rules = [];
    const nRules = 1 + Math.floor(rand() * 3);
    for (let r = 0; r < nRules; r += 1) {
      const sels = Array.from({ length: 1 + Math.floor(rand() * 2) }, () => (rand() < 0.4 ? escape(pick(SELECTORS)) : pick(SELECTORS))).join(',');
      const decls = Array.from({ length: 1 + Math.floor(rand() * 4) }, () => {
        const prop = rand() < 0.5 ? pick(FORBIDDEN) : pick(ALLOWED);
        return `${rand() < 0.4 ? escape(prop) : prop}:${pick(VALUES)}${rand() < 0.2 ? '!important' : ''}`;
      }).join(';');
      rules.push(`${sels}{${decls}}`);
    }
    let css = rules.join('\n');
    if (rand() < 0.3) css = `@keyframes pop{from{opacity:0}to{opacity:1}}\n${css}`;
    if (rand() < 0.3) css = `@media (max-width:600px){${css}}`;
    const r = run(css);
    if (r.fatal || !r.css) continue;
    accepted += 1;
    const out = postcss.parse(r.css);
    out.walkRules((rule) => {
      if (rule.parent.type === 'atrule' && /keyframes$/.test(rule.parent.name)) return;
      for (const sel of rule.selectors) {
        assert.ok(sel.startsWith(`${ROOT} `), `unscoped selector ${sel} from ${css}`);
        const tail = sel.slice(ROOT.length + 1);
        for (const seg of tail.split(/ > | /)) {
          const m = /^(\.[a-z-]+|a|p|strong|em|ul|ol|li|h[234])((?::[a-z-]+)*)(::[a-z]+)?$/.exec(seg);
          assert.ok(m, `bad compound ${seg} in ${sel} from ${css}`);
          assert.ok(!m[1].startsWith('.') || POPUP_CSS_CLASSES.includes(m[1]), `bad class ${m[1]} from ${css}`);
        }
      }
    });
    out.walkAtRules((a) => assert.ok(/^(?:media|keyframes)$/.test(a.name), a.name));
    out.walkDecls((d) => {
      const rule = d.parent;
      const isPseudoContent = d.prop === 'content' && rule.selectors?.every((s) => /::(?:before|after)$/.test(s));
      assert.ok(isPseudoContent || POPUP_CSS_ALLOWED_PROPERTIES.has(d.prop), `property ${d.prop} from ${css}`);
      assert.ok(!forbiddenIn(d.prop), `forbidden ${d.prop} from ${css}`);
      assert.ok(!/!|@|\\|url\((?!\/media\/[0-9a-f-]{36}\))|expression|attr\(/.test(d.value), `value ${d.value} from ${css}`);
      if (/^margin/.test(d.prop)) for (const t of d.value.split(' ')) assert.ok(/^(?:0|auto|\d+(?:\.\d+)?(?:px|rem|em))$/.test(t) && !(parseFloat(t) > 64), `margin ${d.value}`);
    });
  }
  assert.ok(accepted > 100, `fuzz produced too few accepted stylesheets (${accepted}) to be meaningful`);
});

// Third review: size-growing values, hidden close button, '-' prefixed names.
test('round 3: viewport/percent units and oversized lengths are refused on box-growing properties', () => {
  const ID = '12345678-1234-1234-1234-123456789abc';
  for (const bad of [
    '.kp-content{padding-top:100vh}', '.kp-content{font-size:100vh}', '.kp-content{gap:100vh}',
    '.kp-dialog{border-width:50vh}', '.kp-heading{line-height:100}', '.kp-heading{letter-spacing:100vw}',
    '.kp-content{padding:65px}', '.kp-heading{font-size:calc(1px + 100vh)}', '.kp-heading{font-size:max(1px,90vh)}',
    '@keyframes grow{to{padding-top:100vh}} .kp-content{animation:grow 1s}', '.kp-content{padding:10cm}',
  ]) {
    const r = scopeCss(bad, ID);
    assert.ok(!/vh|vw|cm|calc|max\(|padding-top:100|font-size:100|gap:100|line-height:100|padding:65/.test(r.css), `${bad} -> ${r.css}`);
    assert.ok(r.warnings.length > 0, `${bad} should warn`);
  }
  const ok = scopeCss('.kp-content{padding:24px 32px} .kp-heading{font-size:2rem;line-height:1.2;letter-spacing:1px}', ID);
  assert.match(ok.css, /padding:24px 32px/); assert.match(ok.css, /font-size:2rem/); assert.match(ok.css, /line-height:1\.2/);
});
test('round 3: names starting with "-" are checked like any other', () => {
  const ID = '12345678-1234-1234-1234-123456789abc';
  for (const bad of ['.kp-dialog{animation:1s -kp-fade}', '.kp-dialog{animation:1s --x}', '.kp-heading{color:--calc(1px)}']) {
    const r = scopeCss(bad, ID);
    assert.equal(r.css.trim(), '', `${bad} -> ${r.css}`);
  }
});

test('round 4: close button cannot be targeted; hex colours in shorthands still work', () => {
  const ID = '12345678-1234-1234-1234-123456789abc';
  for (const bad of ['.kp-close{font-size:0}', '.kp-close{filter:blur(40px)}', '.kp-close{margin-top:64px}', '.kp-close:hover{opacity:.1}']) {
    assert.equal(scopeCss(bad, ID).css.trim(), '', bad);
  }
  assert.match(scopeCss('.kp-content{border:1px solid #e5e7eb}', ID).css, /border:1px solid #e5e7eb/);
  assert.match(scopeCss('.kp-dialog{border-top:2px solid #123456;outline:1px dashed #0b5d3b}', ID).css, /border-top:2px solid #123456/);
});
