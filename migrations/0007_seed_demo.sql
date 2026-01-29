-- Demo data for every feature: users, feed, courts, tournaments, coaching, friends, messages, profiles
-- Run after all schema migrations. Use "Try demo" to log in as Alex (demo@pickleball.app).

-- Demo users (fixed IDs for references)
INSERT OR IGNORE INTO users (id, email, name, provider, provider_id, created_at) VALUES
  ('user-demo-1', 'demo@pickleball.app', 'Alex', 'demo', 'demo@pickleball.app', datetime('now', '-7 days')),
  ('user-demo-2', 'jordan@example.com', 'Jordan', 'demo', 'jordan@example.com', datetime('now', '-6 days')),
  ('user-demo-3', 'sam@example.com', 'Sam', 'demo', 'sam@example.com', datetime('now', '-5 days')),
  ('user-demo-4', 'casey@example.com', 'Casey', 'demo', 'casey@example.com', datetime('now', '-4 days')),
  ('user-demo-5', 'riley@example.com', 'Riley', 'demo', 'riley@example.com', datetime('now', '-3 days'));

-- Feed: posts
INSERT OR IGNORE INTO posts (id, author_id, content, created_at) VALUES
  ('post-demo-1', 'user-demo-1', 'Looking for doubles partners this weekend at Downtown Community Center. Who''s in?', datetime('now', '-2 days')),
  ('post-demo-2', 'user-demo-2', 'Just got my new paddle — can''t wait to try it tomorrow. Anyone playing at Riverside Park?', datetime('now', '-1 days')),
  ('post-demo-3', 'user-demo-3', 'Pro tip: warm up your shoulder before playing. Saved me from a lot of soreness.', datetime('now', '-12 hours')),
  ('post-demo-4', 'user-demo-1', 'Thanks everyone who came to the round-robin last week. Same time next week!', datetime('now', '-6 hours'));

-- Feed: likes (Jordan liked post 1)
INSERT OR IGNORE INTO likes (post_id, user_id) VALUES
  ('post-demo-1', 'user-demo-2'),
  ('post-demo-1', 'user-demo-3'),
  ('post-demo-2', 'user-demo-1');

-- Feed: comments
INSERT OR IGNORE INTO comments (id, post_id, author_id, content, created_at) VALUES
  ('comment-demo-1', 'post-demo-1', 'user-demo-2', 'I''m in! See you Saturday.', datetime('now', '-2 days')),
  ('comment-demo-2', 'post-demo-1', 'user-demo-4', 'Count me in too.', datetime('now', '-1 days')),
  ('comment-demo-3', 'post-demo-2', 'user-demo-1', 'I''ll be there around 10.', datetime('now', '-1 days'));

-- Court queue: Alex and Jordan on court 1, Sam on court 2
INSERT OR IGNORE INTO court_queue (court_id, user_id, created_at) VALUES
  ('1', 'user-demo-1', datetime('now', '-30 minutes')),
  ('1', 'user-demo-2', datetime('now', '-25 minutes')),
  ('2', 'user-demo-3', datetime('now', '-10 minutes'));

-- Court admins: Alex is admin on court 1
INSERT OR IGNORE INTO court_admins (court_id, user_id, created_at) VALUES
  ('1', 'user-demo-1', datetime('now', '-1 day'));

-- Tournaments: one draft, one in progress with bracket
INSERT OR IGNORE INTO tournaments (id, name, admin_id, status, created_at) VALUES
  ('tournament-demo-draft', 'Summer Open', 'user-demo-1', 'draft', datetime('now', '-3 days')),
  ('tournament-demo-live', 'Fall Championship', 'user-demo-1', 'in_progress', datetime('now', '-2 days'));

INSERT OR IGNORE INTO tournament_participants (tournament_id, user_id, seed, created_at) VALUES
  ('tournament-demo-draft', 'user-demo-1', 1, datetime('now', '-3 days')),
  ('tournament-demo-draft', 'user-demo-2', 2, datetime('now', '-3 days')),
  ('tournament-demo-live', 'user-demo-1', 1, datetime('now', '-2 days')),
  ('tournament-demo-live', 'user-demo-2', 2, datetime('now', '-2 days')),
  ('tournament-demo-live', 'user-demo-3', 3, datetime('now', '-2 days')),
  ('tournament-demo-live', 'user-demo-4', 4, datetime('now', '-2 days'));

-- Bracket for Fall Championship: 4 players -> 2 round-1 matches, 1 final. Match IDs fixed for next_match linking.
INSERT OR IGNORE INTO bracket_matches (id, tournament_id, round, match_order, player1_id, player2_id, winner_id, next_match_id, next_slot, created_at) VALUES
  ('match-demo-r1-1', 'tournament-demo-live', 1, 1, 'user-demo-1', 'user-demo-2', 'user-demo-1', 'match-demo-final', 1, datetime('now')),
  ('match-demo-r1-2', 'tournament-demo-live', 1, 2, 'user-demo-3', 'user-demo-4', 'user-demo-4', 'match-demo-final', 2, datetime('now')),
  ('match-demo-final', 'tournament-demo-live', 2, 1, 'user-demo-1', 'user-demo-4', NULL, NULL, NULL, datetime('now'));

-- Coaching listings
INSERT OR IGNORE INTO coaching_listings (id, user_id, title, description, location, availability, rate, contact_info, created_at) VALUES
  ('coaching-demo-1', 'user-demo-1', 'Private pickleball lessons — all levels', 'Former 4.5 player. I focus on dinks, third-shot drops, and positioning.', 'Downtown Community Center', 'Weekends 9am–2pm', '$50/hr', 'DM me here', datetime('now', '-5 days')),
  ('coaching-demo-2', 'user-demo-3', 'Beginner group clinics', 'Small groups, fun atmosphere. Learn the basics in 4 sessions.', 'Riverside Park', 'Tuesday & Thursday 6pm', '$30/session', 'Email sam@example.com', datetime('now', '-3 days')),
  ('coaching-demo-3', 'user-demo-2', 'Strategy and drill sessions', 'For players who know the rules and want to level up.', 'Sunset Rec Complex', 'Weekday evenings', '$45/hr', 'DM for availability', datetime('now', '-1 days'));

-- Friends: Alex–Jordan, Alex–Sam accepted
INSERT OR IGNORE INTO friend_requests (from_id, to_id, status, created_at) VALUES
  ('user-demo-1', 'user-demo-2', 'accepted', datetime('now', '-4 days')),
  ('user-demo-2', 'user-demo-1', 'accepted', datetime('now', '-4 days')),
  ('user-demo-1', 'user-demo-3', 'accepted', datetime('now', '-3 days')),
  ('user-demo-3', 'user-demo-1', 'accepted', datetime('now', '-3 days'));

-- Messages: short thread between Alex and Jordan
INSERT OR IGNORE INTO messages (id, sender_id, receiver_id, content, created_at, read_at) VALUES
  ('msg-demo-1', 'user-demo-2', 'user-demo-1', 'Hey, still on for Saturday?', datetime('now', '-1 days'), datetime('now', '-1 days')),
  ('msg-demo-2', 'user-demo-1', 'user-demo-2', 'Yes! Court 2 at 10.', datetime('now', '-1 days'), datetime('now', '-1 days')),
  ('msg-demo-3', 'user-demo-2', 'user-demo-1', 'Perfect, see you then.', datetime('now', '-1 days'), NULL);

-- Profile for Alex (demo user)
INSERT OR IGNORE INTO user_profiles (user_id, bio, paddle, shoes, gear, dupr_link, updated_at) VALUES
  ('user-demo-1', 'Love teaching beginners and playing competitive doubles. DUPR 4.2', 'Selkirk Vanguard', 'ASICS Gel-Rocket', 'Knee brace, extra grips', 'https://dupr.com/player/alex', datetime('now'));
