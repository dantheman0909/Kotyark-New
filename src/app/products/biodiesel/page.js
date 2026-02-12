import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata = {
  title: 'Biodiesel B100 - Renewable Diesel Fuel',
  description: "Clean-burning B100 biodiesel from non-edible vegetable oil. 86% less greenhouse gas. More power, better mileage. Order biodiesel now.",
};

export default function BiodieselPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Biodiesel (B100)</h1>
          <p>Premium renewable diesel fuel — cleaner burning, carbon neutral, and superior performance.</p>
        </div>
      </section>

      {/* Product Overview */}
      <section className="section">
        <div className="container">
          <ScrollReveal>
            <div className="split">
              <div>
                <span className="section-tag" style={{ display: 'inline-block', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-accent)', marginBottom: '12px' }}>
                  Product Overview
                </span>
                <h2>What is B100 Biodiesel?</h2>
                <p style={{ marginTop: '16px' }}>
                  Biodiesel is a <strong>renewable, clean-burning diesel replacement</strong> produced through the
                  trans-esterification of non-edible vegetable oils. Chemically classified as a mono alkyl ester,
                  biodiesel is functionally equivalent to petroleum-based High-Speed Diesel (HSD) but with
                  dramatically lower environmental impact.
                </p>
                <p>
                  At Kotyark Industries, we manufacture <strong>B100 (neat/pure) biodiesel</strong> at our
                  Government-approved, zero-discharge facilities. B100 can be used directly or blended with
                  petroleum diesel at varying ratios — from <strong>B5 (5% biodiesel)</strong> to
                  <strong> B20 (20% biodiesel)</strong> — without requiring engine modifications.
                </p>
                <p>
                  Our biodiesel meets all quality standards set by the Bureau of Indian Standards (BIS)
                  and is approved by the <strong>Bio-Fuel Authority under the Government of Rajasthan</strong>.
                </p>
              </div>
              <div className="split-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/images/biodiesel-cycle.png" alt="Biodiesel production cycle showing feedstocks, biofuel production, renewable fuel, and CO2 absorption" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Benefits */}
      <section className="section section-alt">
        <div className="container">
          <ScrollReveal>
            <div className="section-header">
              <span className="section-tag">Advantages</span>
              <h2>Benefits of Biodiesel</h2>
              <p>Biodiesel delivers measurable advantages across environmental, economic, and operational dimensions.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="benefits-grid">
              {[
                { icon: '✓', text: '86% less greenhouse gas emissions compared to petroleum diesel' },
                { icon: '✓', text: 'Higher cetane number for improved combustion and engine performance' },
                { icon: '✓', text: 'Superior lubricity that protects fuel system components and reduces wear' },
                { icon: '✓', text: 'More power and better mileage than conventional HSD diesel' },
                { icon: '✓', text: 'Carbon neutral — CO₂ absorbed during biomass growth offsets emissions' },
                { icon: '✓', text: 'Non-toxic and biodegradable — environmentally safe in case of spills' },
                { icon: '✓', text: 'Reduces India\'s dependency on imported crude oil' },
                { icon: '✓', text: 'Creates rural employment through feedstock cultivation and processing' },
              ].map((benefit, i) => (
                <div className="benefit-item" key={i}>
                  <div className="benefit-check">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p>{benefit.text}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Applications */}
      <section className="section">
        <div className="container">
          <ScrollReveal>
            <div className="section-header">
              <span className="section-tag">Use Cases</span>
              <h2>Biodiesel Applications</h2>
              <p>B100 biodiesel and its blends serve diverse sectors across India&apos;s economy.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                </div>
                <h4>Transport &amp; Logistics</h4>
                <p>Commercial fleets, trucks, and heavy vehicles. B5–B20 blends require no engine modifications and provide cleaner emissions.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" /></svg>
                </div>
                <h4>Industrial Power</h4>
                <p>Backup power generators, boilers, and industrial heating systems. Biodiesel provides reliable, cleaner-burning energy.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 2v10l7-7" /></svg>
                </div>
                <h4>Agriculture</h4>
                <p>Farm equipment, tractors, and irrigation pump sets. Biodiesel supports rural India&apos;s energy needs sustainably.</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Technical Specs */}
      <section className="section section-alt">
        <div className="container">
          <ScrollReveal>
            <div className="section-header">
              <span className="section-tag">Specifications</span>
              <h2>Technical Data</h2>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div style={{ maxWidth: '800px', margin: '0 auto', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--color-primary)', color: 'white' }}>
                    <th style={{ padding: '14px 20px', textAlign: 'left', fontFamily: 'Plus Jakarta Sans', fontWeight: 600, fontSize: '14px' }}>Parameter</th>
                    <th style={{ padding: '14px 20px', textAlign: 'left', fontFamily: 'Plus Jakarta Sans', fontWeight: 600, fontSize: '14px' }}>Specification</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Chemical Type', 'Mono Alkyl Ester (FAME)'],
                    ['Feedstock', 'Non-edible vegetable oils'],
                    ['Process', 'Trans-esterification'],
                    ['GHG Reduction', '86% vs. petroleum diesel'],
                    ['Blending Range', 'B5 (5%) to B100 (neat)'],
                    ['Engine Compatibility', 'All diesel engines (B5–B20 without modification)'],
                    ['Cetane Number', 'Higher than conventional HSD'],
                    ['Biodegradability', '100% biodegradable, non-toxic'],
                    ['Lubricity', 'Superior to petroleum diesel'],
                    ['Approval', 'Bio-Fuel Authority, Govt. of Rajasthan'],
                  ].map(([param, spec], i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px 20px', fontSize: '15px', fontWeight: 500 }}>{param}</td>
                      <td style={{ padding: '12px 20px', fontSize: '15px', color: 'var(--color-text-secondary)' }}>{spec}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <ScrollReveal>
            <div className="cta-section">
              <h2>Order Biodiesel Today</h2>
              <p>Get in touch for bulk supply, custom blending ratios, and delivery across India.</p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
                <Link href="/contact" className="btn btn-primary btn-lg">Request a Quote →</Link>
                <Link href="/products/crude-glycerin" className="btn btn-outline-light btn-lg">View Crude Glycerin</Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
