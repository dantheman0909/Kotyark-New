'use client';

import { useEffect, useRef, useState } from 'react';

const STAGES = [
  {
    n: '01',
    title: 'Sustainable Feedstock',
    kicker: 'Where it begins',
    desc:
      'We source non-edible vegetable oils and used cooking oil — feedstock that never competes with the food chain. As it grows, the biomass draws CO₂ out of the atmosphere.',
    color: '#2e8b57',
    icon: (
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 18Zm0 0c0-8 3-11 8-14" />
    ),
  },
  {
    n: '02',
    title: 'Trans-esterification',
    kicker: 'Inside the plant',
    desc:
      'At our zero-discharge facilities the oils react with methanol, transforming into mono-alkyl esters — the chemistry that turns raw feedstock into clean, usable fuel.',
    color: '#1b5e3a',
    icon: (
      <>
        <path d="M9 3h6" />
        <path d="M10 3v6.5L5.5 17a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 9.5V3" />
        <path d="M7 14h10" />
      </>
    ),
  },
  {
    n: '03',
    title: 'Premium B100 Biodiesel',
    kicker: 'The product',
    desc:
      'The result is premium B100 biodiesel — blendable at any ratio from B5 to B100, with higher cetane, superior lubricity, more power and better mileage than conventional diesel.',
    color: '#d97706',
    icon: (
      <path d="M12 2.7s6 6.4 6 10.3a6 6 0 0 1-12 0C6 9.1 12 2.7 12 2.7Z" />
    ),
  },
  {
    n: '04',
    title: 'Clean Combustion',
    kicker: 'On the road',
    desc:
      'Burned in engines and industry, Kotyark biodiesel releases up to 86% fewer greenhouse gases than fossil diesel — and it is biodegradable and non-toxic.',
    color: '#0891b2',
    icon: (
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    ),
  },
  {
    n: '05',
    title: 'The Carbon Loop Closes',
    kicker: 'Back to the earth',
    desc:
      'The CO₂ released during combustion is reabsorbed by the next generation of feedstock — closing a renewable, near carbon-neutral cycle that keeps repeating.',
    color: '#16a34a',
    icon: (
      <>
        <path d="M21 12a9 9 0 1 1-3-6.7" />
        <polyline points="21 3 21 8 16 8" />
      </>
    ),
  },
];

export default function ProcessScrolly() {
  const [active, setActive] = useState(0);
  const stepRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.dataset.index);
            if (!Number.isNaN(idx)) setActive(idx);
          }
        });
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );

    stepRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const stage = STAGES[active];

  return (
    <section className="sw-scrolly section" id="story" aria-label="How Kotyark biodiesel is made">
      <div className="container">
        <div className="section-header sw-scrolly-header">
          <span className="section-tag">The Kotyark Journey</span>
          <h2>From Seed to Sustainable Fuel</h2>
          <p>
            Scroll through the renewable carbon cycle — the five stages that turn a
            growing plant into clean energy, and back again.
          </p>
        </div>

        <div className="sw-scrolly-grid">
          {/* Pinned, cross-fading stage visual (desktop) */}
          <div className="sw-scrolly-visual" aria-hidden="true">
            <div
              className="sw-stage-card"
              style={{ '--stage-color': stage.color }}
            >
              <div className="sw-stage-orb" key={`orb-${active}`}>
                <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {stage.icon}
                </svg>
              </div>
              <div className="sw-stage-body" key={`body-${active}`}>
                <span className="sw-stage-index">{stage.n} / 05</span>
                <span className="sw-stage-kicker">{stage.kicker}</span>
                <h3 className="sw-stage-title">{stage.title}</h3>
                <p className="sw-stage-desc">{stage.desc}</p>
              </div>

              <div className="sw-stage-rail">
                {STAGES.map((s, i) => (
                  <span
                    key={i}
                    className={`sw-rail-dot${i === active ? ' is-active' : ''}${i < active ? ' is-done' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Scrolling steps */}
          <div className="sw-scrolly-steps">
            {STAGES.map((s, i) => (
              <div
                key={i}
                data-index={i}
                ref={(el) => (stepRefs.current[i] = el)}
                className={`sw-step${i === active ? ' is-active' : ''}`}
                style={{ '--stage-color': s.color }}
              >
                <div className="sw-step-visual" aria-hidden="true">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {s.icon}
                  </svg>
                </div>
                <div className="sw-step-body">
                  <span className="sw-step-num">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
