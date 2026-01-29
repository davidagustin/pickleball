-- Court/room admins: creator is first admin; admins can make others admin
CREATE TABLE IF NOT EXISTS court_admins (
  court_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (court_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_court_admins_court ON court_admins(court_id);
