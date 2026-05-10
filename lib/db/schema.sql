-- naming.maze.uz — admin analytics schema (Stage 1).
-- Run once against the Turso DB via `turso db shell <db> < lib/db/schema.sql`.
-- Idempotent: every CREATE uses IF NOT EXISTS.
--
-- Conventions:
--   * timestamps are stored as INTEGER Unix milliseconds (UTC).
--   * JSON payloads live in TEXT columns (libSQL/SQLite has no JSONB).
--   * surrogate ids are short URL-safe nanoid strings.

-- 1. Sessions — one row per visitor session (fingerprint + cookie).
CREATE TABLE IF NOT EXISTS sessions (
  id            TEXT    PRIMARY KEY,
  fingerprint   TEXT    NOT NULL,
  first_seen    INTEGER NOT NULL,
  last_seen     INTEGER NOT NULL,
  events_count  INTEGER NOT NULL DEFAULT 0,
  is_lead       INTEGER NOT NULL DEFAULT 0,
  lead_data     TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_last_seen   ON sessions (last_seen);
CREATE INDEX IF NOT EXISTS idx_sessions_fingerprint ON sessions (fingerprint);
CREATE INDEX IF NOT EXISTS idx_sessions_is_lead     ON sessions (is_lead);

-- 2. Events — pageview / generate / contact / click_outbound, etc.
CREATE TABLE IF NOT EXISTS events (
  id              TEXT    PRIMARY KEY,
  session_id      TEXT    NOT NULL,
  event_type      TEXT    NOT NULL,
  event_data      TEXT,
  url             TEXT,
  referrer        TEXT,
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  utm_term        TEXT,
  utm_content     TEXT,
  user_agent      TEXT,
  ip_country      TEXT,
  ip_city         TEXT,
  viewport_width  INTEGER,
  viewport_height INTEGER,
  created_at      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_session    ON events (session_id);
CREATE INDEX IF NOT EXISTS idx_events_type_time  ON events (event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_events_created    ON events (created_at);
CREATE INDEX IF NOT EXISTS idx_events_url        ON events (url);

-- 3. Mouse events — raw move/click/scroll for heatmap aggregation.
CREATE TABLE IF NOT EXISTS mouse_events (
  id            TEXT    PRIMARY KEY,
  session_id    TEXT    NOT NULL,
  page_url      TEXT    NOT NULL,
  event_type    TEXT    NOT NULL,
  x             INTEGER NOT NULL,
  y             INTEGER NOT NULL,
  timestamp_ms  INTEGER NOT NULL,
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mouse_session    ON mouse_events (session_id);
CREATE INDEX IF NOT EXISTS idx_mouse_page_type  ON mouse_events (page_url, event_type);
CREATE INDEX IF NOT EXISTS idx_mouse_created    ON mouse_events (created_at);

-- 4. Session recordings — gzipped+base64 rrweb event blobs (14-day retention).
CREATE TABLE IF NOT EXISTS session_recordings (
  id           TEXT    PRIMARY KEY,
  session_id   TEXT    NOT NULL,
  events_blob  TEXT    NOT NULL,
  duration_ms  INTEGER NOT NULL,
  created_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_recordings_session ON session_recordings (session_id);
CREATE INDEX IF NOT EXISTS idx_recordings_created ON session_recordings (created_at);

-- 5. Heatmap aggregates — pre-bucketed click counts (composite primary key).
CREATE TABLE IF NOT EXISTS heatmap_aggregates (
  page_url    TEXT    NOT NULL,
  event_type  TEXT    NOT NULL,
  x_bucket    INTEGER NOT NULL,
  y_bucket    INTEGER NOT NULL,
  date        TEXT    NOT NULL,
  count       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (page_url, event_type, x_bucket, y_bucket, date)
);
CREATE INDEX IF NOT EXISTS idx_heatmap_page_date ON heatmap_aggregates (page_url, date);

-- 6. Leads — kanban-style CRM rows produced from contact submissions.
CREATE TABLE IF NOT EXISTS leads (
  id                 TEXT    PRIMARY KEY,
  session_id         TEXT,
  name               TEXT,
  contact            TEXT,
  brand_name_chosen  TEXT,
  niche              TEXT,
  source_post        TEXT,
  status             TEXT    NOT NULL DEFAULT 'new',
  created_at         INTEGER NOT NULL,
  updated_at         INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_leads_status     ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_created    ON leads (created_at);
CREATE INDEX IF NOT EXISTS idx_leads_session    ON leads (session_id);
