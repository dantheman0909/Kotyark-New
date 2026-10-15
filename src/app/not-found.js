import Link from 'next/link';
import styles from './search/search.module.css';

export const metadata = {
  title: 'Page not found',
  description: 'The page you are looking for could not be found.',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Page not found</h1>
          <p>The page you are looking for may have moved or no longer exists. Try searching, or use one of the links below.</p>
          <form className={styles.heroForm} action="/search" method="get" role="search">
            <input className={styles.input} type="search" name="q" maxLength={200} aria-label="Search the site"
              placeholder="Search the site..." autoComplete="off" />
            <button type="submit" className="btn btn-primary">Search</button>
          </form>
        </div>
      </section>
      <section className="section">
        <div className="container-narrow">
          <div className={styles.links}>
            <Link href="/" className="btn btn-primary">Home</Link>
            <Link href="/products" className="btn btn-secondary">Products</Link>
            <Link href="/investors" className="btn btn-secondary">Investor Relations</Link>
            <Link href="/contact" className="btn btn-secondary">Contact</Link>
          </div>
        </div>
      </section>
    </>
  );
}
