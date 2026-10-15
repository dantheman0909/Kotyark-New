-- 002: search and sitemap must see only the PUBLISHED version of a page.
-- pages.title/blocks/seo/search_text are the working (draft) copy; the live copy
-- lives in page_revisions (note 'Published'). These live_* columns mirror the
-- live copy's searchable fields, set on publish and cleared on unpublish.
ALTER TABLE pages ADD COLUMN IF NOT EXISTS live_title text NOT NULL DEFAULT '';
ALTER TABLE pages ADD COLUMN IF NOT EXISTS live_search_text text NOT NULL DEFAULT '';
ALTER TABLE pages ADD COLUMN IF NOT EXISTS live_seo jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Rebuild the tsvector from the live columns (the old one indexed the draft).
DROP INDEX IF EXISTS pages_tsv_idx;
ALTER TABLE pages DROP COLUMN IF EXISTS search_tsv;
ALTER TABLE pages ADD COLUMN search_tsv tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(live_title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(live_seo->>'metaDescription', '')), 'B') ||
  setweight(to_tsvector('english', coalesce(live_search_text, '')), 'C')) STORED;
CREATE INDEX IF NOT EXISTS pages_tsv_idx ON pages USING gin(search_tsv);

-- Backfill pages that are already published. The LIVE copy is the latest page_revisions row with
-- note 'Published', NOT the working columns (those may hold unpublished draft edits).
-- title and seo come from that snapshot. live_search_text cannot be recomputed from blocks in SQL, so
-- it is copied from pages.search_text only when no draft edit is newer than the snapshot
-- (pages.updated_at <= snapshot.created_at); otherwise it stays '' and is refilled on the next publish.
-- Published pages with no snapshot (set live by a script) fall back to their row columns.
UPDATE pages p SET
  live_title = COALESCE(r.title, p.title),
  live_seo = COALESCE(r.seo, p.seo),
  live_search_text = CASE WHEN r.id IS NULL OR p.updated_at <= r.created_at THEN p.search_text ELSE '' END
  FROM pages p2
  LEFT JOIN LATERAL (
    SELECT id, title, seo, created_at FROM page_revisions
     WHERE page_id = p2.id AND note = 'Published' ORDER BY id DESC LIMIT 1) r ON true
 WHERE p.id = p2.id AND p.status = 'published' AND p.live_title = '';
