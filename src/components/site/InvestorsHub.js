'use client';
// Disclosure library: every row is a real server-rendered link; chips and search only hide rows client-side.
// Props: { folders: [{ slug, name, description, category, count }] }
import { useState } from 'react';
import Link from 'next/link';
import styles from './InvestorsHub.module.css';

export const HUB_CATEGORIES = ['All', 'Regulatory', 'Financial', 'Governance', 'Other'];

export default function InvestorsHub({ folders }) {
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const shown = folders.filter((f) => (cat === 'All' || f.category === cat)
    && (!needle || `${f.name} ${f.description}`.toLowerCase().includes(needle)));

  return (
    <section className={`kd-light kd-sec-b ${styles.root}`} data-screen-label="Investors — Filings" id="disclosures">
      <div className="kd-wrap">
        <div className={styles.head}>
          <h2 className={`kd-h2-b ${styles.hd}`} data-reveal="1">Disclosure library</h2>
          <input className="kd-search" type="search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search filings" aria-label="Search filings" />
        </div>
        <div className={styles.chips} role="group" aria-label="Filter by category">
          {HUB_CATEGORIES.map((c) => (
            <button key={c} type="button" className="kd-chip" aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        <div className={styles.list}>
          {shown.map((f) => (
            <Link key={f.slug} href={`/investors/${f.slug}`} className={styles.row}>
              <span className={styles.cat}>{f.category}</span>
              <span>
                <span className={styles.t}>{f.name}</span>
                <span className={styles.d}>{f.description}</span>
              </span>
              <span className={styles.end}>
                <span className={styles.n}>{f.count} {f.count === 1 ? 'doc' : 'docs'}</span>
                <span className={styles.arrow} aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
          {shown.length === 0 && <div className={styles.none}>{needle ? <>No filings match “{q}”.</> : 'No filings in this category.'}</div>}
        </div>
        <p className="kd-sr" role="status" aria-live="polite">{shown.length} {shown.length === 1 ? 'section' : 'sections'} shown</p>
      </div>
    </section>
  );
}
