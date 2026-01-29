-- Court queue: digital "paddle stack" so people don't need to put paddles on the floor
-- court_id matches the court (e.g. "1", "2", "3" for MOCK_COURTS)
CREATE TABLE IF NOT EXISTS court_queue (
  court_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (court_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_court_queue_court ON court_queue(court_id);
CREATE INDEX IF NOT EXISTS idx_court_queue_created ON court_queue(court_id, created_at);
