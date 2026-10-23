import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import InvestorSubPageLayout from '@/components/InvestorSubPageLayout';
import { SEBI_LODR_ROWS } from '@/lib/sebi-lodr-table';
import styles from './sebi.module.css';

export const dynamic = 'force-dynamic';

export const metadata = buildMetadata({
  title: 'Disclosure Under Reg. 46 of SEBI (LODR)',
  description: 'Particulars as per SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015 — Regulation 46(2) website disclosures for Kotyark Industries Limited.',
  path: '/investors/sebi-lodr',
});

// Rows are generated verbatim from the live kotyark.com table (scripts/sync-live-ir.mjs --write-lodr).
// The live table has three columns only: Sr. No., Particulars, Details. No regulation references or statuses are invented.
const rows = SEBI_LODR_ROWS;

function DetailLink({ href, label }) {
  const internal = href.startsWith('/');
  if (internal) return <Link href={href} className={styles.pill}>{label} ↗</Link>;
  const isMail = href.startsWith('mailto:');
  return (
    <a href={href} className={isMail ? styles.mail : styles.pill} {...(isMail ? {} : { target: '_blank', rel: 'noopener' })}>
      {label}{isMail ? '' : ' ↗'}
    </a>
  );
}

export default function SebiLodrPage() {
  return (
    <InvestorSubPageLayout title="Disclosure Under Reg. 46 of SEBI (LODR)" activeSlug="sebi-lodr">
      <p className={styles.intro}>
        Particulars as per SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015, Regulation 46(2), for website disclosures by Kotyark Industries Limited.
      </p>
      <table className={styles.table}>
        <caption className="kd-sr">Regulation 46(2) website disclosures</caption>
        <thead>
          <tr>
            <th scope="col">Sr. No.</th>
            <th scope="col">Particulars</th>
            <th scope="col">Details</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.sr || r.parentSr}-${i}`} className={r.indent ? styles.sub : undefined}>
              <th scope="row" data-label="Sr. No." className={styles.sr}>{r.sr || <span className="kd-sr">{r.parentSr}</span>}</th>
              <td data-label="Particulars" className={styles.part}>{r.particular}</td>
              <td data-label="Details">
                {r.details?.filter((d) => d !== '-').length > 0 && (
                  <span className={styles.details}>{r.details.filter((d) => d !== '-').map((d, j) => <span key={j}>{d}</span>)}</span>
                )}
                {r.links?.length ? (
                  <span className={styles.pills}>{r.links.map((l) => <DetailLink key={l.href + l.label} {...l} />)}</span>
                ) : (r.details?.includes('-') && <span className={styles.mono}>—</span>)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </InvestorSubPageLayout>
  );
}
