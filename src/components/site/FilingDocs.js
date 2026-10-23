'use client';
// Document rows for a filing section. The full list is server-rendered; sub-chips and search only hide rows.
// Props: { docs: [{ id, href, when, title, meta, group }], groups: string[] (labels, may be empty) }
import { useState } from 'react';
import Link from 'next/link';
import styles from './FilingDocs.module.css';

export default function FilingDocs({ docs, groups = [] }) {
  const [sub, setSub] = useState('All');
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const shown = docs.filter((d) => (sub === 'All' || d.group === sub) && (!needle || d.title.toLowerCase().includes(needle)));
  const subs = groups.length >= 2 ? ['All', ...groups] : [];

  return (
    <>
      <div className={styles.bar}>
        <div className={styles.chips} role="group" aria-label="Filter by period">
          {subs.map((g) => (
            <button key={g} type="button" className={`kd-chip ${styles.chip}`} aria-pressed={sub === g} onClick={() => setSub(g)}>{g}</button>
          ))}
        </div>
        <input className={styles.search} type="search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search this section" aria-label="Search this section" />
      </div>
      <div className={styles.list}>
        {shown.map((d) => (
          <Link key={d.id} href={d.href} className={styles.row}>
            <span className={styles.when}>{d.when}</span>
            <span className={styles.mid}>
              <span className={styles.title}>{d.title}</span>
              <span className={styles.meta}>{d.meta}</span>
            </span>
            <span className={styles.open}>Open ↗</span>
          </Link>
        ))}
        {shown.length === 0 && (
          <div className={styles.empty}>
            {docs.length === 0 ? (
              <>
                <span className={styles.emptyT}>No documents published here yet.</span>
                <span className={styles.emptyP}>New filings appear on this page as soon as they are published from the investor portal.</span>
              </>
            ) : <span className={styles.emptyT}>No documents match your search.</span>}
          </div>
        )}
      </div>
    </>
  );
}
