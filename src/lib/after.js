// Best-effort work after the response. Next's `after()` runs the callback once the response has been sent, but on
// `next start` the process is not held open for it, and on Replit Autoscale CPU is only allocated while a request is
// served, so it can be frozen or cut short. Use it only for work that is fine to lose (cache refreshes); anything that
// must complete (IndexNow, cold-path cache writes) is awaited inside the request instead.
// Outside a request scope (scripts, tests, module load) `after` throws, so we fall back to fire-and-forget.
// Never call `after` at module scope.
import { after } from 'next/server';

/** @param {() => (void|Promise<void>)} fn  Errors are swallowed (logged to stderr); never throws. */
export function runAfter(fn) {
  const run = async () => { try { await fn(); } catch (e) { console.error(`[after] ${e?.message || e}`); } };
  try {
    after(run);
  } catch {
    run();
  }
}
