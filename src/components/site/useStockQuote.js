'use client';
import { useEffect, useRef, useState } from 'react';

// CONTRACT: useStockQuote(initialQuote) -> { quote, flash }  (flash: 1 up, -1 down, 0 none)
// Builder B implements polling of GET /api/stock every 60 s. Never fakes movement.
export function useStockQuote(initial) {
  const [quote] = useState(initial || null);
  const flash = 0;
  useRef(null);
  useEffect(() => {}, []);
  return { quote, flash };
}

const f2 = (v) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Display strings, formatted exactly as the design (₹1,248.60 / −0.68 / ▼ 2.11%). */
export function formatQuote(q) {
  if (!q || !Number.isFinite(q.price)) return null;
  const up = (q.change ?? 0) >= 0;
  return {
    up,
    priceStr: f2(q.price),
    chgStr: (up ? '+' : '−') + f2(Math.abs(q.change ?? 0)),
    pctStr: (up ? '▲ ' : '▼ ') + Math.abs(q.changePct ?? 0).toFixed(2) + '%',
    chgColor: up ? '#5FD1A6' : '#FF7A6B',
  };
}
