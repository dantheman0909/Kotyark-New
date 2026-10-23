import Image from 'next/image';
import JsonLd from '@/components/JsonLd';
import { peopleJsonLd, webPageJsonLd } from '@/lib/seo';
import { BOARD } from '@/lib/site-content';
import prim from './prim.module.css';
import s from './about.module.css';


const TIMELINE = [
  { y: 'Heritage', t: 'Vegetable-oil trading roots', d: 'Promoter experience spanning nearly three decades in vegetable oils and biofuels.' },
  { y: 'Plant I', t: 'Sirohi, Rajasthan', d: 'Primary zero-discharge biodiesel facility at RIICO Industrial Area, Swaroopganj.' },
  { y: 'Listing', t: 'Listed on BSE SME', d: 'Kotyark becomes a publicly listed biodiesel manufacturer.' },
  { y: '2023', t: 'Kotyark Industries Limited', d: 'Incorporated in Rajasthan as a public limited company (CIN L15149RJ2023PLC091598).' },
  { y: 'Plant II', t: 'Anand, Gujarat', d: 'Second facility expands capacity and western-India reach.' },
  { y: 'Main Board', t: 'Migration to Main Board', d: 'Moves from the SME platform to the Main Board.' },
  { y: 'Jun 2026', t: 'Certificate of Excellence, UK Parliament', d: 'World Book of Records, London honours MD Gaurang Shah for innovation in sustainable biofuel.' },
];

const PLANTS = [
  { code: 'Plant I', name: 'Sirohi, Rajasthan', city: 'Sirohi', long: 'Primary facility at F-20, RIICO Industrial Area, Swaroopganj, with advanced trans-esterification with zero-discharge systems.' },
  { code: 'Plant II', name: 'Anand, Gujarat', city: 'Anand', long: 'Second facility extending capacity and reach to clients across western India.' },
];

export default function About() {
  return (
    <div className={prim.root}>
      <JsonLd data={[
        webPageJsonLd({ type: 'AboutPage', name: 'About Kotyark Industries', path: '/about', description: 'Kotyark Industries Limited is an NSE-listed biodiesel manufacturer operating zero-discharge plants in Sirohi, Rajasthan and Anand, Gujarat.' }),
        ...peopleJsonLd(BOARD.map((b) => ({ name: b.fullName, alternateName: b.n.replace(/^(Mr|Mrs)\. /, ''), jobTitle: b.r, description: b.bio.join(' '), image: b.img, alumniOf: b.alumniOf, award: b.award, sameAs: b.linkedin ? [b.linkedin] : undefined }))),
      ]} />

      <section className="kd-dark kd-hero-pad" aria-labelledby="kd-about-title" data-screen-label="About — Hero">
        <div className="kd-wrap">
          <div className={`kd-eyebrow ${prim.eb}`}>About Kotyark</div>
          <h1 id="kd-about-title" className={`kd-h1 ${prim.hd}`}>
            <span className="kd-line"><span data-kin="0" className="kd-kin">Built in India.</span></span>{' '}
            <span className="kd-line"><span data-kin="1" className="kd-kin kd-accent">Measured in kilolitres.</span></span>
          </h1>
        </div>
      </section>

      <section className="kd-light kd-sec-b" aria-label="Our story" data-screen-label="About — Story">
        <div className="kd-wrap">
          <p data-reveal="1" className={s.story}>Kotyark Industries Limited is an NSE-listed biodiesel manufacturer operating zero-discharge plants in Sirohi, Rajasthan and Anand, Gujarat. Our biodiesel is approved by the Bio-Fuel Authority, Rural Development &amp; Panchayati Raj Department, Government of Rajasthan.</p>
          <div className={s.vm}>
            <div data-reveal="1">
              <div data-line="1" className={s.rule} />
              <h2 className={s.vmLabel}>Vision</h2>
              <p className={s.vmText}>To be India&apos;s most trusted producer of sustainable biofuels, leading the transition to carbon-neutral energy and reducing dependency on imported fossil fuels.</p>
            </div>
            <div data-reveal="1" data-delay="120">
              <div data-line="1" className={s.rule} />
              <h2 className={s.vmLabel}>Mission</h2>
              <p className={s.vmText}>To manufacture premium biodiesel that exceeds industry standards while maintaining zero-discharge operations, supporting rural employment, and delivering value to shareholders and communities.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="kd-sand kd-sec-b" aria-labelledby="kd-board-title" data-screen-label="About — Leadership">
        <div className="kd-wrap">
          <div data-reveal="1" className="kd-eyebrow on-light">Board of Directors</div>
          <h2 id="kd-board-title" data-reveal="1" className={`${prim.hd} ${s.h2} ${s.h2Mb56}`}>The people accountable.</h2>
          <ul className={s.board}>
            {BOARD.map((b) => (
              <li key={b.i} data-reveal="1" className={s.person}>
                {b.img ? (
                  <div className={s.photo}>
                    <Image src={b.img} alt={`${b.n}, ${b.r}`} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" className={s.photoImg} />
                  </div>
                ) : (
                  <div className={s.portrait} aria-hidden="true">
                    <span className={s.initials}>{b.i}</span>
                    <span className={s.portraitTag}>Portrait</span>
                  </div>
                )}
                <div className={s.personBody}>
                  <h3 className={`${prim.hd} ${s.personName}`}>{b.n}</h3>
                  <div className={s.personRole}>{b.r}</div>
                  <p className={s.personBio}>{b.summary}</p>
                  {b.linkedin && (
                    <a href={b.linkedin} target="_blank" rel="noopener noreferrer" className={s.linkedin} aria-label={`${b.n} on LinkedIn (opens in a new tab)`}>
                      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"/></svg>
                      <span>LinkedIn</span>
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="kd-dark kd-sec-b" aria-labelledby="kd-milestones-title" data-screen-label="About — Milestones">
        <div className="kd-wrap-narrow">
          <div data-reveal="1" className="kd-eyebrow on-dark">Milestones</div>
          <h2 id="kd-milestones-title" data-reveal="1" className={`${prim.hd} ${s.h2} ${s.h2Mb64}`}>From oil trading to listed biofuel.</h2>
          <div className={s.timelineWrap}>
            <span data-vline="1" className={s.vline} aria-hidden="true" />
            <ol className={s.timeline}>
            {TIMELINE.map((m) => (
              <li key={m.t} data-reveal="1" className={s.milestone}>
                <span className={s.mDot} aria-hidden="true" />
                <span className={s.mYear}>{m.y}</span>
                <div>
                  <h3 className={`${prim.hd} ${s.mTitle}`}>{m.t}</h3>
                  <p className={s.mDesc}>{m.d}</p>
                </div>
              </li>
            ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="kd-light kd-sec-b" aria-labelledby="kd-plants-title" data-screen-label="About — Facilities">
        <div className="kd-wrap">
          <h2 id="kd-plants-title" data-reveal="1" className={`${prim.hd} ${s.h2} ${s.h2Mb56}`}>Manufacturing plants</h2>
          <div className={s.plants}>
            {PLANTS.map((pl) => (
              <article key={pl.code} data-reveal="1">
                <div className={s.plantPh} role="img" aria-label={`Plant photography placeholder: ${pl.city}`}>Plant photography: {pl.city}</div>
                <div className={s.plantHead}>
                  <span className={s.plantCode}>{pl.code}</span>
                  <h3 className={`${prim.hd} ${s.plantName}`}>{pl.name}</h3>
                </div>
                <p className={s.plantLong}>{pl.long}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
