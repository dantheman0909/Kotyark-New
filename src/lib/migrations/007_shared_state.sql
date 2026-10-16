-- 007_shared_state: state shared across Autoscale instances. Idempotent.
-- kv_cache: second-level cache (e.g. the NSE quote) so a cold-woken instance does not start empty.
CREATE TABLE IF NOT EXISTS kv_cache (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- rate_hits: one row per rate-limited request; key holds a hash, never a raw IP.
CREATE TABLE IF NOT EXISTS rate_hits (
  key text NOT NULL,
  at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rate_hits_key_at_idx ON rate_hits(key, at);
CREATE INDEX IF NOT EXISTS rate_hits_at_idx ON rate_hits(at);   -- bounded global prune of old rows
