import Image from 'next/image';
import Link from 'next/link';
import BlendExplorer from './BlendExplorer';
import prim from './prim.module.css';
import s from './platform.module.css';

const SPECS = [['Chemical type', 'Mono alkyl ester (FAME)'], ['Feedstock', 'Non-edible vegetable oils'], ['Process', 'Trans-esterification'], ['GHG reduction', '86% vs. petroleum diesel'], ['Blending range', 'B5 (5%) to B100 (neat)'], ['Engine compatibility', 'All diesel engines; B5–B20 without modification'], ['Cetane number', 'Higher than conventional HSD'], ['Biodegradability', '100% biodegradable, non-toxic'], ['Lubricity', 'Superior to petroleum diesel'], ['Approval', 'Bio-Fuel Authority, Govt. of Rajasthan']];
const APPS = [
  { n: '01', t: 'Transport & logistics', d: 'Commercial fleets, trucks and heavy vehicles. B5–B20 blends need no engine modification.' },
  { n: '02', t: 'Industrial power', d: 'Backup generators, boilers and industrial heating systems.' },
  { n: '03', t: 'Agriculture', d: 'Tractors, farm equipment and irrigation pump sets across rural India.' },
];
const GLY_USES = ['Food processing', 'Pharmaceuticals', 'Cosmetics', 'Industrial applications'];

/** Inner-page / platform hero: eyebrow + kinetic two-line H1. */
export function PlatformHero() {
  return (
    <section className={`kd-dark kd-hero-pad ${prim.root}`} aria-labelledby="kd-platform-title" data-screen-label="Platform — Hero">
      <div className="kd-wrap">
        <div className={`kd-eyebrow ${prim.eb}`}>Products</div>
        <h1 id="kd-platform-title" className={`kd-h1 ${prim.hd}`}>
          <span className="kd-line"><span data-kin="0" className="kd-kin">Two products.</span></span>{' '}
          <span className="kd-line"><span data-kin="1" className="kd-kin kd-accent">One closed loop.</span></span>
        </h1>
        <div className={s.heroGrid}>
          <p data-reveal="1" data-delay="500" className={s.heroLead}>B100 biodiesel and crude glycerin, both produced by trans-esterification of non-edible vegetable oils at our Government-approved, zero-discharge plants.</p>
          <div data-reveal="1" data-delay="650" className={s.tiles}>
            <a href="#b100" className={s.tile}>
              <span className={s.tileImg}><Image src="/images/biodiesel-product.png" alt="" fill loading="eager" sizes="(min-width: 1000px) 22vw, 45vw" /></span>
              <span className={s.tileRow}><span className={s.tileName}>Biodiesel B100</span><span className={s.tileArrow} aria-hidden="true">↓</span></span>
              <span className={s.tileMeta}>86% lower GHG</span>
            </a>
            <a href="#glycerin" className={s.tile}>
              <span className={s.tileImg}><Image src="/images/glycerin-product.png" alt="" fill loading="eager" sizes="(min-width: 1000px) 22vw, 45vw" /></span>
              <span className={s.tileRow}><span className={s.tileName}>Crude Glycerin</span><span className={s.tileArrow} aria-hidden="true">↓</span></span>
              <span className={s.tileMeta}>Co-product</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/** B100 spec sheet with the sticky product image. */
export function B100Section({ title = 'Biodiesel (B100)', eyebrow = 'Product 01' }) {
  return (
    <section id="b100" className={`kd-light kd-sec-b ${prim.root} ${s.anchor}`} aria-labelledby="kd-b100-title" data-screen-label="Platform — B100">
      <div className={`kd-wrap ${s.b100Grid}`}>
        <div>
          <div data-reveal="1" className={s.stickyImg}>
            <Image src="/images/biodiesel-product.png" alt="B100 biodiesel sample" fill loading="lazy" sizes="(min-width: 1000px) 45vw, 100vw" />
          </div>
        </div>
        <div>
          <div data-reveal="1" className="kd-eyebrow on-light">{eyebrow}</div>
          <h2 id="kd-b100-title" data-reveal="1" className={`${prim.hd} ${s.productH2}`}>{title}</h2>
          <p data-reveal="1" className={s.productLead}>A renewable, clean-burning replacement for High-Speed Diesel. Chemically a mono alkyl ester, functionally equivalent to HSD, with higher cetane, superior lubricity and dramatically lower lifecycle emissions.</p>
          <dl className={s.specs}>
            {SPECS.map(([k, v]) => (
              <div key={k} data-reveal="1" className={s.specRow}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export function BlendSection() {
  return (
    <section className={`kd-dark kd-sec-b ${prim.root}`} aria-labelledby="kd-blend-title" data-screen-label="Platform — Blend calculator">
      <div className="kd-wrap">
        <div data-reveal="1" className="kd-eyebrow on-dark">Blend explorer</div>
        <h2 id="kd-blend-title" data-reveal="1" className={`${prim.hd} ${s.h2} ${s.blendH2}`}>Pick a blend. See what changes.</h2>
        <BlendExplorer />
      </div>
    </section>
  );
}

export function ApplicationsSection() {
  return (
    <section className={`kd-light kd-sec-b ${prim.root}`} aria-labelledby="kd-apps-title" data-screen-label="Platform — Applications">
      <div className="kd-wrap">
        <h2 id="kd-apps-title" data-reveal="1" className={`${prim.hd} ${s.h2} ${s.appsH2}`}>Where B100 goes to work.</h2>
        <ul className={s.apps}>
          {APPS.map((a) => (
            <li key={a.n} data-reveal="1">
              <div data-line="1" className={s.appRule} />
              <div className={s.appNum}>{a.n}</div>
              <h3 className={`${prim.hd} ${s.appTitle}`}>{a.t}</h3>
              <p className={s.appDesc}>{a.d}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function GlycerinSection({ title = 'Crude Glycerin', eyebrow = 'Product 02' }) {
  return (
    <section id="glycerin" className={`kd-sand kd-sec-b ${prim.root} ${s.anchor}`} aria-labelledby="kd-glycerin-title" data-screen-label="Platform — Glycerin">
      <div className={`kd-wrap ${s.glyGrid}`}>
        <div>
          <div data-reveal="1" className="kd-eyebrow on-light">{eyebrow}</div>
          <h2 id="kd-glycerin-title" data-reveal="1" className={`${prim.hd} ${s.productH2}`}>{title}</h2>
          <p data-reveal="1" className={s.glyLead}>Crude glycerin separates out during trans-esterification. We supply it to manufacturers in food, pharma, cosmetics and industry.</p>
          <ul data-reveal="1" className={s.uses}>
            {GLY_USES.map((g) => <li key={g}>{g}</li>)}
          </ul>
        </div>
        <div data-reveal="1" className={s.glyImg}>
          <Image src="/images/glycerin-product.png" alt="Crude glycerin" fill loading="lazy" sizes="(min-width: 1000px) 45vw, 100vw" />
        </div>
      </div>
    </section>
  );
}

/** Closing links of an inner product page. */
export function ProductBackLinks({ otherHref, otherLabel }) {
  return (
    <section className={`kd-sand ${prim.root} ${s.backSec}`} aria-label="More products">
      <div className={`kd-wrap ${s.backRow}`}>
        <Link href="/products" className="kd-ulink">← All products</Link>
        <Link href={otherHref} className="kd-ulink">{otherLabel} →</Link>
      </div>
    </section>
  );
}

export default function Platform() {
  return (
    <>
      <PlatformHero />
      <B100Section />
      <BlendSection />
      <ApplicationsSection />
      <GlycerinSection />
    </>
  );
}
