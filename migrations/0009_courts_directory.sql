-- Pickleheads-style court finder: directory of courts, add a court, court detail
-- court_id in court_queue/court_room_codes/court_admins references this id
CREATE TABLE IF NOT EXISTS courts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT NOT NULL DEFAULT 'USA',
  court_count INTEGER NOT NULL DEFAULT 1,
  amenities TEXT,
  court_type TEXT,
  reservable INTEGER NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_courts_city ON courts(city);
CREATE INDEX IF NOT EXISTS idx_courts_country ON courts(country);
CREATE INDEX IF NOT EXISTS idx_courts_created ON courts(created_at DESC);

-- Seed the 3 courts that already have queue/room codes
INSERT OR IGNORE INTO courts (id, name, address, city, state, country, court_count, court_type, reservable, created_at) VALUES
  ('1', 'Downtown Community Center', '123 Main St', NULL, NULL, 'USA', 4, 'outdoor', 1, datetime('now')),
  ('2', 'Riverside Park', '456 River Rd', NULL, NULL, 'USA', 2, 'outdoor', 0, datetime('now')),
  ('3', 'Sunset Rec Complex', '789 Sunset Blvd', NULL, NULL, 'USA', 6, 'indoor', 1, datetime('now'));
