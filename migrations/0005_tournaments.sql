-- Tournaments: single-elimination, admin creates and sets winners
CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  admin_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tournaments_admin ON tournaments(admin_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);

-- Participants (seeded by join order or explicit seed)
CREATE TABLE IF NOT EXISTS tournament_participants (
  tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seed INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (tournament_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON tournament_participants(tournament_id);

-- Bracket matches: round 1 = first round, 2 = semi, 3 = final, etc.
CREATE TABLE IF NOT EXISTS bracket_matches (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  match_order INTEGER NOT NULL,
  player1_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  player2_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  winner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  next_match_id TEXT REFERENCES bracket_matches(id) ON DELETE SET NULL,
  next_slot INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tournament_id, round, match_order)
);
CREATE INDEX IF NOT EXISTS idx_bracket_matches_tournament ON bracket_matches(tournament_id);
