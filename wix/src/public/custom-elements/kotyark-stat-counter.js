/**
 * <kotyark-stat-counter>  (Kotyark stat card: big number that counts up on scroll into view)
 *
 * Wix: Add Elements > Embed & Social > Custom Element > Choose source > Velo file
 *      (kotyark-stat-counter.js), tag name: kotyark-stat-counter. Add one per card
 *      (4 on Home, 3 on About, 2 on Crude Glycerin, 4 on Investors).
 *
 * Attributes:
 *   value        string  ""                 FINAL value, exactly as displayed: "480K", "210", "86%", "~10%", "Zero".
 *                                           The leading prefix (~ < > + $ ...), number and suffix are split
 *                                           automatically; text without a clean number ("Zero",
 *                                           "L15149RJ2023PLC091598") is shown as-is without counting.
 *   label        string  ""                 caption under the number, e.g. "KL Annual Capacity"
 *   duration     number  1600               count-up time in ms
 *   delay        number  0                  ms to wait after the card scrolls into view
 *   number-size  string  ""                 CSS font-size override, e.g. "36px" (About, Glycerin),
 *                                           "24px" (Investors). Default clamp(36px, 4vw, 56px).
 *   animate      "true"|"false"  "true"     "false" shows the final value immediately
 *   (Velo may set value/label at any time; a changed value re-runs the count if already visible.)
 *
 * Events: "countstart" and "countend" (detail: { value }); fired once per run.
 *
 * Behaviour: counts once when >= 30% of the card is visible. Under prefers-reduced-motion or with
 * no IntersectionObserver the final value shows immediately. Hover: card lifts 4px with a green glow
 * (same as the reference). Screen readers always get the final value.
 *
 * Sizing: fills the box the designer draws; recommended 260 x 150 px (desktop), 2-column grid on mobile.
 * Cards inside a Wix Studio grid/repeater layout: set the element to Fill width, Fixed height.
 *
 * SEO markup to paste into the element's "SEO markup" field, one per card (value + label):
 *   <p>480K KL Annual Capacity</p>
 */
class KotyarkStatCounter extends HTMLElement {
  static get observedAttributes() { return ['value', 'label', 'duration', 'delay', 'number-size', 'animate']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
<style>
  :host { display: block; width: 100%; height: 100%; min-height: 120px; box-sizing: border-box; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .card { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
    padding: 48px 24px; background: #ffffff; border: 1px solid #d1e5d8; border-radius: 16px;
    transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1); }
  .card:hover { transform: translateY(-4px); box-shadow: 0 0 32px rgba(46, 139, 87, 0.15); border-color: #2e8b57; }
  .num { font-family: "Plus Jakarta Sans", sans-serif; font-weight: 800; font-size: clamp(36px, 4vw, 56px);
    color: #0d3b24; line-height: 1; margin-bottom: 8px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
  .lbl { font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 15px; color: #3d5a48; font-weight: 500; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  @media (max-width: 639px) { .card { padding: 24px 16px; } }
  @media (prefers-reduced-motion: reduce) { .card { transition: none; } .card:hover { transform: none; } }
</style>
<div class="card" part="card"><div class="num" part="number" aria-hidden="true"></div><span class="sr"></span><div class="lbl" part="label"></div></div>`;
    const q = (s) => this.shadowRoot.querySelector(s);
    this._els = { num: q('.num'), sr: q('.sr'), lbl: q('.lbl') };
    this._seen = false;
    this._raf = 0;
    this._timer = 0;
  }

  connectedCallback() {
    this._render(true);
    if (this._io) this._io.disconnect();
    if (typeof IntersectionObserver === 'function') {
      this._io = new IntersectionObserver((entries) => {
        if (entries.some((en) => en.isIntersecting) && !this._seen) {
          this._seen = true;
          this._io.disconnect();
          this._start();
        }
      }, { threshold: 0.3 });
      this._io.observe(this);
    } else {
      this._seen = true;
    }
  }

  disconnectedCallback() {
    if (this._io) this._io.disconnect();
    cancelAnimationFrame(this._raf);
    clearTimeout(this._timer);
  }

  attributeChangedCallback(name) {
    if (!this.isConnected) return;
    if (name === 'value' || name === 'animate') {
      this._render(!this._seen);
      if (this._seen) this._start();
    } else {
      this._render(false);
    }
  }

  _parse(v) {
    const m = /^([^\d\s]{0,2})(\d[\d,]*(?:\.\d+)?)([^\d]{0,6})$/.exec(v.trim());
    if (!m || /[A-Za-z]{2,}\d|\d[A-Za-z]{2,}\d/.test(v)) return null;
    const decimals = (m[2].split('.')[1] || '').length;
    return { pre: m[1], n: parseFloat(m[2].replace(/,/g, '')), post: m[3], decimals, commas: m[2].includes(',') };
  }

  _fmt(p, n) {
    let s = n.toFixed(p.decimals);
    if (p.commas) s = Number(s).toLocaleString('en-US', { minimumFractionDigits: p.decimals, maximumFractionDigits: p.decimals });
    return p.pre + s + p.post;
  }

  _render(showFinalOrStart) {
    const value = this.getAttribute('value') || '';
    const e = this._els;
    e.lbl.textContent = this.getAttribute('label') || '';
    e.sr.textContent = value + (this.getAttribute('label') ? ' ' + this.getAttribute('label') : '');
    const size = this.getAttribute('number-size');
    e.num.style.fontSize = size || '';
    if (showFinalOrStart) {
      const p = this._parse(value);
      const willAnimate = p && this._canAnimate();
      // Before the card is seen show the start value (0) so there is no jump; otherwise final text.
      e.num.textContent = willAnimate ? this._fmt(p, 0) : value;
    }
  }

  _canAnimate() {
    if (this.getAttribute('animate') === 'false') return false;
    return !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  _start() {
    cancelAnimationFrame(this._raf);
    clearTimeout(this._timer);
    const value = this.getAttribute('value') || '';
    const p = this._parse(value);
    const num = this._els.num;
    if (!p || !this._canAnimate()) { num.textContent = value; return; }
    const dur = Math.max(0, parseInt(this.getAttribute('duration'), 10) || 1600);
    const delay = Math.max(0, parseInt(this.getAttribute('delay'), 10) || 0);
    num.textContent = this._fmt(p, 0);
    this._timer = setTimeout(() => {
      this.dispatchEvent(new CustomEvent('countstart', { detail: { value } }));
      const t0 = performance.now();
      const tick = (now) => {
        const k = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        num.textContent = k < 1 ? this._fmt(p, p.n * eased) : value;
        if (k < 1) this._raf = requestAnimationFrame(tick);
        else this.dispatchEvent(new CustomEvent('countend', { detail: { value } }));
      };
      this._raf = requestAnimationFrame(tick);
    }, delay);
  }
}

if (!customElements.get('kotyark-stat-counter')) {
  customElements.define('kotyark-stat-counter', KotyarkStatCounter);
}
