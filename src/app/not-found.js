import Link from 'next/link';
import prim from '@/components/site/prim.module.css';
import styles from './search/search.module.css';

export const metadata = {
  title: 'Page not found',
  description: 'The page you are looking for could not be found.',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <section className={`kd-dark kd-hero-pad ${styles.hero} ${prim.root}`} aria-labelledby="nf-title">
        <div className="kd-wrap">
          <div className={`kd-eyebrow ${prim.eb}`}>Error 404</div>
          <h1 id="nf-title" className={`kd-h1 ${prim.hd}`}>Page not found</h1>
          <p className={styles.heroLead}>The page you are looking for may have moved or no longer exists. Try searching, or use one of the links below.</p>
          <form className={styles.heroForm} action="/search" method="get" role="search">
            <label htmlFor="nf-search" className="kd-sr">Search the site</label>
            <input id="nf-search" className={styles.input} type="search" name="q" maxLength={200}
              placeholder="Search the site..." autoComplete="off" />
            <button type="submit" className="kd-btn kd-btn-primary">Search</button>
          </form>
        </div>
      </section>
      <section className={`kd-light ${styles.results} ${prim.root}`} aria-label="Helpful links">
        <div className="kd-wrap-narrow">
          <div className={styles.links}>
            <Link href="/" className={`${styles.pillLink} ${styles.pillLinkPrimary}`}>Home</Link>
            <Link href="/products" className={styles.pillLink}>Products</Link>
            <Link href="/investors" className={styles.pillLink}>Investor Relations</Link>
            <Link href="/contact" className={styles.pillLink}>Contact</Link>
          </div>
        </div>
      </section>
    </>
  );
}
