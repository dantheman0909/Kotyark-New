-- 001_init: full CMS schema. Idempotent.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  name          text NOT NULL DEFAULT '',
  password_hash text NOT NULL,
  role          text NOT NULL CHECK (role IN ('owner','editor','compliance')),
  active        boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,               -- sha256 hex of the cookie token
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  ip         text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS login_attempts (
  id         bigserial PRIMARY KEY,
  email      text NOT NULL,
  ip         text,
  success    boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS login_attempts_lookup_idx ON login_attempts(email, created_at);
CREATE INDEX IF NOT EXISTS login_attempts_ip_idx ON login_attempts(ip, created_at);

CREATE TABLE IF NOT EXISTS media (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_key text NOT NULL UNIQUE,
  filename    text NOT NULL,
  alt         text NOT NULL DEFAULT '',
  mime        text NOT NULL,
  size        integer NOT NULL DEFAULT 0,
  width       integer,
  height      integer,
  created_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id    uuid REFERENCES pages(id) ON DELETE RESTRICT,
  slug         text NOT NULL,                 -- '' only for the home page
  path         text NOT NULL UNIQUE,          -- materialized: '/', '/about', '/products/biodiesel'
  title        text NOT NULL,
  status       text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  blocks       jsonb NOT NULL DEFAULT '[]'::jsonb,
  seo          jsonb NOT NULL DEFAULT '{}'::jsonb, -- {metaTitle, metaDescription, ogImageId, canonical, noindex}
  show_in_nav  boolean NOT NULL DEFAULT false,
  nav_order    integer NOT NULL DEFAULT 0,
  template     text NOT NULL DEFAULT 'default',
  preview_token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  search_text  text NOT NULL DEFAULT '',      -- plain text flattened from blocks, maintained by app
  search_tsv   tsvector GENERATED ALWAYS AS (
                 setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
                 setweight(to_tsvector('english', coalesce(seo->>'metaDescription','')), 'B') ||
                 setweight(to_tsvector('english', coalesce(search_text,'')), 'C')) STORED,
  published_at timestamptz,
  created_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, slug)
);
CREATE INDEX IF NOT EXISTS pages_parent_idx ON pages(parent_id);
CREATE INDEX IF NOT EXISTS pages_tsv_idx ON pages USING gin(search_tsv);

CREATE TABLE IF NOT EXISTS page_revisions (
  id         bigserial PRIMARY KEY,
  page_id    uuid NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  title      text NOT NULL,
  blocks     jsonb NOT NULL,
  seo        jsonb NOT NULL,
  note       text NOT NULL DEFAULT '',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS page_revisions_page_idx ON page_revisions(page_id, created_at DESC);

CREATE TABLE IF NOT EXISTS document_folders (
  id          text PRIMARY KEY,               -- keeps legacy ids like 'inv-policies'; new ones are uuids as text
  parent_id   text REFERENCES document_folders(id) ON DELETE RESTRICT,
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  intro_html  text NOT NULL DEFAULT '',       -- sanitized
  group_by    text NOT NULL DEFAULT 'none' CHECK (group_by IN ('none','fy','year')),
  visible     boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  seo         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id       text NOT NULL REFERENCES document_folders(id) ON DELETE RESTRICT,
  title           text NOT NULL,
  slug            text NOT NULL UNIQUE,        -- public: /files/<slug>.pdf and /investors/<folder>/<slug>
  description     text NOT NULL DEFAULT '',
  storage_key     text,                        -- set when the file lives in our storage
  external_url    text,                        -- legacy Wix URL (kept for redirects / fallback)
  original_name   text,
  mime            text NOT NULL DEFAULT 'application/pdf',
  size            integer NOT NULL DEFAULT 0,
  fy              text,                        -- 'FY 2024-25'
  doc_date        date,
  extracted_text  text NOT NULL DEFAULT '',
  search_tsv      tsvector GENERATED ALWAYS AS (
                    setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
                    setweight(to_tsvector('english', coalesce(description,'')), 'B') ||
                    setweight(to_tsvector('english', left(coalesce(extracted_text,''), 500000)), 'C')) STORED,
  status          text NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published')),
  sort_order      integer NOT NULL DEFAULT 0,
  link_status     text NOT NULL DEFAULT 'unchecked' CHECK (link_status IN ('unchecked','ok','broken','error','n/a')),
  link_http_code  integer,
  link_checked_at timestamptz,
  created_by      uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by      uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (storage_key IS NOT NULL OR external_url IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS documents_folder_idx ON documents(folder_id, sort_order, doc_date DESC);
CREATE INDEX IF NOT EXISTS documents_tsv_idx ON documents USING gin(search_tsv);
CREATE UNIQUE INDEX IF NOT EXISTS documents_folder_external_uq ON documents(folder_id, external_url) WHERE external_url IS NOT NULL;

CREATE TABLE IF NOT EXISTS nav_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu       text NOT NULL CHECK (menu IN ('header','footer')),
  label      text NOT NULL,
  page_id    uuid REFERENCES pages(id) ON DELETE CASCADE,
  url        text,
  parent_id  uuid REFERENCES nav_items(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  CHECK (page_id IS NOT NULL OR url IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS nav_items_menu_idx ON nav_items(menu, parent_id, sort_order);

CREATE TABLE IF NOT EXISTS redirects (
  from_path  text PRIMARY KEY,
  to_path    text NOT NULL,
  code       integer NOT NULL DEFAULT 301 CHECK (code IN (301,302,308)),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id         bigserial PRIMARY KEY,
  user_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  user_email text,
  action     text NOT NULL,       -- create | update | delete | publish | unpublish | login | logout | restore | upload
  entity     text NOT NULL,       -- page | document | folder | media | nav | redirect | setting | user | session
  entity_id  text,
  summary    text NOT NULL DEFAULT '',
  diff       jsonb,
  ip         text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON audit_log(entity, entity_id);
