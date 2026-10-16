import { CmsOrLegacy } from '@/components/blocks/PageView';
import ContactForm from '@/components/site/Contact';
import styles from '@/components/site/Contact.module.css';
import JsonLd from '@/components/JsonLd';
import { overrideMetadata } from '@/lib/pages';
import { buildMetadata, webPageJsonLd } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const TITLE = 'Contact Kotyark | Bulk Biodiesel and Glycerin Supply';
const DESCRIPTION = 'Contact Kotyark Industries for bulk B100 biodiesel and crude glycerin supply, partnerships, media or investor relations. Registered office in Sirohi, Rajasthan.';

const FALLBACK = buildMetadata({
  path: '/contact',

  title: { absolute: TITLE },
  description: DESCRIPTION,
});

export async function generateMetadata() {
  return overrideMetadata('/contact', FALLBACK);
}

const OFFICES = [
  { k: 'Head office', t: 'Sirohi, Rajasthan', d: 'F-20, RIICO Industrial Area, Swaroopganj, Sirohi District, Rajasthan 307026' },
  { k: 'Plant II', t: 'Anand, Gujarat', d: 'Anand, Gujarat, India' },
  { k: 'Company', t: 'Kotyark Industries Limited', d: 'CIN L15149RJ2023PLC091598 · Listed on NSE' },
  { k: 'Approval', t: 'Bio-Fuel Authority', d: 'Rural Development & Panchayati Raj Department, Government of Rajasthan' },
];

export default async function ContactPage({ searchParams }) {
  const sp = await searchParams;
  const subject = typeof sp?.subject === 'string' ? sp.subject : '';
  return (
    <CmsOrLegacy path="/contact">
      <JsonLd data={webPageJsonLd({ type: 'ContactPage', name: TITLE, path: '/contact', description: DESCRIPTION })} />
      <section className={styles.hero}>
        <div className={styles.wrap}>
          <div className={styles.heroEyebrow}>Contact</div>
          <h1 className={`kd-h1 ${styles.h1}`}>
            <span className="kd-line"><span className="kd-kin" data-kin="0">Talk to the people</span></span>
            <span className="kd-line"><span className="kd-kin kd-accent" data-kin="1">who make the fuel.</span></span>
          </h1>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.grid}>
          <div><ContactForm initialSubject={subject} /></div>
          <address className={styles.offices}>
            {OFFICES.map((o) => (
              <div className={styles.office} key={o.k}>
                <span className={styles.officeKey}>{o.k}</span>
                <div>
                  <div className={styles.officeTitle}>{o.t}</div>
                  <div className={styles.officeText}>{o.d}</div>
                </div>
              </div>
            ))}
            <a className={styles.mail} href="mailto:info@kotyark.com">info@kotyark.com</a>
          </address>
        </div>
      </section>
    </CmsOrLegacy>
  );
}
