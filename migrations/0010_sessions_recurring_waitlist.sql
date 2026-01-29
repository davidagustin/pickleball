-- Recurring sessions (weekly) and waitlist when session is full (Pickleheads-style)
ALTER TABLE play_sessions ADD COLUMN court_id TEXT REFERENCES courts(id) ON DELETE SET NULL;
ALTER TABLE play_sessions ADD COLUMN is_recurring INTEGER NOT NULL DEFAULT 0;
ALTER TABLE play_sessions ADD COLUMN recurrence_day TEXT;

CREATE TABLE IF NOT EXISTS play_session_waitlist (
  session_id TEXT NOT NULL REFERENCES play_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (session_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_play_session_waitlist_session ON play_session_waitlist(session_id);
