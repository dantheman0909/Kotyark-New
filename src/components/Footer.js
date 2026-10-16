'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DEFAULT_HEADER_NAV } from '@/lib/nav-defaults';
import s from './Footer.module.css';

// Top level of the CMS footer menu (items with no link contribute their children), else the default site menu.
function siteLinks(nav) {
  const src = nav && nav.length ? nav : DEFAULT_HEADER_NAV;
  const out = [];
  for (const i of src) {
    if (i.href) out.push(i);
    else if (i.children?.length) out.push(...i.children.filter((c) => c.href));
  }
  return out;
}

// nav: footer menu from the CMS ([{ label, href, children? }]) or null.
export default function Footer({ nav = null, year }) {
  const pathname = usePathname();
  const showCta = !(pathname === '/contact' || pathname?.startsWith('/contact/'));
  const links = siteLinks(nav);

  return (
    <>
      {showCta && (
        <section className={`${s.cta} kd-green-bg`} aria-labelledby="kd-cta-title" data-screen-label="CTA">
          <div className="kd-wrap">
            <h2 id="kd-cta-title" className={s.ctaTitle} data-reveal="1">Partner with India&apos;s biofuel leader.</h2>
            <div className="kd-btns" data-reveal="1">
              <Link href="/contact?subject=Bulk%20biodiesel%20supply" className="kd-btn kd-btn-paper">Request bulk supply →</Link>
              <Link href="/investors" className="kd-btn kd-btn-ghost-green">Investor relations</Link>
            </div>
          </div>
        </section>
      )}

      <footer className={s.footer}>
        <div className="kd-wrap">
          <div className={s.grid}>
            <div>
              <Link href="/" aria-label="Kotyark Industries Limited home" className={s.logo}>
                <img src="/images/kil-logo-white-trim.png" alt="Kotyark Industries Limited" width="115" height="72" loading="lazy" />
              </Link>
            </div>
            <div className={s.col}>
              <div className={s.label}>Registered office</div>
              <address className={s.addr}>F-20, RIICO Industrial Area, Swaroopganj, Sirohi, Rajasthan 307026</address>
            </div>
            <div className={s.col}>
              <div className={s.label}>CIN</div>
              L15149RJ2023PLC091598
            </div>
            <nav className={s.site} aria-label="Footer">
              <div className={s.label} style={{ marginBottom: 6 }}>Site</div>
              {links.map((l) => (
                <Link key={l.id || l.href} href={l.href} className={s.link}>{l.label}</Link>
              ))}
            </nav>
          </div>
          <div className={s.bottom}>
            <span>© {year} Kotyark Industries Limited</span>
            <Link href="/login" className={s.login}>Investor portal login</Link>
            <span>Formerly Kotyark Industries Private Limited</span>
          </div>
        </div>
      </footer>
    </>
  );
}
