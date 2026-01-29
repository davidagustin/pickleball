-- Private lessons / coaching: users advertise themselves with time, location, rate, etc.
CREATE TABLE IF NOT EXISTS coaching_listings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  availability TEXT,
  rate TEXT,
  contact_info TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_coaching_listings_user ON coaching_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_listings_created ON coaching_listings(created_at DESC);
