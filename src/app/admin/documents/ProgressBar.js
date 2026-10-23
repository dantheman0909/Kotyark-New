'use client';
import s from './documents.module.css';

/** Accessible progress bar. `percent` 0-100; `label` is the visible text (also the aria-label). */
export default function ProgressBar({ percent, label }) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className={s.progress}>
      <div className={s.progressTrack} role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className={s.progressFill} style={{ width: `${p}%` }} />
      </div>
      <div className={s.progressLabel}>{label}</div>
    </div>
  );
}
