-- Paddle database: analytics-style specs for gear guides (no external links)
CREATE TABLE IF NOT EXISTS paddles (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  core_type TEXT,
  face_material TEXT,
  weight_oz REAL,
  swing_weight INTEGER,
  shape TEXT,
  length_in REAL,
  width_in REAL,
  thickness_in REAL,
  grip_length_in REAL,
  price_usd INTEGER,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_paddles_brand ON paddles(brand);
CREATE INDEX IF NOT EXISTS idx_paddles_core ON paddles(core_type);
CREATE INDEX IF NOT EXISTS idx_paddles_created ON paddles(created_at DESC);

-- Sample paddle data (representative specs for comparison)
INSERT OR IGNORE INTO paddles (id, brand, model, core_type, face_material, weight_oz, swing_weight, shape, length_in, width_in, thickness_in, grip_length_in, price_usd, description, created_at) VALUES
  ('pad-1', 'Selkirk', 'Labs 002', 'polymer', 'carbon fiber', 8.0, 115, 'elongated', 16.5, 7.25, 0.5, 5.5, 250, 'Control-focused elongated paddle with raw carbon face.', datetime('now')),
  ('pad-2', 'Joola', 'Ben Johns Hyperion CFS 16', 'polymer', 'carbon fiber', 8.1, 118, 'elongated', 16.5, 7.25, 0.5, 5.5, 220, 'Power and spin; elongated shape.', datetime('now')),
  ('pad-3', 'CRBN', '2X Power', 'polymer', 'carbon fiber', 8.2, 120, 'elongated', 16.5, 7.25, 0.5, 5.5, 200, 'Carbon face, polymer core; strong power.', datetime('now')),
  ('pad-4', 'Six Zero', 'Double Black Diamond 16mm', 'polymer', 'carbon fiber', 8.0, 114, 'elongated', 16.5, 7.25, 0.63, 5.5, 230, 'Thick core for soft feel and control.', datetime('now')),
  ('pad-5', 'Gearbox', 'Pro Control', 'polymer', 'carbon fiber', 8.3, 119, 'hybrid', 16.0, 7.5, 0.5, 5.25, 180, 'Wide body hybrid; control and consistency.', datetime('now')),
  ('pad-6', 'Onix', 'Z5', 'nomex', 'composite', 7.5, 108, 'standard', 15.5, 7.75, 0.5, 5.0, 100, 'Classic wide body; great for beginners.', datetime('now')),
  ('pad-7', 'Vulcan', 'V560 Power', 'polymer', 'fiberglass', 8.0, 112, 'standard', 15.75, 7.5, 0.5, 5.25, 90, 'Fiberglass face; forgiving and durable.', datetime('now')),
  ('pad-8', 'Engage', 'Pursuit MX 6.0', 'polymer', 'carbon fiber', 7.8, 110, 'elongated', 16.25, 7.25, 0.5, 5.5, 170, 'Maneuverable elongated; good touch.', datetime('now'));
