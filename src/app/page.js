import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';
import CarbonCreditBadge from '@/components/CarbonCreditBadge';

export default function HomePage() {
  return (
    <>
      {/* ============================
          HERO SECTION
          ============================ */}
      <section className="hero" id="hero">
        <div className="hero-bg" style={{ backgroundImage: 'url(/images/hero-forest.jpg)' }} role="img" aria-label="Aerial view of lush green forest canopy representing renewable energy" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            BSE Listed &middot; Government Approved Biofuel Manufacturer
          </div>
          <h1>
            Powering India&apos;s Future With{' '}
            <span className="highlight">Clean Biodiesel</span>
          </h1>
          <p className="hero-subtitle">
            India&apos;s leading biodiesel manufacturer with 480,000 KL annual capacity.
            We convert non-edible vegetable oils into premium B100 biodiesel — delivering
            86% less greenhouse emissions and a carbon-neutral fuel alternative.
          </p>
          <div className="hero-actions">
            <Link href="/contact" className="btn btn-primary btn-lg">Contact Our Team →</Link>
            <Link href="/products" className="btn btn-outline-light btn-lg">Explore Products</Link>
          </div>
        </div>
        <CarbonCreditBadge />
        <div className="hero-scroll" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </section>

      {/* ============================
          TRUST BAR
          ============================ */}
      <section className="trust-bar" aria-label="Trust indicators">
        <div className="container">
          <div className="trust-bar-grid">
            <div className="trust-item">
              <div className="trust-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <div className="trust-label">Government Approved</div>
                <div className="trust-sublabel">Bio-Fuel Authority, Govt. of Rajasthan</div>
              </div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div>
                <div className="trust-label">BSE Listed</div>
                <div className="trust-sublabel">Publicly traded, SEBI compliant</div>
              </div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div>
                <div className="trust-label">480,000 KL Capacity</div>
                <div className="trust-sublabel">Annual biodiesel production</div>
              </div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 22 16 8l2.5 2.5L5 22H2z" /><path d="M17.5 2.5a2.12 2.12 0 0 1 3 3L12 14l-4 1 1-4z" />
                </svg>
              </div>
              <div>
                <div className="trust-label">Zero Discharge</div>
                <div className="trust-sublabel">Environmentally responsible plants</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================
          WHAT IS BIODIESEL
          ============================ */}
      <section className="section" id="what-is-biodiesel">
        <div className="container">
          <ScrollReveal>
            <div className="split">
              <div>
                <span className="section-tag" style={{ display: 'inline-block', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-accent)', marginBottom: '12px' }}>
                  What is Biodiesel?
                </span>
                <h2>A Cleaner Fuel For a Greener Tomorrow</h2>
                <p style={{ marginTop: '16px' }}>
                  Biodiesel is a renewable, clean-burning diesel alternative produced through the
                  trans-esterification of non-edible vegetable oils. As a <strong>mono alkyl ester</strong>,
                  it is chemically similar to conventional High-Speed Diesel (HSD) but produces
                  <strong> 86% fewer greenhouse gas emissions</strong>.
                </p>
                <p>
                  At Kotyark Industries, we manufacture premium <strong>B100 biodiesel</strong> that
                  can be blended at any ratio — from B5 (5%) to B100 (neat) — delivering superior
                  lubricity, higher cetane numbers, more power, and better mileage than conventional diesel.
                </p>
                <p>
                  Our biodiesel is approved by the <strong>Bio-Fuel Authority under the Rural Development
                  Department and Panchayati Raj, Government of Rajasthan</strong>, ensuring the highest
                  standards of quality and environmental compliance.
                </p>
                <Link href="/products/biodiesel" className="btn btn-secondary" style={{ marginTop: '8px' }}>
                  Learn About Biodiesel →
                </Link>
              </div>
              <div className="split-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/images/biodiesel-cycle.png" alt="Biodiesel production cycle infographic showing feedstocks, biofuel production, renewable fuel usage, and carbon dioxide absorption by biomass" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ============================
          KEY STATISTICS
          ============================ */}
      <section className="section section-alt" id="stats">
        <div className="container">
          <ScrollReveal>
            <div className="section-header">
              <span className="section-tag">Impact at Scale</span>
              <h2>India&apos;s Biofuel Capacity Leader</h2>
              <p>Operating advanced biodiesel manufacturing facilities across Rajasthan and Gujarat with zero-discharge environmental compliance.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">480K</div>
                <div className="stat-label">KL Annual Capacity</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">210</div>
                <div className="stat-label">KL/Day Production</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">86%</div>
                <div className="stat-label">Less GHG Emissions</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">Zero</div>
                <div className="stat-label">Discharge Facilities</div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ============================
          PRODUCTS
          ============================ */}
      <section className="section" id="products">
        <div className="container">
          <ScrollReveal>
            <div className="section-header">
              <span className="section-tag">Our Products</span>
              <h2>Renewable Energy Products</h2>
              <p>High-quality biofuels and by-products manufactured at our state-of-the-art facilities in Sirohi, Rajasthan and Anand, Gujarat.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="products-grid">
              <Link href="/products/biodiesel" className="product-card">
                <div className="product-card-image" style={{ backgroundImage: 'url(/images/biodiesel-product.png)', backgroundColor: 'var(--color-primary)' }} role="img" aria-label="Premium B100 Biodiesel fuel" />
                <div className="product-card-body">
                  <h3>Biodiesel (B100)</h3>
                  <p>
                    Premium quality biodiesel manufactured from non-edible vegetable oils through
                    trans-esterification. A clean, renewable diesel alternative with superior
                    lubricity and higher cetane number.
                  </p>
                  <span className="product-card-link">
                    Explore Biodiesel
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </div>
              </Link>
              <Link href="/products/crude-glycerin" className="product-card">
                <div className="product-card-image" style={{ backgroundImage: 'url(/images/glycerin-product.png)', backgroundColor: 'var(--color-primary-light)' }} role="img" aria-label="Crude Glycerin by-product" />
                <div className="product-card-body">
                  <h3>Crude Glycerin</h3>
                  <p>
                    High-quality crude glycerin produced as a valuable by-product of biodiesel
                    manufacturing. Widely used in food processing, pharmaceuticals, cosmetics,
                    and industrial applications.
                  </p>
                  <span className="product-card-link">
                    Explore Glycerin
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </div>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ============================
          WHY BIODIESEL (FEATURES)
          ============================ */}
      <section className="section section-alt" id="features">
        <div className="container">
          <ScrollReveal>
            <div className="section-header">
              <span className="section-tag">Why Biodiesel?</span>
              <h2>The Advantages of Biofuel Energy</h2>
              <p>Biodiesel delivers measurable benefits across environmental, economic, and operational dimensions.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h4>Carbon Neutral</h4>
                <p>Biodiesel is produced from biomass that absorbs CO₂ during growth, creating a closed carbon cycle that achieves near-zero net emissions.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <h4>More Power</h4>
                <p>Higher cetane number delivers improved combustion efficiency, more torque, and better mileage compared to conventional HSD diesel fuel.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h4>Engine Safe</h4>
                <p>Superior lubricity protects engine components and reduces wear. Compatible with all diesel engines without modification at B5-B20 blends.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <h4>Reduces Imports</h4>
                <p>Domestically produced biodiesel reduces India&apos;s dependency on imported crude oil, strengthening energy security and saving foreign exchange.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  </svg>
                </div>
                <h4>Non-Toxic</h4>
                <p>Biodegradable and non-toxic. Breaks down naturally in the environment, unlike petroleum diesel, making spills safer to manage.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 2v20M2 12h20" /><circle cx="12" cy="12" r="10" />
                  </svg>
                </div>
                <h4>Job Creation</h4>
                <p>Biodiesel manufacturing supports rural economies by creating employment in feedstock cultivation, processing, and distribution across India.</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ============================
          SAVE THE PLANET / CTA
          ============================ */}
      <section className="section" id="impact">
        <div className="container">
          <ScrollReveal>
            <div className="split split-reverse">
              <div>
                <span className="section-tag" style={{ display: 'inline-block', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-accent)', marginBottom: '12px' }}>
                  Environmental Impact
                </span>
                <h2>Building a Carbon-Neutral Future</h2>
                <p style={{ marginTop: '16px' }}>
                  Every litre of biodiesel from Kotyark replaces petroleum diesel,
                  reducing greenhouse gas emissions by up to <strong>86%</strong>.
                  With annual capacity of <strong>480,000 kiloliters</strong>, we&apos;re
                  making a measurable impact on India&apos;s carbon footprint.
                </p>
                <p>
                  Our zero-discharge manufacturing facilities ensure that the production
                  process itself is environmentally responsible — from feedstock sourcing
                  to final product delivery.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
                  <div style={{ padding: '16px', background: 'var(--color-bg-section-alt)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '28px', color: 'var(--color-primary)' }}>86%</div>
                    <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Less GHG emissions</div>
                  </div>
                  <div style={{ padding: '16px', background: 'var(--color-bg-section-alt)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '28px', color: 'var(--color-primary)' }}>100%</div>
                    <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Biodegradable fuel</div>
                  </div>
                </div>
              </div>
              <div className="split-image" style={{ background: 'var(--color-bg-section-alt)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
                <img src="/images/save-planet.jpg" alt="Hands holding a globe made of recycled materials, representing environmental sustainability through biodiesel" style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '400px' }} />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ============================
          NEWSLETTER / CTA
          ============================ */}
      <section className="section" id="newsletter">
        <div className="container">
          <ScrollReveal>
            <div className="cta-section">
              <h2>Partner With India&apos;s Biofuel Leader</h2>
              <p>
                Whether you need bulk biodiesel supply, crude glycerin, or want to discuss investment opportunities
                — our team is ready to help.
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
                <Link href="/contact" className="btn btn-primary btn-lg">Contact Our Team →</Link>
                <Link href="/investors" className="btn btn-outline-light btn-lg">Investor Relations</Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
