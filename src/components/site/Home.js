import Image from 'next/image';
import Link from 'next/link';
import { getQuote, getHistory } from '@/lib/stock';
import { RotatingWord, Marquee } from './HeroWidgets';
import ProcessStory from './ProcessStory';
import NetworkMap from './NetworkMap';
import SharePriceCard from './SharePriceCard';
import prim from './prim.module.css';
import s from './home.module.css';

const FACTS = ['480,000 KL annual capacity', '210 KL per day', '86% lower GHG', 'Zero-discharge plants', 'Sirohi, Rajasthan', 'Anand, Gujarat', 'Bio-Fuel Authority approved', 'NSE listed'];

const STATS = [
  { v: 480000, show: '4,80,000', unit: 'KL / yr', label: 'Annual installed biodiesel capacity', pad: 0 },
  { v: 210, show: '210', unit: 'KL / day', label: 'Daily production output', pad: 0 },
  { v: 86, show: '86', unit: '%', label: 'Lower greenhouse-gas emissions than petroleum diesel', pad: 0 },
  { v: 2, show: '02', unit: 'plants', label: 'Zero-discharge facilities in Sirohi and Anand', pad: 2 },
];

const PRODUCTS = [
  { tag: 'Product 01 · Fuel', name: 'Biodiesel (B100)', img: '/images/biodiesel-product.png', href: '/products/biodiesel', desc: 'Clean-burning, renewable replacement for High-Speed Diesel with higher cetane, superior lubricity and better mileage.' },
  { tag: 'Product 02 · By-product', name: 'Crude Glycerin', img: '/images/glycerin-product.png', href: '/products/crude-glycerin', desc: 'Recovered during trans-esterification and supplied to food processing, pharmaceutical, cosmetic and industrial buyers.' },
];

const PLANTS = [
  { code: 'Plant I', name: 'Sirohi, Rajasthan', addr: 'F-20, RIICO Industrial Area, Swaroopganj 307026' },
  { code: 'Plant II', name: 'Anand, Gujarat', addr: 'Serving clients across western India' },
];

// Real investor sections (see src/lib/migrations and scripts/legacy/content-snapshot.json).
const IR_LINKS = [
  { t: 'Board meetings', d: 'Notices and outcomes', href: '/investors/board-meetings' },
  { t: 'Annual General Meeting', d: 'Notices, minutes and annual reports', href: '/investors/annual-general-meeting' },
  { t: 'SEBI LODR · Regulation 46', d: 'Mandatory website disclosures', href: '/investors/sebi-lodr' },
  { t: 'Migration to Main Board', d: 'From BSE SME to Main Board', href: '/investors/migration-to-main-board' },
  { t: 'Company policies', d: 'Governance framework', href: '/investors/company-policies' },
];

async function safeHistory() {
  try { return await getHistory('1Y'); } catch { return { range: '1Y', points: [] }; }
}

// quote and history arrive together from the page (fetched in parallel there); when called bare, fetch both in parallel here.
export default async function Home({ quote: quoteProp, history: historyProp }) {
  const [quote, history] = quoteProp !== undefined && historyProp !== undefined
    ? [quoteProp, historyProp]
    : await Promise.all([quoteProp !== undefined ? quoteProp : getQuote().catch(() => null), historyProp !== undefined ? historyProp : safeHistory()]);

  return (
    <div className={prim.root}>
      {/* ---- 1. Hero ---- */}
      <section className={s.hero} aria-labelledby="kd-hero-title" data-screen-label="Home — Hero">
        <Image src="/images/hero-forest.jpg" alt="" fill priority sizes="100vw" className={s.heroImg} />
        <div className={s.heroTint} />
        <div className={s.heroFade} />
        <div className={s.heroInner}>
          <div className={s.heroEyebrow}>
            <span className={s.heroRule} />
            <span>B100 biodiesel for</span>
            <RotatingWord />
          </div>
          <h1 id="kd-hero-title" className={`${prim.hd} ${s.h1}`}>
            <span className={`${s.kline} ${s.kline1}`}><span data-kin="0" className={s.kin}>India&apos;s next</span></span>{' '}
            <span className={`${s.kline} ${s.kline1}`}><span data-kin="1" className={s.kin}>barrel is grown,</span></span>{' '}
            <span className={`${s.kline} ${s.kline2}`}><span data-kin="2" className={s.kin}>not <span className={s.outline}>drilled.<span data-strike="1" className={s.strike} /></span></span></span>
          </h1>
          <div className={s.heroGrid}>
            <div data-reveal="1" data-delay="700">
              <p className={s.heroLead}>Kotyark Industries turns non-edible vegetable oils into B100 biodiesel. We run 480,000 KL of annual capacity across two zero-discharge plants in Rajasthan and Gujarat, and our fuel cuts greenhouse emissions by 86%.</p>
              <div className="kd-btns">
                <Link href="/products" className="kd-btn kd-btn-primary">See how B100 is made →</Link>
                <Link href="/investors" className="kd-btn kd-btn-ghost">Investor relations</Link>
              </div>
            </div>
          </div>
        </div>
        <Marquee facts={FACTS} />
      </section>

      {/* ---- 2. Scale ---- */}
      <section className="kd-light kd-sec" aria-labelledby="kd-scale-title" data-screen-label="Home — Scale">
        <div className="kd-wrap">
          <div className={s.scaleHead}>
            <div data-reveal="1">
              <div className="kd-eyebrow on-light">01 / Scale</div>
              <h2 id="kd-scale-title" className={`${prim.hd} ${s.h2} ${s.balance}`}>Capacity that moves a national fuel mix.</h2>
            </div>
            <p data-reveal="1" data-delay="120" className={s.scaleLead}>Every litre from our plants replaces petroleum diesel that India would otherwise import.</p>
          </div>
          <div className={s.stats}>
            {STATS.map((st) => (
              <div key={st.unit} className={s.stat}>
                <div data-line="1" className={s.statRule} />
                <div className={s.statBody}>
                  <span className={s.statUnit}>{st.unit}</span>
                  <span data-count={st.v} data-pad={st.pad} className={s.statNum}>{st.show}</span>
                </div>
                <p className={s.statLabel}>{st.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- 3. Process story ---- */}
      <ProcessStory />

      {/* ---- 4. Products ---- */}
      <section className="kd-light kd-sec" aria-labelledby="kd-products-title" data-screen-label="Home — Products">
        <div className="kd-wrap">
          <div data-reveal="1" className={s.productsHead}>
            <div className="kd-eyebrow on-light">03 / Products</div>
            <h2 id="kd-products-title" className={`${prim.hd} ${s.h2} ${s.maxW900}`}>One reaction. Two revenue streams.</h2>
          </div>
          <div className={s.cards}>
            {PRODUCTS.map((p) => (
              <article key={p.name} data-reveal="1" className={s.card}>
                <div className={s.cardImg}>
                  <Image src={p.img} alt={p.name} fill loading="lazy" sizes="(min-width: 1000px) 46vw, 100vw" />
                </div>
                <div className={s.cardBody}>
                  <div className={s.cardTag}>{p.tag}</div>
                  <h3 className={`${prim.hd} ${s.cardName}`}>{p.name}</h3>
                  <p className={s.cardDesc}>{p.desc}</p>
                  <Link href={p.href} className="kd-ulink" style={{ marginTop: 'auto' }} aria-label={`${p.name} specifications`}>Specifications →</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---- 5. Footprint ---- */}
      <section className={`kd-dark kd-sec`} aria-labelledby="kd-footprint-title" data-screen-label="Home — Footprint">
        <div className={`kd-wrap ${s.footGrid}`}>
          <div>
            <div data-reveal="1" className={`kd-eyebrow on-dark`}>04 / Footprint</div>
            <h2 id="kd-footprint-title" data-reveal="1" className={`${prim.hd} ${s.h2Foot}`}>Two plants on India&apos;s western fuel corridor.</h2>
            <p data-reveal="1" className={s.footLead}>Sirohi and Anand sit between India&apos;s largest diesel-consuming states and its western ports, within short haul of fleets, industry and farms.</p>
            <ul className={s.plants}>
              {PLANTS.map((pl) => (
                <li key={pl.code} data-reveal="1" className={s.plant}>
                  <span className={s.plantCode}>{pl.code}</span>
                  <div>
                    <div className={s.plantName}>{pl.name}</div>
                    <div className={s.plantAddr}>{pl.addr}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <NetworkMap />
        </div>
      </section>

      {/* ---- 6. Recognition ---- */}
      <section className="kd-light kd-sec" aria-labelledby="kd-recognition-title" data-screen-label="Home — Recognition">
        <div className={`kd-wrap ${s.recGrid}`}>
          <div>
            <div data-reveal="1" className="kd-eyebrow on-light">05 / Recognition</div>
            <h2 id="kd-recognition-title" data-reveal="1" className={`${prim.hd} ${s.h2} ${s.recH2}`}>Honoured at the UK Parliament.</h2>
            <p data-reveal="1" className={s.recLead}>World Book of Records, London conferred its Certificate of Excellence on our Managing Director, Mr. Gaurang Rameshchandra Shah, for leadership and innovation in sustainable biofuel.</p>
            <dl data-reveal="1" className={s.facts}>
              <dt>Venue</dt><dd>House of Commons, Westminster</dd>
              <dt>Issued</dt><dd>26 June 2026</dd>
              <dt>Category</dt><dd>Excellence</dd>
            </dl>
          </div>
          <div className={s.awards}>
            <div data-reveal="1" className={`${s.award} ${s.awardWide}`}>
              <Image src="/images/award-ceremony.png" alt="Kotyark's Managing Director receiving the World Book of Records certificate" width={730} height={546} sizes="(min-width: 900px) 45vw, 100vw" loading="lazy" />
            </div>
            <div data-reveal="1" data-delay="120" className={`${s.award} ${s.awardCert}`}>
              <Image src="/images/award-cert.png" alt="Certificate of Excellence" fill sizes="(min-width: 900px) 18vw, 40vw" loading="lazy" />
            </div>
            <div data-reveal="1" data-delay="240" className={s.award}>
              <Image src="/images/award-medal.png" alt="World Book of Records medal and certificate" fill sizes="(min-width: 900px) 27vw, 60vw" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* ---- 7. Investors ---- */}
      <section className="kd-dark kd-sec" aria-labelledby="kd-investors-title" data-screen-label="Home — Investors">
        <div className="kd-wrap">
          <div data-reveal="1" className="kd-eyebrow on-dark">06 / Investors</div>
          <h2 id="kd-investors-title" data-reveal="1" className={`${prim.hd} ${s.h2} ${s.invH2}`}>Shareholder information</h2>
          <div className={s.invGrid}>
            <SharePriceCard variant="home" initialQuote={quote} initialHistory={history} />
            <ul className={s.irList}>
              {IR_LINKS.map((l) => (
                <li key={l.href} data-reveal="1">
                  <Link href={l.href} className={s.irRow}>
                    <span>
                      <span className={s.irTitle}>{l.t}</span>
                      <span className={s.irDesc}>{l.d}</span>
                    </span>
                    <span className={s.irArrow} aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
