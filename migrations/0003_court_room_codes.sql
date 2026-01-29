-- Room codes: shareable hash so other players can scan QR or enter code to join the court queue
-- court_id -> unique code (uppercase alphanumeric, short)
CREATE TABLE IF NOT EXISTS court_room_codes (
  court_id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_court_room_codes_code ON court_room_codes(code);

-- Seed stable codes for courts 1, 2, 3 (so same court always has same code)
INSERT OR IGNORE INTO court_room_codes (court_id, code) VALUES
  ('1', 'PB-DTCC'),
  ('2', 'PB-RIVP'),
  ('3', 'PB-SUNR');
