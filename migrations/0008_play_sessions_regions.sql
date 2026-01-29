-- PlayTime Scheduler-style: regions, play sessions (arrange play with others), signups, notes
-- See https://playtimescheduler.com/learn-more.php

-- Regions: country + region name; users pick one, can add new region
CREATE TABLE IF NOT EXISTS regions (
  id TEXT PRIMARY KEY,
  country TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(country, name)
);
CREATE INDEX IF NOT EXISTS idx_regions_country ON regions(country);

-- Play sessions: location, time, skill range, min/max players, optional format/event name
CREATE TABLE IF NOT EXISTS play_sessions (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  region_id TEXT REFERENCES regions(id) ON DELETE SET NULL,
  venue TEXT NOT NULL,
  session_date TEXT NOT NULL,
  session_time TEXT NOT NULL,
  skill_level TEXT,
  format_type TEXT,
  event_name TEXT,
  player_min INTEGER NOT NULL DEFAULT 4,
  player_max INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_play_sessions_date ON play_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_play_sessions_region ON play_sessions(region_id);
CREATE INDEX IF NOT EXISTS idx_play_sessions_creator ON play_sessions(creator_id);

-- Signups: who has added their name to a session
CREATE TABLE IF NOT EXISTS play_session_signups (
  session_id TEXT NOT NULL REFERENCES play_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (session_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_play_session_signups_session ON play_session_signups(session_id);

-- Session notes: "I might be late", "Extra paddle?" – thread per session
CREATE TABLE IF NOT EXISTS play_session_notes (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES play_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_play_session_notes_session ON play_session_notes(session_id);

-- Profile: add skill level and region for matching sessions
ALTER TABLE user_profiles ADD COLUMN skill_level TEXT;
ALTER TABLE user_profiles ADD COLUMN region_id TEXT;

-- Seed a default region so sessions have something to attach to
INSERT OR IGNORE INTO regions (id, country, name, color, created_at) VALUES
  ('region-default', 'USA', 'Default', '#10b981', datetime('now'));
