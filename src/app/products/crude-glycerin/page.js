import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata = {
  title: 'Crude Glycerin Supplier India',
  description: "High-quality crude glycerin from biodiesel production. Applications in food, pharmaceuticals & cosmetics. 210 KL/day capacity at Sirohi.",
};

export default function CrudeGlycerinPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Crude Glycerin</h1>
          <p>Premium by-product of biodiesel manufacturing — versatile applications across industries.</p>
        </div>
      </section>

      {/* Overview */}
      <section className="section">
        <div className="container">
          <ScrollReveal>
            <div className="split">
              <div>
                <span className="section-tag" style={{ display: 'inline-block', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-accent)', marginBottom: '12px' }}>
                  Product Overview
                </span>
                <h2>What is Crude Glycerin?</h2>
                <p style={{ marginTop: '16px' }}>
                  Crude glycerin (also known as glycerol) is a <strong>valuable by-product</strong> generated
                  during the trans-esterification process of biodiesel manufacturing. For every 10 parts of
                  biodiesel produced, approximately 1 part of crude glycerin is obtained.
                </p>
                <p>
                  At Kotyark Industries, our crude glycerin is produced alongside our premium B100 biodiesel
                  at our zero-discharge facilities. The glycerin undergoes quality checks to ensure it meets
                  industry standards for various downstream applications.
                </p>
                <p>
                  Crude glycerin serves as a versatile raw material across multiple industries — from
                  <strong> food processing and pharmaceuticals</strong> to <strong>cosmetics, soaps,
                  and industrial chemicals</strong>. After refinement, it becomes a high-value ingredient
                  in thousands of consumer and industrial products.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="stat-card">
                  <div className="stat-number" style={{ fontSize: '36px' }}>210</div>
                  <div className="stat-label">KL/Day Biodiesel Capacity (glycerin proportional)</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number" style={{ fontSize: '36px' }}>~10%</div>
                  <div className="stat-label">Glycerin yield per biodiesel batch</div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Applications */}
      <section className="section section-alt">
        <div className="container">
          <ScrollReveal>
            <div className="section-header">
              <span className="section-tag">Applications</span>
              <h2>Crude Glycerin Uses</h2>
              <p>Our crude glycerin finds applications across diverse industries after appropriate processing and refinement.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" /></svg>
                </div>
                <h4>Food Processing</h4>
                <p>Used as a humectant, sweetener, and solvent in food products. Refined glycerin is GRAS (Generally Recognized As Safe) approved.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" /></svg>
                </div>
                <h4>Pharmaceuticals</h4>
                <p>Essential ingredient in syrups, cough medicines, capsules, and topical formulations for its moisturizing and solvent properties.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                </div>
                <h4>Cosmetics &amp; Personal Care</h4>
                <p>Key ingredient in skincare, haircare, and personal hygiene products for its moisturizing, emollient, and humectant properties.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
                </div>
                <h4>Soap &amp; Detergents</h4>
                <p>Traditional and modern soap manufacturing uses glycerin as a base ingredient, providing moisturizing properties to the finished product.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                </div>
                <h4>Industrial Chemicals</h4>
                <p>Used as a raw material in producing alkyd resins, polyurethanes, and various industrial chemicals and solvents.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 2v20M2 12h20" /><circle cx="12" cy="12" r="10" /></svg>
                </div>
                <h4>Animal Feed</h4>
                <p>Crude glycerin is used as an energy supplement in livestock and poultry feed formulations, adding caloric value.</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <ScrollReveal>
            <div className="cta-section">
              <h2>Enquire About Crude Glycerin Supply</h2>
              <p>Contact us for pricing, specifications, and bulk supply of crude glycerin from our manufacturing facilities.</p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
                <Link href="/contact" className="btn btn-primary btn-lg">Contact Sales →</Link>
                <Link href="/products/biodiesel" className="btn btn-outline-light btn-lg">View Biodiesel</Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
