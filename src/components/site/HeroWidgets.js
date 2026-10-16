'use client';
import { useEffect, useRef, useState } from 'react';
import s from './home.module.css';

const WORDS = ['fleets', 'gensets', 'tractors', 'boilers', 'pump sets'];

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** The rotating word in the hero eyebrow: Web Animations swap every 2200 ms (static under reduced motion).
 *  The word is React state, never written to the DOM directly; the animations only touch style. */
export function RotatingWord() {
  const ref = useRef(null);
  const [word, setWord] = useState(WORDS[0]);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced() || !el.animate) return undefined;
    let i = 0;
    let anims = [];
    let dead = false;
    const t = setInterval(() => {
      i = (i + 1) % WORDS.length;
      const next = WORDS[i];
      const out = el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-10px)' }], { duration: 260, easing: 'ease-in', fill: 'forwards' }); // held at opacity 0 until the new word is rendered
      anims.push(out);
      out.finished.then(() => { anims = anims.filter((a) => a !== out); }, () => {});
      out.addEventListener('finish', () => {
        if (dead || !el.isConnected) return;
        setWord(next);
        requestAnimationFrame(() => {
          if (dead) return;
          out.cancel();
          const inA = el.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.2,.7,.1,1)' });
          anims.push(inA);
          inA.finished.then(() => { anims = anims.filter((a) => a !== inA); }, () => {});
        });
      });
    }, 2200);
    return () => { dead = true; clearInterval(t); anims.forEach((a) => a.cancel()); anims = []; };
  }, []);
  return <span ref={ref} className={s.rot}>{word}</span>;
}

/** Facts marquee: 0.5px per frame, looped by duplicating the list (the copy is aria-hidden). Frozen under reduced motion. */
export function Marquee({ facts }) {
  const trackRef = useRef(null);
  const copyRef = useRef(null);
  useEffect(() => {
    const track = trackRef.current;
    const copy = copyRef.current;
    if (!track || !copy || reduced()) return undefined;
    let mx = 0;
    let raf = 0;
    const loop = () => {
      mx -= 0.5;
      const period = copy.offsetLeft; // width of one list plus the gap
      if (period && -mx >= period) mx += period;
      track.style.transform = `translateX(${mx}px)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const list = (hidden, ref) => (
    <ul ref={ref} className={s.marqList} aria-hidden={hidden || undefined}>
      {facts.map((f) => (
        <li key={f} className={s.marqItem}><span>{f}</span><span className={s.marqDiamond} aria-hidden="true">◆</span></li>
      ))}
    </ul>
  );
  return (
    <div className={s.marqWrap}>
      <div ref={trackRef} className={s.marqTrack}>
        {list(false)}
        {list(true, copyRef)}
      </div>
    </div>
  );
}
