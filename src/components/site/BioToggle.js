'use client';
import { useEffect, useId, useRef, useState } from 'react';
import s from './about.module.css';

// A director's profile (one or more paragraphs), clamped to a few lines with "Read more". The full text is always
// in the HTML (crawlers, screen readers, no-JS); the clamp is visual only, and the button shows only on overflow.
export default function BioToggle({ paragraphs, className }) {
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const ref = useRef(null);
  const id = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const check = () => { if (!open) setOverflows(el.scrollHeight > el.clientHeight + 1); };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  return (
    <>
      <div id={id} ref={ref} className={`${s.bio} ${open ? '' : s.bioClamp} ${overflows && !open ? s.bioFade : ''}`}>
        {paragraphs.map((t, i) => <p key={i} className={className}>{t}</p>)}
      </div>
      {(overflows || open) && (
        <button type="button" className={s.bioMore} aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
          {open ? 'Show less' : 'Read more'}
        </button>
      )}
    </>
  );
}
