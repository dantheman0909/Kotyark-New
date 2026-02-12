import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand">
            <Link href="/" className="navbar-logo" style={{ color: 'white', marginBottom: '16px', display: 'inline-flex' }}>
              <img src="/images/kotyark-logo.png" alt="Kotyark Industries" style={{ height: '48px', width: 'auto' }} />
            </Link>
            <p>India&apos;s leading biodiesel manufacturer committed to building a carbon-neutral future through renewable energy solutions.</p>
            <p style={{ fontSize: '13px', marginTop: '12px' }}>
              <strong>CIN:</strong> L15149RJ2023PLC091598<br/>
              <strong>BSE Listed</strong> &mdash; Biodiesel &amp; Biofuel Sector
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h5>Company</h5>
            <ul className="footer-links">
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/products">Products</Link></li>
              <li><Link href="/products/biodiesel">Biodiesel</Link></li>
              <li><Link href="/products/crude-glycerin">Crude Glycerin</Link></li>
              <li><Link href="/investors">Investors</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h5>Resources</h5>
            <ul className="footer-links">
              <li><Link href="/investors">SEBI LODR Filings</Link></li>
              <li><Link href="/investors">Financial Statements</Link></li>
              <li><Link href="/investors">Board Meetings</Link></li>
              <li><Link href="/contact">Contact Us</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h5>Head Office</h5>
            <ul className="footer-links" style={{ gap: '16px' }}>
              <li>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span style={{ color: 'rgba(240,255,244,0.6)', fontSize: '13px', lineHeight: '1.5' }}>
                    F-20, RICCO Industrial Area, Swaroopganj, Sirohi, Rajasthan 307026
                  </span>
                </div>
              </li>
              <li>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
                    <rect width="20" height="16" x="2" y="4" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  <span style={{ color: 'rgba(240,255,244,0.6)', fontSize: '13px' }}>info@kotyark.com</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p>&copy; {currentYear} Kotyark Industries Limited. All rights reserved.</p>
          <p>Approved by Bio-Fuel Authority, Govt. of Rajasthan</p>
        </div>
      </div>
    </footer>
  );
}
