'use client';
import { useEffect, useRef, useState } from 'react';

// CONTRACT: useStockQuote(initialQuote) -> { quote, flash }  (flash: 1 up, -1 down, 0 none)
// Polls GET /api/stock every 60 s while the tab is visible (one shared poller per tab). Never fakes movement: flash is set for
// 700 ms only when a real refresh returns a different price than the one on screen.
const POLL_MS = 60_000;
const FLASH_MS = 700;

// One poller per tab, shared by every useStockQuote() subscriber (Navbar + SharePriceCard): a tab makes one
// /api/stock request per minute however many components show the price. Starts on the first subscriber, stops on the last.
const store = { subs: new Set(), timer: null, ctrl: null, latest: null, lastAt: 0, onVisible: null };

async function refresh() {
  store.ctrl?.abort();
  const ctrl = (store.ctrl = new AbortController());
  try {
    // 1M keeps the response small; the quote part is identical for every range.
    const res = await fetch('/api/stock?range=1M', { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return;
    const { quote: q } = await res.json();
    if (ctrl.signal.aborted || !q || !Number.isFinite(q.price)) return;
    store.latest = q; store.lastAt = Date.now();
    store.subs.forEach((fn) => fn(q));
  } catch { /* aborted or offline: keep what is on screen */ }
}

function subscribe(fn) {
  store.subs.add(fn);
  if (store.subs.size === 1) {
    store.timer = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, POLL_MS);
    store.onVisible = () => { if (document.visibilityState === 'visible' && Date.now() - store.lastAt >= POLL_MS) refresh(); };
    store.lastAt = Date.now(); // the server render just supplied a fresh quote
    document.addEventListener('visibilitychange', store.onVisible);
  } else if (store.latest) {
    fn(store.latest);
  }
  return () => {
    store.subs.delete(fn);
    if (store.subs.size === 0) {
      clearInterval(store.timer); store.timer = null;
      document.removeEventListener('visibilitychange', store.onVisible);
      store.ctrl?.abort();
    }
  };
}

export function useStockQuote(initial) {
  const [quote, setQuote] = useState(initial || null);
  const [flash, setFlash] = useState(0);
  const priceRef = useRef(initial?.price ?? null);
  const sourceRef = useRef(initial?.source ?? null);
  const flashTimer = useRef(null);

  useEffect(() => {
    const onQuote = (q) => {
      const prev = priceRef.current;
      const real = q.source === 'live' && sourceRef.current === 'live';
      if (real && prev !== null && q.price !== prev) {
        setFlash(q.price > prev ? 1 : -1);
        clearTimeout(flashTimer.current);
        flashTimer.current = setTimeout(() => setFlash(0), FLASH_MS);
      }
      priceRef.current = q.price; sourceRef.current = q.source;
      setQuote(q);
    };
    const unsub = subscribe(onQuote);
    return () => { unsub(); clearTimeout(flashTimer.current); };
  }, []);

  return { quote, flash };
}

const f2 = (v) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Display strings, formatted exactly as the design (₹1,248.60 / −0.68 / ▼ 2.11%). */
export function formatQuote(q) {
  if (!q || !Number.isFinite(q.price)) return null;
  const up = (q.change ?? 0) >= 0;
  const hasChg = Number.isFinite(q.change);
  const hasPct = Number.isFinite(q.changePct);
  return {
    up,
    priceStr: f2(q.price),
    // Unknown change or % renders as an empty string, never as a made-up 0.00.
    chgStr: hasChg ? (up ? '+' : '−') + f2(Math.abs(q.change)) : '',
    pctStr: hasPct ? (up ? '▲ ' : '▼ ') + Math.abs(q.changePct).toFixed(2) + '%' : '',
    chgColor: up ? '#5FD1A6' : '#FF7A6B',
  };
}
