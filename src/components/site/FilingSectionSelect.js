'use client';
// Below 900px the section sidebar becomes this labelled select (navigates on change).
// Props: { sections: [{ slug, name, count }], activeSlug }
import { useRouter } from 'next/navigation';
import styles from '@/components/InvestorSubPageLayout.module.css';

export default function FilingSectionSelect({ sections, activeSlug }) {
  const router = useRouter();
  return (
    <label className={styles.sel}>
      <span className={styles.selLabel}>Section</span>
      <select className={styles.select} value={activeSlug || ''} onChange={(e) => e.target.value && router.push(`/investors/${e.target.value}`)}>
        {!sections.some((s) => s.slug === activeSlug) && <option value="">Choose a section</option>}
        {sections.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
      </select>
    </label>
  );
}
