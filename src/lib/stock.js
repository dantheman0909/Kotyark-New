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
//
// Two cache levels: per-process memory, then the `kv_cache` table. On Replit Autoscale an instance wakes from zero with
// an empty memory, so a successful live refresh is also written to kv_cache and a memory miss reads it back (one
// indexed row, bounded by KV_READ_TIMEOUT). Every DB access is guarded. A cold path awaits its kv write inside its
// deadline; stale-hit refreshes go through runAfter, which is best effort after the response (Autoscale only allocates
// CPU during requests). Worst-case cold getQuote is about COLD_DEADLINE (3 s).
import { getSetting } from './site';
import { query } from './db';
import { runAfter } from './after';

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
const KV_QUOTE = 'stock:quote';
// Cold-path budget for getQuote: kv read <= KV_READ_TIMEOUT, live wait <= COLD_WAIT, then the manual setting read gets the
// rest of COLD_DEADLINE (at least MANUAL_MIN), so the worst case is about 3 s however slow the DB or the feed is.
const KV_READ_TIMEOUT = 800;
const KV_WRITE_TIMEOUT = 1_000;
const COLD_DEADLINE = 3_000;
const MANUAL_MIN = 700;
const KV_MISS_BACKOFF = 30_000;    // after a kv_cache miss or error, do not read it again for 30 s

const cache = (globalThis.__kotyarkStock2 ||= {});
// Default every field, so a cache object created by an older module version (dev hot-reload) never lacks one.
for (const [k, v] of Object.entries({ quote: null, quoteAt: 0, failAt: 0, history: new Map(), inflight: new Map(), lastLog: 0, manual: null, manualAt: 0, kvMissAt: 0, kvMiss: new Map() })) {
  if (cache[k] === undefined) cache[k] = v;
}

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

// ---- kv_cache (second level). All guarded: a DB problem is just a miss. ----
const isTime = (v) => typeof v === 'string' && !Number.isNaN(new Date(v).getTime());
const fin = (v) => typeof v === 'number' && Number.isFinite(v);

/** Rebuild a quote from untrusted JSON, or null if it does not look like a live quote. */
function validQuote(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  if (!fin(v.price) || v.price <= 0 || v.price > 1_000_000) return null;
  if (!fin(v.prevClose) || v.prevClose <= 0) return null;
  if (!isTime(v.asOf)) return null;
  const opt = (x) => (x === null || x === undefined ? null : fin(x) ? x : undefined);
  const change = round2(v.price - v.prevClose);
  const changePct = Math.round(((v.price - v.prevClose) / v.prevClose) * 10000) / 100;
  if (Math.abs(changePct) > 60) return null; // same bound as the live path
  const o = { dayLow: opt(v.dayLow), dayHigh: opt(v.dayHigh), low52: opt(v.low52), high52: opt(v.high52) };
  if (Object.values(o).some((x) => x === undefined)) return null;
  return {
    ...MANUAL_QUOTE,
    name: typeof v.name === 'string' && v.name ? v.name.slice(0, 120) : MANUAL_QUOTE.name,
    price: v.price, change, changePct, prevClose: v.prevClose, ...o,
    asOf: new Date(v.asOf).toISOString(), source: 'live',
  };
}

/** Rebuild a history series from untrusted JSON, or null. */
function validHistory(v, range) {
  if (!v || typeof v !== 'object' || v.range !== range || !Array.isArray(v.points) || v.points.length < 2) return null;
  const points = [];
  for (const p of v.points) {
    if (!p || !fin(p.t) || !fin(p.c) || p.c <= 0) return null;
    points.push({ t: p.t, c: p.c });
  }
  return { range, points };
}

function withTimeout(p, ms) {
  let t;
  const timer = new Promise((_, rej) => { t = setTimeout(() => rej(new Error('kv_cache timeout')), ms); t.unref?.(); });
  return Promise.race([p, timer]).finally(() => clearTimeout(t));
}

/** One read per key at a time. @returns {Promise<{value: any, ageMs: number}|null>} never rejects */
function kvGet(key) {
  return once(`kv:${key}`, async () => {
    try {
      const rows = await withTimeout(query(
        `SELECT value, (extract(epoch FROM (now() - updated_at)) * 1000)::float8 AS age_ms FROM kv_cache WHERE key = $1`, [key]), KV_READ_TIMEOUT);
      const r = rows[0];
      if (!r || !fin(r.age_ms)) return null;
      return { value: r.value, ageMs: Math.max(0, r.age_ms) };
    } catch (e) { logOnce(`kv_cache read failed: ${e.message}`); return null; }
  });
}

/** Upsert. The row's updated_at is backdated by the value's local age (now - fetchedAt), so readers measure age from
 *  when the value was fetched, not from when a slow write landed. Never rejects. */
async function kvSet(key, value, fetchedAt) {
  try {
    const ageSec = Math.max(0, (Date.now() - fetchedAt) / 1000);
    await withTimeout(query(
      `INSERT INTO kv_cache(key, value, updated_at) VALUES ($1, $2::jsonb, now() - make_interval(secs => $3))
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
      [key, JSON.stringify(value), ageSec]), KV_WRITE_TIMEOUT);
  } catch (e) { logOnce(`kv_cache write failed: ${e.message}`); }
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
async function readManual(timeoutMs = SETTING_TIMEOUT) {
  let merged = { ...MANUAL_QUOTE };
  try {
    const timeout = new Promise((_, rej) => { setTimeout(() => rej(new Error('settings timeout')), timeoutMs).unref?.(); });
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
  } catch (e) { logOnce(`fallback setting unavailable: ${e.message}`); return { ...merged, source: 'manual', settingsTimedOut: true }; }
  return { ...merged, source: 'manual' };
}

async function manualQuote(timeoutMs = SETTING_TIMEOUT) {
  if (cache.manual && Date.now() - cache.manualAt < (cache.manualTtl ?? MANUAL_TTL)) return { ...cache.manual };
  // A caller joining a read started by someone else is still bounded by its own budget.
  const v = await raceWithin(once('manual', () => readManual(timeoutMs)), timeoutMs, () => ({ ...MANUAL_QUOTE, source: 'manual', degraded: true }));
  const { degraded, settingsTimedOut, ...out } = v; // internal flags never leave this function (or enter the cache)
  if (!degraded) {
    cache.manual = out; cache.manualAt = Date.now();
    // A read that fell back because the settings query timed out is only kept briefly, so the admin's figures return soon.
    cache.manualTtl = settingsTimedOut ? 5_000 : MANUAL_TTL;
  }
  return { ...out };
}

/** Call after the admin saves the `stock_quote` setting so the change shows at once. */
export function resetManualQuoteCache() { cache.manual = null; cache.manualAt = 0; cache.manualTtl = MANUAL_TTL; }

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
      const fetchedAt = Date.now();
      cache.quote = q; cache.quoteAt = fetchedAt;
      await kvSet(KV_QUOTE, q, fetchedAt); // inside the caller's deadline; a cold wake's next instance then reads it
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
  const t0 = Date.now();
  try {
    const age = t0 - cache.quoteAt;
    if (cache.quote && age < LAST_GOOD_MAX) {
      if (age >= QUOTE_TTL) runAfter(() => refreshQuote()); // best effort, after the response; result lands in the cache
      return { ...cache.quote };
    }
    // Memory miss: the shared DB copy (written by whichever instance last refreshed) is served at once.
    if (t0 - cache.kvMissAt >= KV_MISS_BACKOFF) {
      const row = await kvGet(KV_QUOTE);
      const kq = row && row.ageMs < LAST_GOOD_MAX ? validQuote(row.value) : null;
      if (kq) {
        cache.quote = kq; cache.quoteAt = Date.now() - row.ageMs;
        if (row.ageMs >= QUOTE_TTL) runAfter(() => refreshQuote());
        return { ...kq };
      }
      cache.kvMissAt = Date.now();
    }
    const started = Date.now();
    const pending = refreshQuote();
    runAfter(() => pending); // best effort: keeps a slow feed's result landing if the runtime allows
    const q = await raceWithin(pending, Math.min(COLD_WAIT, Math.max(0, COLD_DEADLINE - MANUAL_MIN - (started - t0))), () => null);
    if (q) return { ...q };
    // The live fetch may have landed in memory while its kv write was still in flight.
    if (cache.quote && cache.quoteAt >= started) return { ...cache.quote };
  } catch (e) { logOnce(`quote error: ${e.message}`); }
  return manualQuote(Math.max(MANUAL_MIN, COLD_DEADLINE - (Date.now() - t0)));
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
      const fetchedAt = Date.now();
      cache.history.set(key, { value, at: fetchedAt, failAt: 0 });
      await kvSet(`stock:history:${key}`, value, fetchedAt);
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
      if (now - hit.at >= HISTORY_TTL && now - hit.failAt >= FAIL_BACKOFF) runAfter(() => refreshHistory(key)); // background
      return hit.value;
    }
    if (hit && now - hit.failAt < FAIL_BACKOFF) return hit.value; // recently failed and nothing good to show
    // Memory miss: any-age DB copy beats an empty chart; a stale one refreshes in the background.
    if (now - (cache.kvMiss.get(key) || 0) >= KV_MISS_BACKOFF) {
      const row = await kvGet(`stock:history:${key}`);
      const kh = row ? validHistory(row.value, key) : null;
      if (kh) {
        cache.history.set(key, { value: kh, at: Date.now() - row.ageMs, failAt: 0 });
        if (row.ageMs >= HISTORY_TTL) runAfter(() => refreshHistory(key));
        return kh;
      }
      cache.kvMiss.set(key, Date.now());
    }
    const pending = refreshHistory(key);
    runAfter(() => pending);
    const v = await raceWithin(pending, COLD_WAIT, () => null);
    if (v) return v;
    const h2 = cache.history.get(key);
    return h2 && h2.value.points.length ? h2.value : empty; // on timeout the fetch finishes in the background
  } catch (e) {
    logOnce(`history error: ${e.message}`);
    return empty;
  }
}
