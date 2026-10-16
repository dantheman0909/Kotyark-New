import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import SharePriceCard from '@/components/site/SharePriceCard';
import InvestorsHub from '@/components/site/InvestorsHub';
import { buildMetadata, breadcrumbJsonLd, webPageJsonLd } from '@/lib/seo';
import { listFolders } from '@/lib/documents';
import { getQuote, getHistory, MANUAL_QUOTE } from '@/lib/stock';
import styles from './investors.module.css';

export const dynamic = 'force-dynamic';

const DESCRIPTION = 'Investor relations for Kotyark Industries (NSE: KOTYARK): SEBI LODR disclosures, board meetings, AGM papers, policies and financial statements in one library.';

export const metadata = buildMetadata({
  title: { absolute: 'Investor Relations | Kotyark Industries (NSE: KOTYARK)' },
  description: DESCRIPTION,
  path: '/investors',
});

// The price must never hold the page up: a slow feed falls back to the manual figures and no chart.
async function loadStock() {
  const fallback = { quote: { ...MANUAL_QUOTE }, history: { range: '1Y', points: [] } };
  try {
    return await Promise.race([
      Promise.all([getQuote(), getHistory('1Y')]).then(([quote, history]) => ({ quote, history })),
      new Promise((resolve) => setTimeout(() => resolve(fallback), 5000)),
    ]);
  } catch { return fallback; }
}

export default async function InvestorsPage() {
  // Folders (DB) and the stock calls (cached/network) are independent: run them in parallel.
  const [folders, { quote, history }] = await Promise.all([
    listFolders({ visibleOnly: true }).catch((e) => { console.error('Investor hub folders failed:', e.message); return []; }),
    loadStock(),
  ]);
  const rows = folders.map((f) => ({
    slug: f.slug, name: f.name, description: f.description || '', category: f.category || 'Other', count: f.document_count,
  }));

  return (
    <div className={styles.root}>
      <JsonLd data={[
        webPageJsonLd({ type: 'CollectionPage', name: 'Investor Relations', path: '/investors', description: DESCRIPTION }),
        breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Investor Relations', path: '/investors' }]),
      ]} />

      <section className="kd-dark kd-hero-pad" data-screen-label="Investors — Share price">
        <div className="kd-wrap">
          <p className="kd-eyebrow" style={{ marginBottom: 28 }}>Investor Relations</p>
          <h1 className={`kd-h1 ${styles.hd}`} style={{ marginBottom: 64 }}>
            <span className="kd-line"><span className="kd-kin" data-kin="0">Every filing,</span></span>
            <span className="kd-line"><span className="kd-kin" data-kin="1">in the open.</span></span>
          </h1>
          <SharePriceCard variant="ir" initialQuote={quote} initialHistory={history} />
        </div>
      </section>

      <InvestorsHub folders={rows} />

      <section className="kd-dark kd-sec-b" data-screen-label="Investors — Desk">
        <div className={`kd-wrap ${styles.desk}`}>
          <h2 className={`kd-h2-b ${styles.hd}`} data-reveal="1">Questions for the compliance desk?</h2>
          <div className={styles.deskCol} data-reveal="1">
            <p className={styles.deskP}>Shareholder queries go straight to our compliance team. Disputes can also be raised through SEBI&apos;s Smart ODR portal.</p>
            <Link href="/contact?subject=Investor%20relations" className="kd-btn kd-btn-primary">Contact investor relations →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
