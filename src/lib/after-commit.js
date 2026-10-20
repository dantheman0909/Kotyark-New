// Dependency-free so it can be unit-tested with plain node.
/**
 * A step after the database write has committed (audit, revalidate, IndexNow). It must never fail the request or
 * trigger cleanup of the committed document's file: a failure is logged and the request still succeeds.
 */
export async function afterCommit(label, fn) {
  try { await fn(); } catch (e) { console.error(`[after-commit] ${label} failed: ${e?.message || e}`); }
}
