'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import CarbonCreditBadge from '@/components/CarbonCreditBadge';

const HEADLINE = ["Powering", "India's", "Future", "With"];

// Deterministic particle field (avoids SSR/CSR hydration mismatches).
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 53 + 7) % 100,
  size: 3 + ((i * 7) % 9),
  delay: (i % 9) * 0.8,
  duration: 11 + (i % 6) * 2.5,
  drift: ((i % 2 ? 1 : -1) * (12 + (i % 5) * 7)),
  opacity: 0.15 + ((i % 4) * 0.12),
}));

export default function HomeHero() {
  const bgRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const vh = window.innerHeight || 1;
      const p = Math.min(y / vh, 1);

      if (bgRef.current) {
        bgRef.current.style.transform = `translate3d(0, ${(y * 0.32).toFixed(1)}px, 0) scale(${(1.15 + p * 0.12).toFixed(3)})`;
      }
      if (contentRef.current) {
        contentRef.current.style.transform = `translate3d(0, ${(y * 0.32).toFixed(1)}px, 0)`;
        contentRef.current.style.opacity = String(Math.max(1 - p * 1.25, 0));
      }
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
    <section className="hero hero--cinematic" id="hero">
      <div
        ref={bgRef}
        className="sw-hero-bg"
        style={{ backgroundImage: 'url(/images/hero-forest.jpg)' }}
        role="img"
        aria-label="Aerial view of a lush green forest canopy representing renewable energy"
      />
      <div className="sw-hero-overlay" />
      <div className="sw-hero-glow" aria-hidden="true" />

      <div className="sw-hero-particles" aria-hidden="true">
        {PARTICLES.map((particle, i) => (
          <span
            key={i}
            className="sw-particle"
            style={{
              left: `${particle.left}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              '--p-op': particle.opacity,
              '--sw-drift': `${particle.drift}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
      </div>

      <div ref={contentRef} className="hero-content sw-hero-content">
        <div className="hero-badge sw-hero-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          BSE Listed &middot; Government Approved Biofuel Manufacturer
        </div>

        <h1 className="sw-hero-title">
          {HEADLINE.map((word, i) => (
            <span key={i} className="sw-hero-word" style={{ animationDelay: `${0.15 + i * 0.12}s` }}>
              {word}{' '}
            </span>
          ))}
          <span className="sw-hero-word highlight" style={{ animationDelay: `${0.15 + HEADLINE.length * 0.12}s` }}>
            Clean Biodiesel
          </span>
        </h1>

        <p className="hero-subtitle sw-hero-fade">
          India&apos;s leading biodiesel manufacturer with 480,000 KL annual capacity.
          We convert non-edible vegetable oils into premium B100 biodiesel — delivering
          86% less greenhouse emissions and a carbon-neutral fuel alternative.
        </p>

        <div className="hero-actions sw-hero-fade">
          <Link href="/contact" className="btn btn-primary btn-lg">Contact Our Team →</Link>
          <Link href="/products" className="btn btn-outline-light btn-lg">Explore Products</Link>
        </div>
      </div>

      <CarbonCreditBadge />

      <a href="#story" className="hero-scroll sw-hero-scroll" aria-label="Scroll to explore">
        <span className="sw-hero-scroll-text">Scroll to explore</span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </a>
    </section>
  );
}
