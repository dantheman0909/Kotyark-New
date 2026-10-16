'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Port of the design's scan()/onIO()/count()/kinetic() (Kotyark Website.dc.html).
// Markup opts in with data attributes:
//   data-reveal [data-delay=ms]  fade + rise when scrolled into view
//   data-line / data-vline       horizontal / vertical rule draws in
//   data-count=N [data-pad=n]    number counts up from 0 (server HTML holds the final value)
//   data-kin=i                   kinetic headline line slides up (staggered by i)
//   data-strike                  strike-through bar draws after the headline
// Initial (hidden) states are set here, after hydration, so crawlers and no-JS visitors
// always get fully visible content. prefers-reduced-motion skips all of it.

const EASE = 'cubic-bezier(.2,.7,.1,1)';

function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function count(el) {
  const target = parseFloat(el.dataset.count);
  if (!Number.isFinite(target)) return;
  const pad = +(el.dataset.pad || 0);
  const t0 = performance.now();
  const dur = 1900;
  const fmt = (v) => { const s = Math.round(v).toLocaleString('en-IN'); return pad ? s.padStart(pad, '0') : s; };
  const step = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(2, -10 * p);
    el.textContent = fmt(target * (p === 1 ? 1 : e));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export default function Motion() {
  const pathname = usePathname();

  useEffect(() => {
    if (reducedMotion() || typeof IntersectionObserver === 'undefined') return undefined;
    const seen = new WeakSet();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        io.unobserve(el);
        if (el.hasAttribute('data-reveal')) { el.style.opacity = '1'; el.style.transform = 'none'; }
        if (el.hasAttribute('data-line') || el.hasAttribute('data-vline')) el.style.transform = 'none';
        if (el.hasAttribute('data-count')) count(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    const scan = () => {
      document.querySelectorAll('[data-reveal],[data-count],[data-line],[data-vline]').forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        const d = +(el.dataset.delay || 0);
        const r = el.getBoundingClientRect();
        const onScreen = r.top < window.innerHeight * 0.94 && r.bottom > 0;
        if (el.hasAttribute('data-reveal')) {
          el.style.opacity = '0'; el.style.transform = 'translateY(36px)';
          el.style.transition = `opacity .9s ${EASE} ${d}ms, transform 1.1s ${EASE} ${d}ms`;
        }
        if (el.hasAttribute('data-line')) { el.style.transformOrigin = 'left'; el.style.transform = 'scaleX(0)'; el.style.transition = `transform 1.4s ${EASE} ${d}ms`; }
        if (el.hasAttribute('data-vline')) { el.style.transformOrigin = 'top'; el.style.transform = 'scaleY(0)'; el.style.transition = `transform 2.4s ${EASE}`; }
        if (el.hasAttribute('data-count') && !onScreen) el.textContent = el.dataset.pad ? '0'.padStart(+el.dataset.pad, '0') : '0';
        io.observe(el);
      });
      document.querySelectorAll('[data-kin]').forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        const i = +el.dataset.kin;
        el.style.transition = 'none'; el.style.transform = 'translateY(108%)';
        void el.offsetWidth;
        el.style.transition = `transform 1.2s cubic-bezier(.2,.75,.1,1) ${120 + i * 130}ms`; el.style.transform = 'none';
      });
      document.querySelectorAll('[data-strike]').forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        el.style.transformOrigin = 'left'; el.style.transition = 'none'; el.style.transform = 'scaleX(0)';
        void el.offsetWidth;
        el.style.transition = 'transform .9s cubic-bezier(.7,0,.2,1) 1150ms'; el.style.transform = 'scaleX(1)';
      });
    };

    const t = setTimeout(scan, 30);
    // Client-rendered content (filters, chips) can add new elements later.
    const mo = new MutationObserver(() => scan());
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { clearTimeout(t); mo.disconnect(); io.disconnect(); };
  }, [pathname]);

  return null;
}
