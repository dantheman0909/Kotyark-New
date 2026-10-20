-- Chunked document uploads: one row per in-progress upload. Parts live in storage under tmp/uploads/<id>/<n>.
-- `completing` is set while a request is turning the parts into a document (atomic claim; a claim older than
-- 15 minutes is treated as stale and may be reclaimed).
CREATE TABLE IF NOT EXISTS upload_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename    text NOT NULL,
  size        bigint NOT NULL,
  parts       int NOT NULL,
  received    int[] NOT NULL DEFAULT '{}',
  mime        text,            -- detected from part 0 when it is received
  completing  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS upload_sessions_created_idx ON upload_sessions (created_at);
CREATE INDEX IF NOT EXISTS upload_sessions_user_idx ON upload_sessions (user_id);
