-- 004_popups: on-brand pop-up builder. Idempotent.
CREATE TABLE IF NOT EXISTS popups (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  status       text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  priority     integer NOT NULL DEFAULT 0,
  content      jsonb NOT NULL DEFAULT '{}'::jsonb,  -- {eyebrow, heading, bodyHtml (sanitized), imageId, imageAlt, imagePosition, primaryCta, secondaryCta, dismissLabel}
  design       jsonb NOT NULL DEFAULT '{}'::jsonb,  -- {preset, layout, position, width, radius, background, text, accent, buttonStyle, overlayOpacity, animation, fontHeading, fontBody}
  custom_css   text  NOT NULL DEFAULT '',           -- raw author input, kept for editing only; never rendered
  scoped_css   text  NOT NULL DEFAULT '',           -- postcss-scoped, sanitized output; the only CSS ever rendered
  rules        jsonb NOT NULL DEFAULT '{}'::jsonb,  -- {trigger, delaySeconds, scrollPercent, includePaths, excludePaths, devices, frequency, frequencyDays, startAt, endAt}
  published_at timestamptz,
  created_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS popups_status_idx ON popups(status, priority DESC);

CREATE TABLE IF NOT EXISTS popup_stats (
  popup_id     uuid NOT NULL REFERENCES popups(id) ON DELETE CASCADE,
  day          date NOT NULL,
  views        integer NOT NULL DEFAULT 0,
  clicks       integer NOT NULL DEFAULT 0,
  dismissals   integer NOT NULL DEFAULT 0,
  PRIMARY KEY (popup_id, day)
);
