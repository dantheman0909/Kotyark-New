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

-- Backfill pages that are already published (none exist before the CMS goes live; safe either way).
UPDATE pages SET live_title = title, live_search_text = search_text, live_seo = seo
 WHERE status = 'published' AND live_title = '';
