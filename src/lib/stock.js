// Share-price data for NSE: KOTYARK. Server-only.
// CONTRACT (consumed by Navbar, Home and Investors). The exported shapes must not change.
//
// Quote: { symbol: 'NSE: KOTYARK', name, currency: 'INR', price, change, changePct, prevClose,
//          dayLow, dayHigh, low52, high52, asOf: ISO string, source: 'live' | 'manual' }
// History: { range: '1M'|'6M'|'1Y'|'ALL', points: [{ t: epoch ms, c: close }] }  (points may be [])
//
// Live source: Yahoo Finance's keyless chart endpoint (fixed host, symbol and ranges; nothing from
// user input reaches the URL). Any failure returns the admin fallback (the `stock_quote` site setting
// merged over MANUAL_QUOTE, source 'manual'). getQuote/getHistory never throw.
import { getSetting } from './site';

export const STOCK_SYMBOL = 'NSE: KOTYARK';

// Last known figures supplied by the company (used when the live feed is unavailable).
export const MANUAL_QUOTE = {
  symbol: STOCK_SYMBOL, name: 'Kotyark Industries Ltd', currency: 'INR',
  price: 31.5, change: -0.68, changePct: -2.11, prevClose: 32.18,
  dayLow: null, dayHigh: null, low52: null, high52: null,
  asOf: '2026-10-16T10:00:00.000Z', source: 'manual',
};

/** Accepted `range` values and the Yahoo parameters behind each. */
export const STOCK_RANGES = {
  '1M': { range: '1mo', interval: '1d' },
  '6M': { range: '6mo', interval: '1d' },
  '1Y': { range: '1y', interval: '1d' },
  ALL: { range: 'max', interval: '1wk' },
};

// Test-only base URL override (never honoured on a Replit deployment), so a hung or dead feed can be simulated.
const YAHOO_HOST = (!process.env.REPLIT_DEPLOYMENT && process.env.STOCK_YAHOO_URL) || 'https://query1.finance.yahoo.com/v8/finance/chart/KOTYARK.NS';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const QUOTE_TTL = 60_000;
const HISTORY_TTL = 30 * 60_000;
const FAIL_BACKOFF = 30_000;     // after a failed live fetch, do not hit Yahoo again for 30 s
const FETCH_TIMEOUT = 4_000;
const LAST_GOOD_MAX = 15 * 60_000; // a live quote this old is still served after failures; beyond it, manual
const COLD_WAIT = 1_500;           // a cold-cache caller never waits longer than this for the feed
const MANUAL_TTL = 60_000;
const SETTING_TIMEOUT = 1_500;
const IST_MS = 5.5 * 3600_000;

const cache = (globalThis.__kotyarkStock2 ||= { quote: null, quoteAt: 0, failAt: 0, history: new Map(), inflight: new Map(), lastLog: 0, manual: null, manualAt: 0 });

function logOnce(msg) {
  const now = Date.now();
  if (now - cache.lastLog < 60_000) return;
  cache.lastLog = now;
  console.error(`[stock] ${msg}`);
}

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const round2 = (v) => Math.round(v * 100) / 100;
const istDay = (sec) => Math.floor((sec * 1000 + IST_MS) / 86_400_000);

async function fetchChart(range, interval) {
  const res = await fetch(`${YAHOO_HOST}?range=${range}&interval=${interval}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });
  if (!res.ok) throw new Error(`Yahoo responded ${res.status}`);
  const json = await res.json();
  const r = json?.chart?.result?.[0];
  if (!r?.meta) throw new Error('Yahoo returned no chart result');
  return r;
}

/** De-duplicate concurrent identical work. */
function once(key, fn) {
  if (cache.inflight.has(key)) return cache.inflight.get(key);
  const p = Promise.resolve().then(fn).finally(() => cache.inflight.delete(key));
  cache.inflight.set(key, p);
  return p;
}

function closes(r) {
  const ts = r.timestamp || [];
  const cl = r.indicators?.quote?.[0]?.close || [];
  const out = [];
  for (let i = 0; i < ts.length; i++) {
    const c = num(cl[i]);
    if (c !== null && c > 0 && Number.isFinite(ts[i])) out.push({ sec: ts[i], c });
  }
  return out;
}

async function fetchLiveQuote() {
  const r = await fetchChart('5d', '1d');
  const m = r.meta;
  const price = num(m.regularMarketPrice);
  const when = num(m.regularMarketTime);
  if (price === null || price <= 0 || price > 1_000_000 || when === null) throw new Error('Yahoo returned an unusable price');
  // Previous close = the last close of an earlier trading day (IST), matching what NSE prints.
  const today = istDay(when);
  const prior = closes(r).filter((p) => istDay(p.sec) < today);
  let prevClose = prior.length ? prior[prior.length - 1].c : null;
  if (prevClose === null && num(m.fulldayChange) !== null) prevClose = price - m.fulldayChange;
  if (prevClose === null || prevClose <= 0) throw new Error('Could not determine previous close');
  const change = round2(price - prevClose);
  const changePct = Math.round(((price - prevClose) / prevClose) * 10000) / 100;
  if (Math.abs(changePct) > 60) throw new Error(`Implausible day change ${changePct}%`);
  return {
    ...MANUAL_QUOTE,
    name: m.longName ? String(m.longName).replace(/\bLimited\b/, 'Ltd') : MANUAL_QUOTE.name,
    price: round2(price), change, changePct, prevClose: round2(prevClose),
    dayLow: num(m.regularMarketDayLow), dayHigh: num(m.regularMarketDayHigh),
    low52: num(m.fiftyTwoWeekLow), high52: num(m.fiftyTwoWeekHigh),
    asOf: new Date(when * 1000).toISOString(), source: 'live',
  };
}

/** Admin fallback: `stock_quote` setting over MANUAL_QUOTE. A DB outage just means MANUAL_QUOTE. Cached for 60 s. */
async function readManual() {
  let merged = { ...MANUAL_QUOTE };
  try {
    const timeout = new Promise((_, rej) => { setTimeout(() => rej(new Error('settings timeout')), SETTING_TIMEOUT).unref?.(); });
    const s = await Promise.race([getSetting('stock_quote', null), timeout]);
    if (s && typeof s === 'object') {
      // Once the admin has saved the setting it is the whole truth: a blank field is shown as blank,
      // never filled from the built-in MANUAL_QUOTE (which would mix two different days' figures).
      const val = (k) => { if (s[k] === '' || s[k] === null || s[k] === undefined) return null; const n = Number(s[k]); return Number.isFinite(n) ? n : null; };
      merged = { ...merged, price: val('price'), prevClose: val('prevClose'), dayLow: val('dayLow'), dayHigh: val('dayHigh'), low52: val('low52'), high52: val('high52') };
      if (merged.price !== null && merged.prevClose) {
        // Derived, so the change and % can never disagree with the price shown beside them.
        merged.change = round2(merged.price - merged.prevClose);
        merged.changePct = Math.round(((merged.price - merged.prevClose) / merged.prevClose) * 10000) / 100;
      } else {
        merged.change = val('change');
        merged.changePct = val('changePct');
      }
      if (merged.price === null) merged = { ...MANUAL_QUOTE }; // a setting without a price is unusable
      const t = s.asOf ? new Date(s.asOf) : null;
      if (t && !Number.isNaN(t.getTime())) merged.asOf = t.toISOString();
    }
  } catch (e) { logOnce(`fallback setting unavailable: ${e.message}`); }
  return { ...merged, source: 'manual' };
}

async function manualQuote() {
  if (cache.manual && Date.now() - cache.manualAt < MANUAL_TTL) return { ...cache.manual };
  const v = await once('manual', readManual);
  cache.manual = v; cache.manualAt = Date.now();
  return { ...v };
}

/** Call after the admin saves the `stock_quote` setting so the change shows at once. */
export function resetManualQuoteCache() { cache.manual = null; cache.manualAt = 0; }

/** Resolve with `fallback()` if `p` has not settled within `ms`; `p` keeps running either way (it must not reject). */
function raceWithin(p, ms, fallback) {
  let t;
  const timer = new Promise((resolve) => { t = setTimeout(() => resolve(fallback()), ms); t.unref?.(); });
  return Promise.race([p, timer]).finally(() => clearTimeout(t));
}

/** Refresh the live quote (de-duplicated). Never rejects. Resolves to the quote, or null on failure/backoff. */
function refreshQuote() {
  if (!cache.inflight.has('quote') && Date.now() - cache.failAt < FAIL_BACKOFF) return Promise.resolve(null);
  return once('quote', async () => {
    try {
      const q = await fetchLiveQuote();
      cache.quote = q; cache.quoteAt = Date.now();
      return q;
    } catch (e) {
      cache.failAt = Date.now();
      logOnce(`live quote failed: ${e.message}`);
      return null;
    }
  });
}

/**
 * Stale-while-revalidate: anything cached is returned at once (the last good live quote is kept for up to 15 minutes
 * of failures); a stale entry refreshes in the background. Only a cold cache waits, and for at most ~1.5 s.
 * @returns {Promise<object>} never throws
 */
export async function getQuote() {
  try {
    const now = Date.now();
    const age = now - cache.quoteAt;
    if (cache.quote && age < LAST_GOOD_MAX) {
      if (age >= QUOTE_TTL) refreshQuote(); // background; result lands in the cache
      return { ...cache.quote };
    }
    const q = await raceWithin(refreshQuote(), COLD_WAIT, () => null);
    if (q) return { ...q };
  } catch (e) { logOnce(`quote error: ${e.message}`); }
  return manualQuote();
}

async function fetchHistory(range) {
  const spec = STOCK_RANGES[range];
  const r = await fetchChart(spec.range, spec.interval);
  const points = closes(r).map((p) => ({ t: p.sec * 1000, c: round2(p.c) }));
  if (points.length < 2) throw new Error(`Yahoo returned ${points.length} history point(s) for ${range}`);
  return { range, points };
}

function refreshHistory(key) {
  return once(`history:${key}`, async () => {
    const prev = cache.history.get(key);
    try {
      const value = await fetchHistory(key);
      cache.history.set(key, { value, at: Date.now(), failAt: 0 });
      return value;
    } catch (e) {
      logOnce(`history ${key} failed: ${e.message}`);
      // Keep the last good series if we have one; otherwise an empty one (never a fake line).
      cache.history.set(key, { value: prev?.value || { range: key, points: [] }, at: prev ? prev.at : 0, failAt: Date.now(), empty: !prev?.value?.points?.length });
      return null;
    }
  });
}

/** Stale-while-revalidate like getQuote. @returns {Promise<{range:string, points:{t:number,c:number}[]}>} never throws */
export async function getHistory(range = '1Y') {
  const key = Object.hasOwn(STOCK_RANGES, range) ? range : '1Y';
  const empty = { range: key, points: [] };
  try {
    const hit = cache.history.get(key);
    const now = Date.now();
    if (hit && hit.value.points.length) {
      if (now - hit.at >= HISTORY_TTL && now - hit.failAt >= FAIL_BACKOFF) refreshHistory(key); // background
      return hit.value;
    }
    if (hit && now - hit.failAt < FAIL_BACKOFF) return hit.value; // recently failed and nothing good to show
    const v = await raceWithin(refreshHistory(key), COLD_WAIT, () => null);
    return v || empty; // on timeout the fetch finishes in the background and fills the cache
  } catch (e) {
    logOnce(`history error: ${e.message}`);
    return empty;
  }
}
