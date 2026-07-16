'use client';

import { useEffect, useRef } from 'react';

/**
 * Parallax — translates an element vertically as it moves through the viewport,
 * creating depth. Best applied to oversized, absolutely-positioned decorative
 * layers so the motion never exposes an edge. Disabled for reduced motion.
 *
 * Props:
 *  - speed: fraction of scroll distance to offset by (e.g. 0.12). Negative
 *           values move the layer against the scroll direction.
 */
export default function Parallax({
  children,
  speed = 0.12,
  as: Tag = 'div',
  className = '',
  style,
  ...rest
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const viewport = window.innerHeight || document.documentElement.clientHeight;
      const center = rect.top + rect.height / 2;
      const offset = center - viewport / 2;
      const y = -offset * speed;
      el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
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
  }, [speed]);

  return (
    <Tag ref={ref} className={className} style={{ willChange: 'transform', ...style }} {...rest}>
      {children}
    </Tag>
  );
}
