import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata = {
  title: 'Biodiesel & Glycerin Products',
  description: "Explore Kotyark's range of biofuel products: B100 Biodiesel, Crude Glycerin, and more. Government approved. Available across India.",
};

export default function ProductsPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Our Products</h1>
          <p>High-quality biofuels and by-products manufactured at our zero-discharge facilities in Rajasthan and Gujarat.</p>
        </div>
      </section>

      {/* Current Products */}
      <section className="section">
        <div className="container">
          <ScrollReveal>
            <div className="section-header">
              <span className="section-tag">Available Now</span>
              <h2>Current Product Range</h2>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="products-grid">
              <Link href="/products/biodiesel" className="product-card">
                <div className="product-card-image" style={{ backgroundImage: 'url(/images/biodiesel-product.png)', backgroundColor: 'var(--color-primary)', height: '280px' }} role="img" aria-label="Premium B100 Biodiesel fuel" />
                <div className="product-card-body">
                  <h3>Biodiesel (B100)</h3>
                  <p>
                    Premium quality biodiesel manufactured from non-edible vegetable oils through
                    advanced trans-esterification processes. A clean-burning, renewable diesel alternative
                    that delivers 86% fewer greenhouse gas emissions, superior lubricity, and higher
                    cetane number than conventional HSD.
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0 0', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {['Carbon Neutral', 'Non-Toxic', 'Engine Safe', 'High Cetane'].map((tag) => (
                      <li key={tag} style={{ fontSize: '12px', fontWeight: 600, padding: '4px 12px', background: 'var(--color-bg-section-alt)', borderRadius: 'var(--radius-full)', color: 'var(--color-primary)' }}>
                        {tag}
                      </li>
                    ))}
                  </ul>
                  <span className="product-card-link" style={{ marginTop: '16px' }}>
                    View Details
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </div>
              </Link>
              <Link href="/products/crude-glycerin" className="product-card">
                <div className="product-card-image" style={{ backgroundImage: 'url(/images/glycerin-product.png)', backgroundColor: 'var(--color-primary-light)', height: '280px' }} role="img" aria-label="Crude Glycerin by-product" />
                <div className="product-card-body">
                  <h3>Crude Glycerin</h3>
                  <p>
                    High-quality crude glycerin produced as a valuable by-product of biodiesel
                    manufacturing. Also known as glycerol, it finds extensive applications in
                    food processing, pharmaceuticals, cosmetics, and industrial sectors worldwide.
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0 0', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {['Food Grade', 'Pharma Grade', 'Industrial', 'Cosmetics'].map((tag) => (
                      <li key={tag} style={{ fontSize: '12px', fontWeight: 600, padding: '4px 12px', background: 'var(--color-bg-section-alt)', borderRadius: 'var(--radius-full)', color: 'var(--color-primary)' }}>
                        {tag}
                      </li>
                    ))}
                  </ul>
                  <span className="product-card-link" style={{ marginTop: '16px' }}>
                    View Details
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

      {/* Coming Soon Products */}
      <section className="section section-alt">
        <div className="container">
          <ScrollReveal>
            <div className="section-header">
              <span className="section-tag">Expanding</span>
              <h2>Upcoming Products</h2>
              <p>Kotyark is expanding its product portfolio to serve broader renewable energy needs.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                </div>
                <h4>CBFS</h4>
                <p>Carbon Black Feed Stock — a high-demand industrial raw material for the rubber and tyre manufacturing industry.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
                </div>
                <h4>Light Petroleum Oil (LPO)</h4>
                <p>Light petroleum oil derivatives for specialized industrial and energy applications.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 2v20M2 12h20" /><circle cx="12" cy="12" r="10" /></svg>
                </div>
                <h4>Dewatering Fluid</h4>
                <p>Specialized dewatering fluids for industrial processes and environmental management applications.</p>
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
              <h2>Need Bulk Biodiesel Supply?</h2>
              <p>Contact us for pricing, availability, and customized supply agreements for your business needs.</p>
              <Link href="/contact" className="btn btn-primary btn-lg">Request a Quote →</Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
