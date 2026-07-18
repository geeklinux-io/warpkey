PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS keys (
  value TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'active',
  first_seen_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  last_validated_at INTEGER,
  last_run_id TEXT
);

CREATE TABLE IF NOT EXISTS key_sources (
  key_value TEXT NOT NULL REFERENCES keys(value) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  first_seen_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  PRIMARY KEY (key_value, source_id)
);

CREATE TABLE IF NOT EXISTS collection_runs (
  id TEXT PRIMARY KEY,
  trigger TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  finished_at INTEGER,
  source_count INTEGER NOT NULL DEFAULT 0,
  fetched_source_count INTEGER NOT NULL DEFAULT 0,
  found_count INTEGER NOT NULL DEFAULT 0,
  added_count INTEGER NOT NULL DEFAULT 0,
  removed_count INTEGER NOT NULL DEFAULT 0,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_runs_started ON collection_runs(started_at DESC);

CREATE TABLE IF NOT EXISTS key_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL REFERENCES collection_runs(id) ON DELETE CASCADE,
  key_value TEXT NOT NULL,
  event_type TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_run ON key_events(run_id, event_type);

CREATE TABLE IF NOT EXISTS lite_keys (
  key_value TEXT PRIMARY KEY REFERENCES keys(value) ON DELETE CASCADE,
  position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  status_code INTEGER,
  attempts INTEGER NOT NULL DEFAULT 0,
  delivered_at INTEGER,
  error TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS collection_lock (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  locked_until INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO collection_lock (id, locked_until) VALUES (1, 0);

INSERT OR IGNORE INTO sources (id, name, url, enabled, created_at, updated_at) VALUES
  ('warpplus', 'WarpPlus', 'https://t.me/s/warpplus', 1, unixepoch(), unixepoch()),
  ('warppluscn', 'WarpPlus CN', 'https://t.me/s/warppluscn', 1, unixepoch(), unixepoch()),
  ('warpplushome', 'WarpPlus Home', 'https://t.me/s/warpPlusHome', 1, unixepoch(), unixepoch()),
  ('warpveyke', 'Warp Veyke', 'https://t.me/s/warp_veyke', 1, unixepoch(), unixepoch());
