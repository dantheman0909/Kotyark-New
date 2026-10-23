'use client';
import { useEffect, useRef, useState } from 'react';
import s from './process.module.css';

const STAGES = [
  { n: '01', t: 'Feedstock', h: 'Non-edible oils, sourced in India.', b: 'We start with non-edible vegetable oils, so our feedstock does not compete with the food supply.' },
  { n: '02', t: 'Reaction', h: 'Trans-esterification rebuilds the molecule.', b: 'Oils react to form mono alkyl esters (FAME). Crude glycerin separates out and is sold as a second product.' },
  { n: '03', t: 'B100', h: 'Neat biodiesel, made to standard.', b: 'Premium B100 meeting BIS quality standards, approved by the Bio-Fuel Authority, Govt. of Rajasthan, with 86% lower GHG than petroleum diesel.' },
  { n: '04', t: 'Blend', h: 'From B5 to B100. No new engines.', b: 'Blends up to B20 run in any diesel engine without modification, including fleets, gensets, boilers, tractors and pump sets.' },
];
const LEGEND = [
  { t: 'Vegetable oil', c: '#B9781A', on: (st) => st <= 1 },
  { t: 'FAME · B100', c: '#E8B649', on: (st) => st >= 2 },
  { t: 'Crude glycerin', c: '#6B4423', on: (st) => st >= 1 },
];
const BLEND_STEPS = [5, 10, 20, 50, 100];

/** Scroll-driven process story (port of onScroll() in the design). 440vh section, sticky 100svh stage. */
export default function ProcessStory() {
  const secRef = useRef(null);
  const oilRef = useRef(null);
  const glyRef = useRef(null);
  const blendRef = useRef(null);
  const barRef = useRef(null);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    let last = 0;
    const onScroll = () => {
      const el = secRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      const st = Math.min(3, Math.floor(p * 4));
      const loc = Math.min(1, p * 4 - st);
      const e = 1 - Math.pow(1 - loc, 3);
      const liquid = st === 0 ? 12 + 60 * e : 72;
      const gly = st === 0 ? 0 : st === 1 ? 16 * e : 16;
      if (oilRef.current) {
        const o = oilRef.current.style;
        o.bottom = gly + '%';
        o.height = (liquid - gly) + '%';
        o.transition = 'background-color .8s';
        o.backgroundColor = st >= 2 ? '#E8B649' : '#B9781A';
      }
      if (glyRef.current) glyRef.current.style.height = gly + '%';
      if (barRef.current) barRef.current.style.width = (p * 100) + '%';
      if (blendRef.current) {
        blendRef.current.textContent = st < 3 ? (st === 2 ? 'B100' : 'B0') : 'B' + BLEND_STEPS[Math.min(4, Math.floor(loc * 5))];
      }
      if (st !== last) { last = st; setStage(st); }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, []);

  return (
    <section ref={secRef} className={s.section} aria-labelledby="kd-process-title" data-screen-label="Home — Process story">
      <div className={s.sticky}>
        <div className={s.grid}>
          <div className={s.text}>
            <div className={`kd-eyebrow on-dark ${s.eyebrow}`}>02 / Process</div>
            <h2 id="kd-process-title" className={s.h2}>Seed to B100 in four stages.</h2>
            <div className={s.stages}>
              {STAGES.map((st, i) => (
                <div
                  key={st.n}
                  className={s.stage}
                  style={{ opacity: i === stage ? 1 : 0, transform: `translateY(${i === stage ? 0 : i < stage ? -28 : 28}px)` }}
                  aria-hidden={i === stage ? undefined : true}
                >
                  <div className={s.stageHead}>
                    <span className={s.num}>{st.n}</span>
                    <span className={s.stageTag}>{st.t}</span>
                  </div>
                  <h3 className={s.h3}>{st.h}</h3>
                  <p className={s.body}>{st.b}</p>
                </div>
              ))}
            </div>
            <div className={s.chips} aria-hidden="true">
              {STAGES.map((st, i) => (
                <div key={st.n} className={s.chip} style={{ color: i <= stage ? '#F2EFE6' : '#6F807A', borderTopColor: i <= stage ? '#F28B30' : 'rgba(242,239,230,.15)' }}>{st.n} {st.t}</div>
              ))}
            </div>
          </div>

          <div className={s.vesselCol}>
            <div className={s.scale} aria-hidden="true"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div>
            <div className={s.vessel} aria-hidden="true">
              <div ref={glyRef} className={s.gly} />
              <div ref={oilRef} className={s.oil} />
            </div>
            <div className={s.side}>
              <div className={s.legend}>
                {LEGEND.map((lg) => (
                  <div key={lg.t} className={s.legendRow} style={{ opacity: lg.on(stage) ? 1 : 0.3 }}>
                    <span className={s.swatch} style={{ background: lg.c }} />
                    <span className={s.legendText}>{lg.t}</span>
                  </div>
                ))}
              </div>
              <div className={s.blend}>
                <span className={s.blendLabel}>Blend</span>
                <span ref={blendRef} className={s.blendVal} suppressHydrationWarning>B0</span>
              </div>
            </div>
          </div>
        </div>
        <div className={s.barTrack} aria-hidden="true"><div ref={barRef} className={s.bar} /></div>
      </div>
    </section>
  );
}
