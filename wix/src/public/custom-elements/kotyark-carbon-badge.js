/**
 * <kotyark-carbon-badge>  (Kotyark hero "Verra Carbon Credits" glass badge)
 *
 * Wix: Add Elements > Embed & Social > Custom Element > Choose source > Velo file
 *      (kotyark-carbon-badge.js), tag name: kotyark-carbon-badge.
 *
 * Attributes (all optional, plain text, never HTML):
 *   title      string  "First Indian Company"   bold uppercase first line
 *   prefix     string  "to receive"             small text before the highlight
 *   highlight  string  "Verra Carbon Credits"   amber highlighted text
 *   animate    "true"|"false"  "true"           float + pulse loops (always off
 *                                               under prefers-reduced-motion)
 *
 * Events: "ready" (CustomEvent, detail {}) once rendered.
 *
 * Sizing: the element fills the box the designer draws. Recommended 360 x 112 px
 * (the 12px inner padding leaves room for the float and pulse ring). Place it over
 * the hero at bottom right (40px from edges); hide it on the Mobile breakpoint
 * (the reference hides it below 640px).
 *
 * SEO markup to paste into the element's "SEO markup" field (client-rendered):
 *   <p>First Indian Company to receive Verra Carbon Credits</p>
 */
class KotyarkCarbonBadge extends HTMLElement {
  static get observedAttributes() { return ['title', 'prefix', 'highlight', 'animate']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
<style>
  :host { display: block; width: 100%; height: 100%; min-width: 320px; box-sizing: border-box; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .wrap { position: relative; width: 100%; height: 100%; padding: 12px; display: flex; align-items: center; justify-content: center; }
  .float { position: relative; width: 100%; max-width: 320px; animation: float 6s ease-in-out infinite; }
  .pulse { position: absolute; inset: -4px; border-radius: 24px; border: 2px solid #d97706; opacity: 0;
    animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; pointer-events: none; }
  .badge { position: relative; display: flex; align-items: center; gap: 16px; padding: 16px 24px;
    background: rgba(255, 255, 255, 0.1); -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 24px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  .icon { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #d97706, #f59e0b);
    display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3); }
  .text { display: flex; flex-direction: column; gap: 2px; text-align: left; }
  .title { font-family: "Plus Jakarta Sans", sans-serif; font-weight: 700; font-size: 14px; color: #fff;
    text-transform: uppercase; letter-spacing: 0.05em; }
  .sub { font-size: 13px; color: rgba(255, 255, 255, 0.9); line-height: 1.4; }
  .hl { color: #d97706; font-weight: 600; }
  .off .float, .off .pulse { animation: none; }
  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0; } 50% { opacity: 0.3; } }
  @media (prefers-reduced-motion: reduce) { .float, .pulse { animation: none !important; } }
</style>
<div class="wrap" part="wrap"><div class="float"><div class="pulse"></div>
  <div class="badge" part="badge">
    <div class="icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 18Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg></div>
    <div class="text"><span class="title"></span><span class="sub"><span class="pre"></span> <span class="hl"></span></span></div>
  </div></div></div>`;
    const q = (s) => this.shadowRoot.querySelector(s);
    this._els = { wrap: q('.wrap'), title: q('.title'), pre: q('.pre'), hl: q('.hl') };
  }

  connectedCallback() {
    this._render();
    this.dispatchEvent(new CustomEvent('ready', { detail: {} }));
  }

  attributeChangedCallback() { if (this.isConnected) this._render(); }

  _render() {
    const get = (n, d) => (this.hasAttribute(n) ? this.getAttribute(n) : d);
    const e = this._els;
    const title = get('title', 'First Indian Company');
    const pre = get('prefix', 'to receive');
    const hl = get('highlight', 'Verra Carbon Credits');
    e.title.textContent = title;
    e.pre.textContent = pre;
    e.hl.textContent = hl;
    e.wrap.classList.toggle('off', get('animate', 'true') === 'false');
    this.setAttribute('role', 'group');
    this.setAttribute('aria-label', [title, pre, hl].filter(Boolean).join(' '));
  }
}

if (!customElements.get('kotyark-carbon-badge')) {
  customElements.define('kotyark-carbon-badge', KotyarkCarbonBadge);
}
