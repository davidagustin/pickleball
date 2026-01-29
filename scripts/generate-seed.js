/**
 * Generates heavy seed SQL for pickleball app. Run:
 *   node scripts/generate-seed.js > migrations/0013_seed_heavy.sql
 * Then apply: wrangler d1 migrations apply DB --remote (or --local)
 */

const esc = (s) => (s == null ? "NULL" : `'${String(s).replace(/'/g, "''")}'`);

const FIRST_NAMES = [
	"Morgan",
	"Taylor",
	"Jordan",
	"Casey",
	"Riley",
	"Avery",
	"Quinn",
	"Reese",
	"Jamie",
	"Drew",
	"Blake",
	"Cameron",
	"Skyler",
	"Parker",
	"Finley",
	"Sage",
	"Alex",
	"Sam",
	"Chris",
	"Pat",
	"Robin",
	"Jesse",
	"Dakota",
	"River",
	"Emma",
	"Liam",
	"Olivia",
	"Noah",
	"Ava",
	"Ethan",
	"Sophia",
	"Mason",
	"Isabella",
	"William",
	"Mia",
	"James",
	"Charlotte",
	"Ben",
	"Harper",
	"Lucas",
	"Evelyn",
	"Henry",
	"Amelia",
	"Jack",
	"Ella",
	"Owen",
	"Scarlett",
	"Leo",
	"Grace",
	"Luke",
	"Chloe",
	"Hudson",
	"Victoria",
	"Dylan",
	"Riley",
	"Zoe",
	"Nora",
	"Lily",
	"Hazel",
	"Violet",
	"Aurora",
	"Savannah",
	"Audrey",
];

const CITIES = [
	{ city: "Austin", state: "TX" },
	{ city: "Phoenix", state: "AZ" },
	{ city: "Denver", state: "CO" },
	{ city: "Seattle", state: "WA" },
	{ city: "Chicago", state: "IL" },
	{ city: "San Diego", state: "CA" },
	{ city: "Atlanta", state: "GA" },
	{ city: "Miami", state: "FL" },
	{ city: "Portland", state: "OR" },
	{ city: "Nashville", state: "TN" },
	{ city: "Dallas", state: "TX" },
	{ city: "Boston", state: "MA" },
	{ city: "Las Vegas", state: "NV" },
	{ city: "Minneapolis", state: "MN" },
	{ city: "Tampa", state: "FL" },
	{ city: "Raleigh", state: "NC" },
	{ city: "Salt Lake City", state: "UT" },
	{ city: "San Antonio", state: "TX" },
	{ city: "Orlando", state: "FL" },
	{ city: "Charlotte", state: "NC" },
	{ city: "Indianapolis", state: "IN" },
];

const VENUE_PREFIXES = [
	"Community Center",
	"Recreation Complex",
	"Park Courts",
	"Pickleball Club",
	"Sports Complex",
	"Tennis & Pickleball Center",
	"YMCA",
	"Public Park",
	"Downtown Courts",
	"Riverside Park",
	"Sunset Rec",
	"Central Park",
	"Heritage Park",
	"Lakeside Courts",
	"Meadowbrook Park",
];

const POST_TEMPLATES = [
	"Looking for doubles partners this weekend. Who's in?",
	"Just got my new paddle — can't wait to try it. Anyone playing tomorrow?",
	"Pro tip: warm up your shoulder before playing. Saved me from a lot of soreness.",
	"Thanks everyone who came to the round-robin last week. Same time next week!",
	"Open play at {venue} Saturday 9am. All skill levels welcome.",
	"Anyone know good 4.0+ games in the area?",
	"Beginner here looking for patient partners to learn with.",
	"Tournament recap: had a blast. Congrats to the winners!",
	"Third-shot drop practice paid off today. Finally feeling consistent.",
	"New courts opened at {venue}. Check them out!",
	"Looking for a mixed doubles partner for the spring league.",
	"Dink rally with 50+ hits today. This game is addictive.",
	"Shoutout to everyone who showed up for the charity round-robin.",
	"Best paddle for control? Currently using a {brand}.",
	"Playing in the rain today — dedicated crew!",
];

const SKILL_LEVELS = ["2.0", "2.5", "3.0", "3.5", "4.0", "4.5", "5.0"];
const PADDLES = [
	"Selkirk Vanguard",
	"Joola Hyperion",
	"CRBN 2X",
	"Six Zero DBD",
	"Gearbox Pro",
	"Onix Z5",
	"Engage Pursuit",
	"Vulcan V560",
];
const REGION_COLORS = [
	"#10b981",
	"#3b82f6",
	"#8b5cf6",
	"#ec4899",
	"#f59e0b",
	"#06b6d4",
	"#84cc16",
	"#ef4444",
];

const NUM_SEED_USERS = 120;
const NUM_COURTS_EXTRA = 22;
const NUM_POSTS = 90;
const NUM_REGIONS = 28;
const NUM_PLAY_SESSIONS = 55;
const NUM_TOURNAMENTS_EXTRA = 14;
const NUM_COACHING = 22;
const NUM_MESSAGES = 180;
const NUM_FRIEND_PAIRS = 200;

function main() {
	const out = [];
	out.push(
		"-- Heavy seed: many users, courts, posts, sessions, tournaments, friends, messages (illusion of a widely used app)",
	);
	out.push("-- Run after 0012. Uses INSERT OR IGNORE so demo data is preserved.");
	out.push("");

	const userIds = ["user-demo-1", "user-demo-2", "user-demo-3", "user-demo-4", "user-demo-5"];
	for (let i = 1; i <= NUM_SEED_USERS; i++) {
		const id = `user-seed-${i}`;
		userIds.push(id);
		const name =
			FIRST_NAMES[(i - 1) % FIRST_NAMES.length] +
			(i > FIRST_NAMES.length ? ` ${Math.floor((i - 1) / FIRST_NAMES.length) + 1}` : "");
		const email = `user${i}@seed.pickleball.app`;
		const daysAgo = 5 + (i % 60);
		out.push(
			`INSERT OR IGNORE INTO users (id, email, name, provider, provider_id, created_at) VALUES (${esc(id)}, ${esc(email)}, ${esc(name)}, 'seed', ${esc(email)}, datetime('now', '-${daysAgo} days'));`,
		);
	}
	out.push("");

	for (let i = 1; i <= NUM_REGIONS; i++) {
		const id = `region-seed-${i}`;
		const c = CITIES[(i - 1) % CITIES.length];
		const name = c.city + " Metro";
		const color = REGION_COLORS[(i - 1) % REGION_COLORS.length];
		out.push(
			`INSERT OR IGNORE INTO regions (id, country, name, color, created_at) VALUES (${esc(id)}, 'USA', ${esc(name)}, ${esc(color)}, datetime('now', '-${30 + i} days'));`,
		);
	}
	out.push("");

	for (let i = 1; i <= NUM_SEED_USERS; i += 2) {
		const id = `user-seed-${i}`;
		const skill = SKILL_LEVELS[i % SKILL_LEVELS.length];
		const paddle = PADDLES[i % PADDLES.length];
		const regionId =
			i <= NUM_REGIONS ? `region-seed-${((i - 1) % NUM_REGIONS) + 1}` : "region-default";
		const bio = i % 3 === 0 ? `Love pickleball. DUPR around ${skill}. Always up for games.` : null;
		out.push(
			`INSERT OR IGNORE INTO user_profiles (user_id, bio, paddle, shoes, gear, dupr_link, skill_level, region_id, updated_at) VALUES (${esc(id)}, ${esc(bio)}, ${esc(paddle)}, ${esc(i % 4 === 0 ? "ASICS Gel-Rocket" : null)}, ${esc(null)}, ${esc(i % 5 === 0 ? "https://dupr.com/player/seed" + i : null)}, ${esc(skill)}, ${esc(regionId)}, datetime('now'));`,
		);
	}
	out.push("");

	const courtIds = ["1", "2", "3"];
	for (let i = 1; i <= NUM_COURTS_EXTRA; i++) {
		const id = `court-seed-${i}`;
		courtIds.push(id);
		const c = CITIES[(i - 1) % CITIES.length];
		const prefix = VENUE_PREFIXES[(i - 1) % VENUE_PREFIXES.length];
		const name = c.city + " " + prefix;
		const courtCount = 2 + (i % 6);
		const courtType = i % 3 === 0 ? "indoor" : "outdoor";
		const reservable = i % 2;
		out.push(
			`INSERT OR IGNORE INTO courts (id, name, address, city, state, country, court_count, amenities, court_type, reservable, created_at) VALUES (${esc(id)}, ${esc(name)}, ${esc(i + 10 + " Main St")}, ${esc(c.city)}, ${esc(c.state)}, 'USA', ${courtCount}, ${esc(i % 2 ? "lights, restrooms" : null)}, ${esc(courtType)}, ${reservable}, datetime('now', '-${20 + (i % 30)} days'));`,
		);
	}
	out.push("");

	for (let i = 1; i <= NUM_COURTS_EXTRA; i++) {
		const courtId = `court-seed-${i}`;
		const code = "PB-" + courtId.replace("court-seed-", "S").toUpperCase().slice(0, 6);
		out.push(
			`INSERT OR IGNORE INTO court_room_codes (court_id, code) VALUES (${esc(courtId)}, ${esc(code)});`,
		);
	}
	out.push("");

	const postIds = [];
	for (let i = 1; i <= NUM_POSTS; i++) {
		const id = `post-seed-${i}`;
		postIds.push(id);
		const authorId = userIds[(i - 1) % userIds.length];
		let content = POST_TEMPLATES[(i - 1) % POST_TEMPLATES.length];
		content = content
			.replace("{venue}", "the community center")
			.replace("{brand}", PADDLES[i % PADDLES.length]);
		const daysAgo = (i % 14) + 1;
		const hoursAgo = i % 24;
		out.push(
			`INSERT OR IGNORE INTO posts (id, author_id, content, created_at) VALUES (${esc(id)}, ${esc(authorId)}, ${esc(content)}, datetime('now', '-${daysAgo} days', '-${hoursAgo} hours'));`,
		);
	}
	out.push("");

	for (let i = 0; i < postIds.length; i++) {
		const postId = postIds[i];
		const numLikes = 1 + (i % 8);
		const startUser = (i * 3) % userIds.length;
		for (let k = 0; k < numLikes; k++) {
			const uid = userIds[(startUser + k) % userIds.length];
			out.push(
				`INSERT OR IGNORE INTO likes (post_id, user_id) VALUES (${esc(postId)}, ${esc(uid)});`,
			);
		}
	}
	out.push("");

	let commentIdx = 1;
	for (let i = 0; i < postIds.length; i++) {
		const postId = postIds[i];
		const numComments = i % 4;
		for (let k = 0; k < numComments; k++) {
			const cid = `comment-seed-${commentIdx++}`;
			const authorId = userIds[(i + k + 2) % userIds.length];
			const contents = [
				"I'm in!",
				"Count me in.",
				"See you there.",
				"Sounds good.",
				"Can't make it this week.",
				"What time?",
			];
			const content = contents[(i + k) % contents.length];
			out.push(
				`INSERT OR IGNORE INTO comments (id, post_id, author_id, content, created_at) VALUES (${esc(cid)}, ${esc(postId)}, ${esc(authorId)}, ${esc(content)}, datetime('now', '-${(i % 5) + 1} days'));`,
			);
		}
	}
	out.push("");

	const pairSet = new Set();
	for (let n = 0; n < NUM_FRIEND_PAIRS; n++) {
		const a = (n * 7) % userIds.length;
		let b = (n * 11 + 1) % userIds.length;
		if (a === b) b = (b + 1) % userIds.length;
		const key = [userIds[a], userIds[b]].sort().join(",");
		if (pairSet.has(key)) continue;
		pairSet.add(key);
		const fromId = userIds[a];
		const toId = userIds[b];
		const status = n % 10 === 0 ? "pending" : "accepted";
		out.push(
			`INSERT OR IGNORE INTO friend_requests (from_id, to_id, status, created_at) VALUES (${esc(fromId)}, ${esc(toId)}, ${esc(status)}, datetime('now', '-${(n % 14) + 1} days'));`,
		);
		if (status === "accepted") {
			out.push(
				`INSERT OR IGNORE INTO friend_requests (from_id, to_id, status, created_at) VALUES (${esc(toId)}, ${esc(fromId)}, 'accepted', datetime('now', '-${(n % 14) + 1} days'));`,
			);
		}
	}
	out.push("");

	for (let m = 0; m < NUM_MESSAGES; m++) {
		const id = `msg-seed-${m + 1}`;
		const a = (m * 13) % userIds.length;
		let b = (m * 17 + 1) % userIds.length;
		if (a === b) b = (b + 1) % userIds.length;
		const senderId = userIds[a];
		const receiverId = userIds[b];
		const contents = [
			"Hey, still on for Saturday?",
			"Yes! Court 2 at 10.",
			"Perfect, see you then.",
			"Running 5 min late.",
			"Need a fourth?",
			"I'm in for tomorrow.",
			"What's your DUPR?",
			"Great game today!",
		];
		const content = contents[m % contents.length];
		const readAt = m % 3 !== 0 ? "datetime('now', '-1 days')" : "NULL";
		out.push(
			`INSERT OR IGNORE INTO messages (id, sender_id, receiver_id, content, created_at, read_at) VALUES (${esc(id)}, ${esc(senderId)}, ${esc(receiverId)}, ${esc(content)}, datetime('now', '-${(m % 7) + 1} days'), ${readAt});`,
		);
	}
	out.push("");

	for (let i = 0; i < courtIds.length; i++) {
		const courtId = courtIds[i];
		const numInQueue = 2 + (i % 5);
		for (let k = 0; k < numInQueue; k++) {
			const uid = userIds[(i * 3 + k) % userIds.length];
			out.push(
				`INSERT OR IGNORE INTO court_queue (court_id, user_id, created_at) VALUES (${esc(courtId)}, ${esc(uid)}, datetime('now', '-${k * 5} minutes'));`,
			);
		}
		const adminId = userIds[i % userIds.length];
		out.push(
			`INSERT OR IGNORE INTO court_admins (court_id, user_id, created_at) VALUES (${esc(courtId)}, ${esc(adminId)}, datetime('now', '-1 day'));`,
		);
	}
	out.push("");

	for (let t = 1; t <= NUM_TOURNAMENTS_EXTRA; t++) {
		const id = `tournament-seed-${t}`;
		const status = t % 3 === 0 ? "draft" : t % 3 === 1 ? "in_progress" : "completed";
		const adminId = userIds[(t - 1) % userIds.length];
		out.push(
			`INSERT OR IGNORE INTO tournaments (id, name, admin_id, status, created_at) VALUES (${esc(id)}, ${esc("Seed Tournament " + t)}, ${esc(adminId)}, ${esc(status)}, datetime('now', '-${t + 5} days'));`,
		);
		const numPart = [4, 4, 8, 8, 16][t % 5];
		for (let p = 0; p < numPart; p++) {
			const uid = userIds[(t * 2 + p) % userIds.length];
			out.push(
				`INSERT OR IGNORE INTO tournament_participants (tournament_id, user_id, seed, created_at) VALUES (${esc(id)}, ${esc(uid)}, ${p + 1}, datetime('now'));`,
			);
		}
	}
	out.push("");

	const signupLines = [];
	const noteLines = [];
	const waitlistLines = [];
	for (let s = 1; s <= NUM_PLAY_SESSIONS; s++) {
		const id = `session-seed-${s}`;
		const creatorId = userIds[(s - 1) % userIds.length];
		const regionId =
			s <= NUM_REGIONS ? `region-seed-${((s - 1) % NUM_REGIONS) + 1}` : "region-default";
		const c = CITIES[(s - 1) % CITIES.length];
		const venue = c.city + " " + VENUE_PREFIXES[s % VENUE_PREFIXES.length];
		const dayOffset = (s % 21) - 7;
		const sessionDate =
			dayOffset >= 0 ? `date('now', '+${dayOffset} days')` : `date('now', '${dayOffset} days')`;
		const sessionTime = ["09:00", "10:00", "11:00", "18:00", "19:00"][s % 5];
		const skillLevel = SKILL_LEVELS[s % SKILL_LEVELS.length];
		const courtIdVal = s % 4 === 0 ? courtIds[s % courtIds.length] : null;
		const courtIdSql = courtIdVal == null ? "NULL" : esc(courtIdVal);
		const isRecurring = s % 5 === 0 ? 1 : 0;
		const recurrenceDay = s % 5 === 0 ? ["Monday", "Wednesday", "Saturday"][s % 3] : null;
		out.push(
			`INSERT OR IGNORE INTO play_sessions (id, creator_id, region_id, court_id, venue, session_date, session_time, skill_level, format_type, event_name, player_min, player_max, is_recurring, recurrence_day, created_at) VALUES (${esc(id)}, ${esc(creatorId)}, ${esc(regionId)}, ${courtIdSql}, ${esc(venue)}, ${sessionDate}, ${esc(sessionTime)}, ${esc(skillLevel)}, ${esc("doubles")}, ${esc(s % 3 === 0 ? "Open Play" : null)}, 4, ${8 + (s % 4)}, ${isRecurring}, ${recurrenceDay ? esc(recurrenceDay) : "NULL"}, datetime('now', '-${s % 10} days'));`,
		);
		const numSignups = 2 + (s % 6);
		for (let u = 0; u < numSignups; u++) {
			const uid = userIds[(s * 2 + u) % userIds.length];
			signupLines.push(
				`INSERT OR IGNORE INTO play_session_signups (session_id, user_id, created_at) VALUES (${esc(id)}, ${esc(uid)}, datetime('now'));`,
			);
		}
		if (s % 4 === 1) {
			const uid = userIds[(s + 3) % userIds.length];
			noteLines.push(
				`INSERT OR IGNORE INTO play_session_notes (id, session_id, user_id, content, created_at) VALUES (${esc("note-seed-" + s)}, ${esc(id)}, ${esc(uid)}, ${esc("I might be 5 min late")}, datetime('now'));`,
			);
		}
		if (s % 5 === 2) {
			const uid = userIds[(s + 4) % userIds.length];
			waitlistLines.push(
				`INSERT OR IGNORE INTO play_session_waitlist (session_id, user_id, created_at) VALUES (${esc(id)}, ${esc(uid)}, datetime('now'));`,
			);
		}
	}
	out.push(...signupLines);
	out.push(...noteLines);
	out.push(...waitlistLines);
	out.push("");

	for (let c = 1; c <= NUM_COACHING; c++) {
		const id = `coaching-seed-${c}`;
		const userId = userIds[(c - 1) % userIds.length];
		const titles = [
			"Private lessons — all levels",
			"Beginner group clinics",
			"Strategy and drill sessions",
			"Third-shot drop workshop",
			"Doubles positioning clinic",
		];
		const title = titles[(c - 1) % titles.length];
		const loc =
			CITIES[(c - 1) % CITIES.length].city + " " + VENUE_PREFIXES[c % VENUE_PREFIXES.length];
		out.push(
			`INSERT OR IGNORE INTO coaching_listings (id, user_id, title, description, location, availability, rate, contact_info, created_at) VALUES (${esc(id)}, ${esc(userId)}, ${esc(title)}, ${esc("Experienced player. Focus on fundamentals and fun.")}, ${esc(loc)}, ${esc("Weekends 9am–2pm")}, ${esc("$45/hr")}, ${esc("DM me")}, datetime('now', '-${c % 14} days'));`,
		);
	}

	return out.join("\n");
}

console.log(main());
