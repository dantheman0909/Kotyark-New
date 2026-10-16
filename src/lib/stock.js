// Share-price data for NSE: KOTYARK. Server-only.
// CONTRACT (consumed by Navbar, Home and Investors). Builder B replaces the body with the
// live Yahoo Finance implementation; the exported shapes must not change.
//
// Quote: { symbol: 'NSE: KOTYARK', name, currency: 'INR', price, change, changePct, prevClose,
//          dayLow, dayHigh, low52, high52, asOf: ISO string, source: 'live' | 'manual' }
// History: { range: '1M'|'6M'|'1Y'|'ALL', points: [{ t: epoch ms, c: close }] }  (points may be [])

export const STOCK_SYMBOL = 'NSE: KOTYARK';

// Last known figures supplied by the company (used when the live feed is unavailable).
export const MANUAL_QUOTE = {
  symbol: STOCK_SYMBOL, name: 'Kotyark Industries Ltd', currency: 'INR',
  price: 31.5, change: -0.68, changePct: -2.11, prevClose: 32.18,
  dayLow: null, dayHigh: null, low52: null, high52: null,
  asOf: '2026-10-16T10:00:00.000Z', source: 'manual',
};

/** @returns {Promise<object>} never throws */
export async function getQuote() {
  return { ...MANUAL_QUOTE };
}

/** @returns {Promise<{range:string, points:{t:number,c:number}[]}>} never throws */
export async function getHistory(range = '1Y') {
  return { range, points: [] };
}
