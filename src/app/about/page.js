import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata = {
  title: "About Kotyark Industries - India's Biofuel Pioneer",
  description: "Learn about Kotyark Industries Limited, a BSE-listed biodiesel manufacturer with 480,000 KL capacity. Zero discharge facilities in Rajasthan & Gujarat.",
};

export default function AboutPage() {
  return (
    <>
      {/* Page Hero */}
      <section className="page-hero">
        <div className="container">
          <h1>About Kotyark Industries</h1>
          <p>Pioneering India&apos;s clean energy revolution through biodiesel manufacturing since our foundation.</p>
        </div>
      </section>

      {/* Company Overview */}
      <section className="section">
        <div className="container">
          <ScrollReveal>
            <div className="split">
              <div>
                <span className="section-tag" style={{ display: 'inline-block', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-accent)', marginBottom: '12px' }}>
                  Our Story
                </span>
                <h2>Building India&apos;s Biofuel Future</h2>
                <p style={{ marginTop: '16px' }}>
                  Kotyark Industries Limited is a <strong>publicly listed
                  biodiesel manufacturing company</strong> on the Bombay Stock Exchange (BSE). We operate
                  state-of-the-art, zero-discharge biodiesel production facilities in <strong>Sirohi,
                  Rajasthan</strong> and <strong>Anand, Gujarat</strong>.
                </p>
                <p>
                  With an annual installed capacity of <strong>480,000 kiloliters</strong> and daily
                  production of <strong>210 KL</strong>, Kotyark is one of India&apos;s leading biodiesel
                  manufacturers. We convert non-edible vegetable oils into premium B100 biodiesel
                  through advanced trans-esterification processes.
                </p>
                <p>
                  Our operations are approved by the <strong>Bio-Fuel Authority under the Rural Development
                  Department and Panchayati Raj, Government of Rajasthan</strong>, reflecting our commitment
                  to quality, safety, and environmental responsibility.
                </p>
              </div>
              <div>
                <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="stat-card">
                    <div className="stat-number" style={{ fontSize: '36px' }}>480K</div>
                    <div className="stat-label">KL Annual Capacity</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number" style={{ fontSize: '36px' }}>210</div>
                    <div className="stat-label">KL Daily Output</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number" style={{ fontSize: '36px' }}>2</div>
                    <div className="stat-label">Manufacturing Plants</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number" style={{ fontSize: '36px' }}>Zero</div>
                    <div className="stat-label">Discharge Facilities</div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="section section-alt">
        <div className="container">
          <ScrollReveal>
            <div className="split">
              <div style={{ padding: 'var(--space-7)', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <h3 style={{ marginBottom: '16px' }}>Our Vision</h3>
                <p style={{ fontSize: '18px', lineHeight: '1.7' }}>
                  To be India&apos;s most trusted producer of sustainable biofuels, leading the
                  nation&apos;s transition to carbon-neutral energy and reducing dependency on
                  imported fossil fuels.
                </p>
              </div>
              <div style={{ padding: 'var(--space-7)', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <h3 style={{ marginBottom: '16px' }}>Our Mission</h3>
                <p style={{ fontSize: '18px', lineHeight: '1.7' }}>
                  To manufacture premium-quality biodiesel that exceeds industry standards while
                  maintaining zero-discharge operations, supporting rural employment, and delivering
                  value to our shareholders and communities.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Leadership */}
      <section className="section">
        <div className="container">
          <ScrollReveal>
            <div className="section-header">
              <span className="section-tag">Leadership</span>
              <h2>Board of Directors</h2>
              <p>Experienced professionals driving Kotyark&apos;s growth and innovation in India&apos;s biofuel sector.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="team-grid">
              <div className="team-card">
                <div className="team-photo">GS</div>
                <h4>Mr. Gaurang Shah</h4>
                <div className="team-role">Chairman cum Managing Director</div>
                <p className="team-bio">
                  Commerce Graduate from Maharaja Sayajirao University of Baroda with over 27 years
                  of experience in vegetable oil trading and biofuels. As Promoter and CMD, he leads
                  overall management, strategy formulation, and ensures operations consistently exceed
                  industry standards.
                </p>
              </div>
              <div className="team-card">
                <div className="team-photo">DS</div>
                <h4>Mrs. Dhruti Shah</h4>
                <div className="team-role">Whole Time Director &amp; CFO</div>
                <p className="team-bio">
                  Holds M.Com and MBA degrees with approximately 11 years of industry experience.
                  Appointed CFO and KMP in September 2024, she oversees all financial and
                  operational activities from conceptualization to execution, bringing extensive
                  knowledge of the biofuel industry.
                </p>
              </div>
              <div className="team-card">
                <div className="team-photo">BS</div>
                <h4>Mrs. Bhaviniben Shah</h4>
                <div className="team-role">Non-Executive Director</div>
                <p className="team-bio">
                  Diploma in Mechanical Engineering with approximately 10 years of experience
                  in the biofuels sector. Has made important contributions to the company&apos;s
                  operations and growth.
                </p>
              </div>
              <div className="team-card">
                <div className="team-photo">AS</div>
                <h4>Mr. Akshay Jayrajbhai Shah</h4>
                <div className="team-role">Non-Executive Independent Director</div>
                <p className="team-bio">
                  Bachelor of Science with 15 years of professional experience.
                  Provides independent oversight and governance, contributing to strategic
                  decision-making and corporate compliance.
                </p>
              </div>
              <div className="team-card">
                <div className="team-photo">HP</div>
                <h4>Mr. Harsh Mukeshbhai Parikh</h4>
                <div className="team-role">Non-Executive Independent Director</div>
                <p className="team-bio">
                  MBA with 21 years of experience across various sectors. Has played
                  an instrumental role in the company&apos;s growth since joining, providing
                  strategic and governance guidance.
                </p>
              </div>
              <div className="team-card">
                <div className="team-photo">VM</div>
                <h4>Mr. Viral Mamtora</h4>
                <div className="team-role">Additional Independent Director</div>
                <p className="team-bio">
                  B.Com from Saurashtra University and Associate Member of ICAI with
                  over 15 years of experience in Finance and Accounts. Currently Proprietor
                  of M/s. Viral M. Mamtora &amp; Associates.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Facilities */}
      <section className="section section-alt">
        <div className="container">
          <ScrollReveal>
            <div className="section-header">
              <span className="section-tag">Our Facilities</span>
              <h2>Manufacturing Plants</h2>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="products-grid">
              <div className="product-card" style={{ cursor: 'default' }}>
                <div className="product-card-image" style={{ backgroundColor: 'var(--color-primary)', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ position: 'relative', zIndex: 2, color: 'white', fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '24px' }}>Rajasthan Plant</span>
                </div>
                <div className="product-card-body">
                  <h3>Sirohi, Rajasthan</h3>
                  <p>
                    Primary manufacturing facility located at F-20, RICCO Industrial Area,
                    Swaroopganj, Sirohi District, Rajasthan 307026. Equipped with advanced
                    trans-esterification technology and zero-discharge systems.
                  </p>
                </div>
              </div>
              <div className="product-card" style={{ cursor: 'default' }}>
                <div className="product-card-image" style={{ backgroundColor: 'var(--color-primary-light)', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ position: 'relative', zIndex: 2, color: 'white', fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '24px' }}>Gujarat Plant</span>
                </div>
                <div className="product-card-body">
                  <h3>Anand, Gujarat</h3>
                  <p>
                    Second manufacturing facility in Anand, Gujarat, expanding Kotyark&apos;s
                    production capacity and geographical reach to serve clients across western
                    India efficiently.
                  </p>
                </div>
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
              <h2>Ready to Partner With Us?</h2>
              <p>
                Join India&apos;s biofuel revolution. Contact us for biodiesel supply,
                partnership opportunities, or investor inquiries.
              </p>
              <Link href="/contact" className="btn btn-primary btn-lg">Contact Us →</Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
