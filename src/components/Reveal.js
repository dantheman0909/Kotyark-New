'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Reveal — scroll-triggered entrance animation wrapper.
 *
 * Props:
 *  - variant: 'up' | 'down' | 'left' | 'right' | 'scale' | 'none'
 *  - delay:   ms before the transition starts
 *  - stagger: when true, direct children animate in sequence
 *  - once:    animate a single time (default) or every time it enters
 *  - as:      element/tag to render (default 'div')
 */
export default function Reveal({
  children,
  as: Tag = 'div',
  variant = 'up',
  delay = 0,
  stagger = false,
  once = true,
  threshold = 0.15,
  className = '',
  style,
  ...rest
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold, rootMargin: '0px 0px -8% 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, threshold]);

  const cls = [
    stagger ? 'sw-reveal-stagger' : 'sw-reveal',
    !stagger ? `sw-reveal--${variant}` : '',
    visible ? 'is-visible' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag
      ref={ref}
      className={cls}
      style={delay ? { ...style, transitionDelay: `${delay}ms` } : style}
      {...rest}
    >
      {children}
    </Tag>
  );
}
