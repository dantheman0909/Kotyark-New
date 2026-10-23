'use client';
// Props: { variant: 'home' | 'ir', initialQuote, initialHistory }
//   initialQuote:   quote object from getQuote() (server-passed)
//   initialHistory: { range: '1Y', points } from getHistory('1Y') (server-passed, avoids layout shift)
import { useEffect, useRef, useState } from 'react';
import { useStockQuote, formatQuote } from './useStockQuote';
import styles from './SharePriceCard.module.css';

const RANGES = ['1M', '6M', '1Y', 'ALL'];
const CIN = 'L15149RJ2023PLC091598';
const f2 = (v) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const IST = 'Asia/Kolkata';

/** Same construction as the design's path(): index-spaced x, min/max scaled y. */
function buildPath(points, W, H, padY) {
  if (!points || points.length < 2) return null;
  const vals = points.map((p) => p.c);
  const mn = Math.min(...vals), mx = Math.max(...vals), rg = mx - mn || 1;
  const d = vals.map((v, i) => `${i ? 'L' : 'M'}${((i / (vals.length - 1)) * W).toFixed(1)},${(padY + (1 - (v - mn) / rg) * (H - padY * 2)).toFixed(1)}`).join('');
  return { d, area: `${d}L${W},${H}L0,${H}Z` };
}

function footerNote(q) {
  const t = q?.asOf ? new Date(q.asOf) : null;
  if (!t || Number.isNaN(t.getTime())) return 'NSE';
  if (q.source === 'live') {
    const s = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: IST }).format(t);
    return `NSE · DELAYED QUOTE VIA YAHOO FINANCE · ${s.replace(',', ',')} IST`;
  }
  const d = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: IST }).format(t);
  return `NSE · LAST UPDATED ${d}`;
}

function Chart({ points, W, H, padY, stroke, label, boxClass, busy }) {
  const p = buildPath(points, W, H, padY);
  return (
    <div className={`${boxClass} ${busy ? styles.busy : ''}`} aria-busy={busy || undefined}>
      {p ? (
        <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label}>
          <path d={p.area} fill="rgba(242,139,48,.10)" />
          <path d={p.d} fill="none" stroke="#F28B30" strokeWidth={stroke} vectorEffect="non-scaling-stroke" />
        </svg>
      ) : (
        <div className={styles.empty} role="note">Price history is temporarily unavailable</div>
      )}
    </div>
  );
}

export default function SharePriceCard({ variant = 'home', initialQuote = null, initialHistory = null }) {
  const { quote, flash } = useStockQuote(initialQuote);
  const fq = formatQuote(quote);
  const priceColor = flash === 1 ? '#5FD1A6' : flash === -1 ? '#FF7A6B' : '#F2EFE6';
  const chgColor = fq ? fq.chgColor : '#9DAEA6';
  const priceStr = fq ? fq.priceStr : '—';

  const [range, setRange] = useState('1Y');
  const [history, setHistory] = useState(initialHistory || { range: '1Y', points: [] });
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef(new Map(initialHistory?.points?.length ? [['1Y', initialHistory]] : []));
  const ctrlRef = useRef(null);
  const seqRef = useRef(0);
  useEffect(() => () => { seqRef.current++; ctrlRef.current?.abort(); }, []); // unmount: drop the in-flight fetch

  // Home: the card is always the 1Y chart. If the server could not supply one, try once on mount.
  // IR: range buttons fetch the chosen range; a successful fetch is kept for the session.
  useEffect(() => {
    if (variant === 'ir' || (initialHistory?.points?.length ?? 0) > 0) return undefined;
    let alive = true;
    fetch('/api/stock?range=1Y').then((r) => (r.ok ? r.json() : null)).then((j) => {
      if (alive && j?.history?.points?.length) { cacheRef.current.set('1Y', j.history); setHistory(j.history); }
    }).catch(() => {});
    return () => { alive = false; };
  }, [variant, initialHistory]);

  const pick = async (r) => {
    // Every pick (cache hit or not) supersedes the previous one: abort its fetch and invalidate its response.
    const seq = ++seqRef.current;
    ctrlRef.current?.abort();
    ctrlRef.current = null;
    setRange(r);
    const hit = cacheRef.current.get(r);
    if (hit) { setHistory(hit); setLoading(false); return; }
    const ctrl = (ctrlRef.current = new AbortController());
    setLoading(true);
    const stale = () => ctrl.signal.aborted || seq !== seqRef.current;
    try {
      const res = await fetch(`/api/stock?range=${r}`, { signal: ctrl.signal });
      const j = res.ok ? await res.json() : null;
      if (stale()) return;
      const h = j?.history && j.history.range === r ? j.history : { range: r, points: [] };
      if (h.points.length) cacheRef.current.set(r, h);
      setHistory(h);
    } catch { if (!stale()) setHistory({ range: r, points: [] }); }
    finally { if (!stale()) setLoading(false); }
  };

  const note = footerNote(quote);

  if (variant === 'home') {
    return (
      <div className={`${styles.card} ${styles.home}`} data-reveal="1">
        <div className={styles.homeHead}>
          <div>
            <div className={styles.label}>NSE · KOTYARK · 1Y</div>
            <div className={styles.homePrice} style={{ color: priceColor }}>₹{priceStr}</div>
          </div>
          {fq && (fq.chgStr || fq.pctStr) && <span className={styles.homeChg} style={{ color: chgColor }}>{[fq.chgStr, fq.pctStr].filter(Boolean).join(' · ')}</span>}
        </div>
        <Chart points={history.points} W={1000} H={260} padY={12} stroke={1.8} label="Kotyark share price, last 12 months" boxClass={styles.homeChart} />
        <div className={styles.homeNote}>{note}</div>
      </div>
    );
  }

  const prev = quote?.prevClose;
  const lo = quote?.dayLow, hi = quote?.dayHigh, l52 = quote?.low52, h52 = quote?.high52;
  const rangeStr = (a, b) => (Number.isFinite(a) && Number.isFinite(b) ? `₹${f2(a)} – ${f2(b)}` : '—');
  const grid = [
    { k: 'Prev. close', v: Number.isFinite(prev) ? `₹${f2(prev)}` : '—' },
    { k: 'Day range', v: rangeStr(lo, hi) },
    { k: '52-week range', v: rangeStr(l52, h52) },
    { k: 'CIN', v: CIN },
  ];

  return (
    <div className={`${styles.card} ${styles.ir}`} data-reveal="1">
      <div className={styles.irHead}>
        <div>
          <div className={styles.label}>Kotyark Industries Ltd · NSE</div>
          <div className={styles.irRow}>
            <span className={styles.irPrice} style={{ color: priceColor }}>₹{priceStr}</span>
            {fq && (fq.chgStr || fq.pctStr) && <span className={styles.irChg} style={{ color: chgColor }}>{fq.chgStr}{fq.pctStr ? (fq.chgStr ? ` (${fq.pctStr})` : fq.pctStr) : ''} today</span>}
          </div>
        </div>
        <div className={styles.ranges} role="group" aria-label="Chart range">
          {RANGES.map((r) => (
            <button key={r} type="button" className={styles.range} aria-pressed={range === r} onClick={() => pick(r)}>{r}</button>
          ))}
        </div>
      </div>
      <Chart points={history.points} W={1000} H={320} padY={14} stroke={2} label={`Kotyark share price, ${range}`} boxClass={styles.irChart} busy={loading} />
      <div className={styles.grid}>
        {grid.map((g) => (
          <div key={g.k}>
            <div className={styles.qLabel}>{g.k}</div>
            <div className={styles.qValue}>{g.v}</div>
          </div>
        ))}
      </div>
      <div className={styles.irNote}>{note}</div>
    </div>
  );
}
