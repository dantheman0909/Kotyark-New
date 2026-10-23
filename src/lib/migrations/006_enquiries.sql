-- 006_enquiries: contact-form submissions and the admin inbox. Idempotent.
CREATE TABLE IF NOT EXISTS enquiries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject      text NOT NULL,
  name         text NOT NULL,
  email        text NOT NULL,
  phone        text,
  company      text,
  volume       text,
  message      text NOT NULL,
  status       text NOT NULL DEFAULT 'new' CHECK (status IN ('new','handled','spam')),
  ip_hash      text,                 -- sha256(ip + pepper); the raw IP is never stored
  user_agent   text,
  source_path  text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  handled_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  handled_at   timestamptz,
  note         text NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS enquiries_status_created_idx ON enquiries(status, created_at DESC);
CREATE INDEX IF NOT EXISTS enquiries_created_idx ON enquiries(created_at DESC);
