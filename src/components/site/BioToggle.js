'use client';
import { useEffect, useId, useRef, useState } from 'react';
import s from './about.module.css';

// A director's profile: clamped to a few lines with "Read more". The full text is always in the HTML
// (crawlers, screen readers, no-JS); the clamp is visual only, and the button appears only when text overflows.
export default function BioToggle({ text, className }) {
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
      <p id={id} ref={ref} className={`${className} ${open ? '' : s.bioClamp}`}>{text}</p>
      {(overflows || open) && (
        <button type="button" className={s.bioMore} aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
          {open ? 'Show less' : 'Read more'}
        </button>
      )}
    </>
  );
}
