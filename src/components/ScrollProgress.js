'use client';

import { useEffect, useState } from 'react';

/**
 * ScrollProgress — a thin reading-progress bar pinned to the very top of the
 * viewport, plus a "back to top" control that fades in once the user has
 * travelled through the scroll world.
 */
export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const value = max > 0 ? doc.scrollTop / max : 0;
      setProgress(value);
      setShowTop(doc.scrollTop > 640);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div className="sw-progress" aria-hidden="true">
        <div
          className="sw-progress-bar"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      <button
        type="button"
        className={`sw-top${showTop ? ' is-visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </>
  );
}
