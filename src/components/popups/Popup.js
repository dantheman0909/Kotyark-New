'use client';
import { useEffect, useRef } from 'react';
import './popup.css';
import { FONT_STACKS, isModalLayout, resolveColors, widthPx } from '@/lib/popup-config';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The one pop-up renderer, shared by the public PopupHost and the admin live preview.
 *
 * popup     { id, content:{eyebrow,heading,bodyHtml,imageSrc,imageAlt,imagePosition,primaryCta,secondaryCta,dismissLabel},
 *             design:{...}, css }   css is the SERVER-SCOPED stylesheet; bodyHtml is server-sanitized.
 * viewport  'desktop' | 'mobile'  (explicit, so the admin preview can show mobile on a wide screen)
 * preview   true inside the editor: positioned within its frame, no focus trap, no Esc, no scroll lock
 * onClose   (reason: 'dismiss') => void
 * onCta     ('primary' | 'secondary') => void
 */
export default function Popup({ popup, viewport = 'desktop', preview = false, onClose, onCta }) {
  const { id, content: c, design: d } = popup;
  const dialogRef = useRef(null);
  const handlers = useRef({ onClose });
  handlers.current = { onClose };
  const modal = isModalLayout(d.layout);

  useEffect(() => {
    if (preview) return undefined;
    const dialog = dialogRef.current;
    const prev = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    const main = modal ? document.getElementById('main-content') : null;
    const wasInert = main?.hasAttribute('inert');
    if (modal) {
      document.body.style.overflow = 'hidden';
      (dialog.querySelector('[data-kp-autofocus]') || dialog).focus({ preventScroll: true });
      main?.setAttribute('inert', '');
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (!modal && !dialog.contains(document.activeElement)) return; // a non-modal pop-up must not swallow Esc meant for the page
        e.preventDefault(); handlers.current.onClose?.('dismiss'); return;
      }
      if (e.key !== 'Tab' || !modal) return;
      const items = [...dialog.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!items.length) { e.preventDefault(); dialog.focus(); return; }
      const first = items[0], last = items[items.length - 1], active = document.activeElement;
      if (e.shiftKey && (active === first || active === dialog || !dialog.contains(active))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (active === last || !dialog.contains(active))) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
      if (main && !wasInert) main.removeAttribute('inert');
      if (prev && prev !== document.body && (modal || document.activeElement === document.body)) prev.focus?.({ preventScroll: true });
    };
  }, [preview, modal]);

  const colors = resolveColors(d);
  const style = {
    '--kp-bg': colors.background, '--kp-text': colors.text, '--kp-accent': colors.accent, '--kp-on-accent': colors.onAccent,
    '--kp-radius': `${d.radius}px`, '--kp-w': `${widthPx(d)}px`,
    '--kp-overlay': `rgba(7, 26, 16, ${(d.overlayOpacity ?? 55) / 100})`,
    '--kp-font-heading': FONT_STACKS.heading[d.fontHeading] || FONT_STACKS.heading.brand,
    '--kp-font-body': FONT_STACKS.body[d.fontBody] || FONT_STACKS.body.brand,
  };
  const img = c.imageSrc || null;
  const cls = [
    'kp-root', `kp-layout-${d.layout}`, `kp-pos-${d.position}`, `kp-width-${d.width}`, `kp-anim-${d.animation}`,
    `kp-btn-${d.buttonStyle}`, img ? `kp-img-${c.imagePosition}` : 'kp-img-none',
    viewport === 'mobile' ? 'kp-mobile' : '', preview ? 'kp-preview' : '',
  ].filter(Boolean).join(' ');
  const headingId = `kp-h-${id}`;
  const hasText = !!(c.eyebrow || c.heading || c.bodyHtml);

  const primary = c.primaryCta?.label && c.primaryCta?.href ? c.primaryCta : null;
  const secondary = c.secondaryCta?.label && c.secondaryCta?.href ? c.secondaryCta : null;
  const link = (cta, kind, extra) => {
    const external = /^https:/i.test(cta.href);
    return (
      <a key={kind} className={`kp-cta ${extra}`} href={cta.href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        onClick={preview ? (e) => e.preventDefault() : () => onCta?.(kind)}>{cta.label}</a>
    );
  };

  return (
    <div className={cls} data-kp={id} style={style}
      onMouseDown={modal && d.layout === 'modal' && !preview ? (e) => { if (e.target === e.currentTarget) onClose?.('dismiss'); } : undefined}>
      {popup.css ? <style>{popup.css}</style> : null}
      <div ref={dialogRef} className="kp-dialog" role="dialog" tabIndex={-1}
        aria-modal={modal ? 'true' : 'false'}
        {...(c.heading ? { 'aria-labelledby': headingId } : { 'aria-label': 'Announcement' })}>
        <button type="button" className="kp-close" aria-label="Close" data-kp-autofocus onClick={preview ? undefined : () => onClose?.('dismiss')}>
          <span aria-hidden="true">&times;</span>
        </button>
        {img && (/* eslint-disable-next-line @next/next/no-img-element */
          <img className="kp-image" src={img} alt={c.imagePosition === 'background' ? '' : c.imageAlt} loading="eager" />
        )}
        <div className="kp-content">
          <div className="kp-text">
            {c.eyebrow ? <p className="kp-eyebrow">{c.eyebrow}</p> : null}
            {c.heading ? <h2 className="kp-heading" id={headingId}>{c.heading}</h2> : null}
            {c.bodyHtml ? <div className="kp-body" dangerouslySetInnerHTML={{ __html: c.bodyHtml }} /> : null}
            {!hasText ? <p className="kp-body">Add a heading or body text.</p> : null}
          </div>
          {(primary || secondary || c.dismissLabel) && (
            <div className="kp-actions">
              {primary && link(primary, 'primary', '')}
              {secondary && link(secondary, 'secondary', 'kp-cta--secondary')}
              {c.dismissLabel && (
                <button type="button" className="kp-dismiss" onClick={preview ? undefined : () => onClose?.('dismiss')}>{c.dismissLabel}</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
