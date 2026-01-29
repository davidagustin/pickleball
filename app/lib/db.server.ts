// D1Database is available from worker-configuration.d.ts in Workers runtime
type D1DB = D1Database;

const SESSION_COOKIE = "pickleball_session";
const SESSION_DAYS = 30;

export type User = { id: string; email: string | null; name: string; provider: string };
export type UserProfile = {
	userId: string;
	bio: string | null;
	paddle: string | null;
	shoes: string | null;
	gear: string | null;
	duprLink: string | null;
	skillLevel: string | null;
	regionId: string | null;
	updatedAt: string;
};
export type Post = {
	id: string;
	authorId: string;
	authorName: string;
	content: string;
	createdAt: string;
	likes: number;
	likedByMe: boolean;
	comments: { id: string; authorName: string; content: string; createdAt: string }[];
};

export function getSessionToken(cookieHeader: string | null): string | null {
	if (!cookieHeader) return null;
	const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
	return match ? decodeURIComponent(match[1]) : null;
}

export function sessionCookie(token: string) {
	return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`;
}

export function clearSessionCookie() {
	return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export async function getSessionUser(db: D1DB, token: string | null): Promise<User | null> {
	if (!token) return null;
	const row = await db
		.prepare("SELECT user_id FROM sessions WHERE id = ? AND datetime(expires_at) > datetime('now')")
		.bind(token)
		.first<{ user_id: string }>();
	if (!row) return null;
	const user = await db
		.prepare("SELECT id, email, name, provider FROM users WHERE id = ?")
		.bind(row.user_id)
		.first<User>();
	return user;
}

export async function getOrCreateDemoUser(db: D1DB, email: string, name: string): Promise<User> {
	const existing = await db
		.prepare("SELECT id, email, name, provider FROM users WHERE provider = 'demo' AND email = ?")
		.bind(email)
		.first<User>();
	if (existing) return existing;
	const id = `user-${crypto.randomUUID()}`;
	await db
		.prepare(
			"INSERT INTO users (id, email, name, provider, provider_id) VALUES (?, ?, ?, 'demo', ?)",
		)
		.bind(id, email, name, email)
		.run();
	return { id, email, name, provider: "demo" };
}

export async function getOrCreateOAuthUser(
	db: D1DB,
	provider: string,
	providerId: string,
	email: string | null,
	name: string,
): Promise<User> {
	const existing = await db
		.prepare("SELECT id, email, name, provider FROM users WHERE provider = ? AND provider_id = ?")
		.bind(provider, providerId)
		.first<User>();
	if (existing) return existing;
	const id = `user-${crypto.randomUUID()}`;
	await db
		.prepare("INSERT INTO users (id, email, name, provider, provider_id) VALUES (?, ?, ?, ?, ?)")
		.bind(id, email ?? null, name, provider, providerId)
		.run();
	return { id, email, name, provider };
}

export async function createSession(db: D1DB, userId: string): Promise<string> {
	const id = `sess-${crypto.randomUUID()}`;
	const expires = new Date();
	expires.setDate(expires.getDate() + SESSION_DAYS);
	await db
		.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)")
		.bind(id, userId, expires.toISOString())
		.run();
	return id;
}

export async function deleteSession(db: D1DB, token: string): Promise<void> {
	await db.prepare("DELETE FROM sessions WHERE id = ?").bind(token).run();
}

export async function getPosts(db: D1DB, currentUserId: string | null): Promise<Post[]> {
	const rows = await db
		.prepare(
			`SELECT p.id, p.author_id, p.content, p.created_at, u.name as author_name
       FROM posts p
       JOIN users u ON p.author_id = u.id
       ORDER BY p.created_at DESC
       LIMIT 100`,
		)
		.all<{
			id: string;
			author_id: string;
			content: string;
			created_at: string;
			author_name: string;
		}>();
	const posts: Post[] = [];
	for (const row of rows.results ?? []) {
		const likeRows = await db
			.prepare("SELECT user_id FROM likes WHERE post_id = ?")
			.bind(row.id)
			.all<{ user_id: string }>();
		const commentRows = await db
			.prepare(
				`SELECT c.id, c.content, c.created_at, u.name as author_name
         FROM comments c
         JOIN users u ON c.author_id = u.id
         WHERE c.post_id = ?
         ORDER BY c.created_at ASC`,
			)
			.bind(row.id)
			.all<{ id: string; content: string; created_at: string; author_name: string }>();
		posts.push({
			id: row.id,
			authorId: row.author_id,
			authorName: row.author_name,
			content: row.content,
			createdAt: row.created_at,
			likes: likeRows.results?.length ?? 0,
			likedByMe: currentUserId
				? (likeRows.results?.some((r) => r.user_id === currentUserId) ?? false)
				: false,
			comments: (commentRows.results ?? []).map((c) => ({
				id: c.id,
				authorName: c.author_name,
				content: c.content,
				createdAt: c.created_at,
			})),
		});
	}
	return posts;
}

export async function createPost(db: D1DB, authorId: string, content: string): Promise<Post> {
	const id = `post-${crypto.randomUUID()}`;
	const user = await db
		.prepare("SELECT name FROM users WHERE id = ?")
		.bind(authorId)
		.first<{ name: string }>();
	await db
		.prepare("INSERT INTO posts (id, author_id, content) VALUES (?, ?, ?)")
		.bind(id, authorId, content)
		.run();
	return {
		id,
		authorId,
		authorName: user?.name ?? "Unknown",
		content,
		createdAt: new Date().toISOString(),
		likes: 0,
		likedByMe: false,
		comments: [],
	};
}

export async function toggleLike(
	db: D1DB,
	postId: string,
	userId: string,
): Promise<{ likes: number; likedByMe: boolean }> {
	const existing = await db
		.prepare("SELECT 1 FROM likes WHERE post_id = ? AND user_id = ?")
		.bind(postId, userId)
		.first();
	if (existing) {
		await db
			.prepare("DELETE FROM likes WHERE post_id = ? AND user_id = ?")
			.bind(postId, userId)
			.run();
		const count = await db
			.prepare("SELECT COUNT(*) as c FROM likes WHERE post_id = ?")
			.bind(postId)
			.first<{ c: number }>();
		return { likes: count?.c ?? 0, likedByMe: false };
	} else {
		await db
			.prepare("INSERT INTO likes (post_id, user_id) VALUES (?, ?)")
			.bind(postId, userId)
			.run();
		const count = await db
			.prepare("SELECT COUNT(*) as c FROM likes WHERE post_id = ?")
			.bind(postId)
			.first<{ c: number }>();
		return { likes: count?.c ?? 0, likedByMe: true };
	}
}

export async function addComment(db: D1DB, postId: string, authorId: string, content: string) {
	const id = `comment-${crypto.randomUUID()}`;
	const user = await db
		.prepare("SELECT name FROM users WHERE id = ?")
		.bind(authorId)
		.first<{ name: string }>();
	await db
		.prepare("INSERT INTO comments (id, post_id, author_id, content) VALUES (?, ?, ?, ?)")
		.bind(id, postId, authorId, content)
		.run();
	return { id, authorName: user?.name ?? "Unknown", content, createdAt: new Date().toISOString() };
}

export async function getUsers(db: D1DB, limit = 50): Promise<User[]> {
	const rows = await db
		.prepare("SELECT id, email, name, provider FROM users ORDER BY created_at DESC LIMIT ?")
		.bind(limit)
		.all<User>();
	return rows.results ?? [];
}

// --- Profile ---
export async function getProfile(db: D1DB, userId: string): Promise<UserProfile | null> {
	try {
		const row = await db
			.prepare(
				"SELECT user_id, bio, paddle, shoes, gear, dupr_link, skill_level, region_id, updated_at FROM user_profiles WHERE user_id = ?",
			)
			.bind(userId)
			.first<{
				user_id: string;
				bio: string | null;
				paddle: string | null;
				shoes: string | null;
				gear: string | null;
				dupr_link: string | null;
				skill_level?: string | null;
				region_id?: string | null;
				updated_at: string;
			}>();
		if (!row) return null;
		return {
			userId: row.user_id,
			bio: row.bio,
			paddle: row.paddle,
			shoes: row.shoes,
			gear: row.gear,
			duprLink: row.dupr_link,
			skillLevel: row.skill_level ?? null,
			regionId: row.region_id ?? null,
			updatedAt: row.updated_at,
		};
	} catch {
		const row = await db
			.prepare(
				"SELECT user_id, bio, paddle, shoes, gear, dupr_link, updated_at FROM user_profiles WHERE user_id = ?",
			)
			.bind(userId)
			.first<{
				user_id: string;
				bio: string | null;
				paddle: string | null;
				shoes: string | null;
				gear: string | null;
				dupr_link: string | null;
				updated_at: string;
			}>();
		if (!row) return null;
		return {
			userId: row.user_id,
			bio: row.bio,
			paddle: row.paddle,
			shoes: row.shoes,
			gear: row.gear,
			duprLink: row.dupr_link,
			skillLevel: null,
			regionId: null,
			updatedAt: row.updated_at,
		};
	}
}

export async function upsertProfile(
	db: D1DB,
	userId: string,
	data: {
		bio?: string;
		paddle?: string;
		shoes?: string;
		gear?: string;
		duprLink?: string;
		skillLevel?: string;
		regionId?: string;
	},
): Promise<void> {
	await db
		.prepare(
			`INSERT INTO user_profiles (user_id, bio, paddle, shoes, gear, dupr_link, skill_level, region_id, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET
         bio = COALESCE(excluded.bio, user_profiles.bio),
         paddle = COALESCE(excluded.paddle, user_profiles.paddle),
         shoes = COALESCE(excluded.shoes, user_profiles.shoes),
         gear = COALESCE(excluded.gear, user_profiles.gear),
         dupr_link = COALESCE(excluded.dupr_link, user_profiles.dupr_link),
         skill_level = COALESCE(excluded.skill_level, user_profiles.skill_level),
         region_id = COALESCE(excluded.region_id, user_profiles.region_id),
         updated_at = datetime('now')`,
		)
		.bind(
			userId,
			data.bio ?? null,
			data.paddle ?? null,
			data.shoes ?? null,
			data.gear ?? null,
			data.duprLink ?? null,
			data.skillLevel ?? null,
			data.regionId ?? null,
		)
		.run();
}

// --- Friends ---
export type FriendStatus = "none" | "pending_sent" | "pending_received" | "friends";

export async function getFriendStatus(
	db: D1DB,
	currentUserId: string,
	otherUserId: string,
): Promise<FriendStatus> {
	if (currentUserId === otherUserId) return "none";
	const sent = await db
		.prepare("SELECT status FROM friend_requests WHERE from_id = ? AND to_id = ?")
		.bind(currentUserId, otherUserId)
		.first<{ status: string }>();
	if (sent) return sent.status === "accepted" ? "friends" : "pending_sent";
	const received = await db
		.prepare("SELECT status FROM friend_requests WHERE from_id = ? AND to_id = ?")
		.bind(otherUserId, currentUserId)
		.first<{ status: string }>();
	if (received) return received.status === "accepted" ? "friends" : "pending_received";
	return "none";
}

export async function getFriends(db: D1DB, userId: string): Promise<User[]> {
	const rows = await db
		.prepare(
			`SELECT u.id, u.email, u.name, u.provider FROM users u
       INNER JOIN friend_requests f ON (
         (f.from_id = ? AND f.to_id = u.id) OR (f.from_id = u.id AND f.to_id = ?)
       )
       WHERE f.status = 'accepted' AND u.id != ?`,
		)
		.bind(userId, userId, userId)
		.all<User>();
	return rows.results ?? [];
}

export async function getPendingReceived(db: D1DB, userId: string): Promise<User[]> {
	const rows = await db
		.prepare(
			`SELECT u.id, u.email, u.name, u.provider FROM users u
       INNER JOIN friend_requests f ON f.from_id = u.id AND f.to_id = ? AND f.status = 'pending'`,
		)
		.bind(userId)
		.all<User>();
	return rows.results ?? [];
}

export async function sendFriendRequest(db: D1DB, fromId: string, toId: string): Promise<void> {
	if (fromId === toId) return;
	await db
		.prepare(
			"INSERT OR IGNORE INTO friend_requests (from_id, to_id, status) VALUES (?, ?, 'pending')",
		)
		.bind(fromId, toId)
		.run();
}

export async function acceptFriendRequest(db: D1DB, fromId: string, toId: string): Promise<void> {
	await db
		.prepare("UPDATE friend_requests SET status = 'accepted' WHERE from_id = ? AND to_id = ?")
		.bind(fromId, toId)
		.run();
}

export async function rejectFriendRequest(db: D1DB, fromId: string, toId: string): Promise<void> {
	await db
		.prepare("DELETE FROM friend_requests WHERE from_id = ? AND to_id = ?")
		.bind(fromId, toId)
		.run();
}

// --- Messages ---
export type Message = {
	id: string;
	senderId: string;
	senderName: string;
	content: string;
	createdAt: string;
	readAt: string | null;
};

export async function getConversations(
	db: D1DB,
	userId: string,
): Promise<{ user: User; lastMessage: string; lastAt: string; unread: number }[]> {
	const all = await db
		.prepare(
			`SELECT id, sender_id, receiver_id, content, created_at, read_at FROM messages
       WHERE sender_id = ? OR receiver_id = ?
       ORDER BY created_at DESC`,
		)
		.bind(userId, userId)
		.all<{
			id: string;
			sender_id: string;
			receiver_id: string;
			content: string;
			created_at: string;
			read_at: string | null;
		}>();
	const byOther: Record<string, { lastMessage: string; lastAt: string; unread: number }> = {};
	for (const m of all.results ?? []) {
		const otherId = m.sender_id === userId ? m.receiver_id : m.sender_id;
		if (!byOther[otherId]) {
			byOther[otherId] = { lastMessage: m.content, lastAt: m.created_at, unread: 0 };
		}
		if (m.receiver_id === userId && !m.read_at) byOther[otherId].unread += 1;
	}
	const out: { user: User; lastMessage: string; lastAt: string; unread: number }[] = [];
	for (const otherId of Object.keys(byOther)) {
		const u = await db
			.prepare("SELECT id, email, name, provider FROM users WHERE id = ?")
			.bind(otherId)
			.first<User>();
		if (u) out.push({ user: u, ...byOther[otherId] });
	}
	out.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
	return out.slice(0, 50);
}

export async function getMessages(
	db: D1DB,
	userId: string,
	otherUserId: string,
	limit = 50,
): Promise<Message[]> {
	const rows = await db
		.prepare(
			`SELECT m.id, m.sender_id, m.content, m.created_at, m.read_at, u.name as sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
       ORDER BY m.created_at DESC LIMIT ?`,
		)
		.bind(userId, otherUserId, otherUserId, userId, limit)
		.all<{
			id: string;
			sender_id: string;
			content: string;
			created_at: string;
			read_at: string | null;
			sender_name: string;
		}>();
	const list = (rows.results ?? []).reverse();
	await db
		.prepare(
			"UPDATE messages SET read_at = datetime('now') WHERE receiver_id = ? AND sender_id = ? AND read_at IS NULL",
		)
		.bind(userId, otherUserId)
		.run();
	return list.map((r) => ({
		id: r.id,
		senderId: r.sender_id,
		senderName: r.sender_name,
		content: r.content,
		createdAt: r.created_at,
		readAt: r.read_at,
	}));
}

export async function sendMessage(
	db: D1DB,
	senderId: string,
	receiverId: string,
	content: string,
): Promise<Message> {
	const id = `msg-${crypto.randomUUID()}`;
	const user = await db
		.prepare("SELECT name FROM users WHERE id = ?")
		.bind(senderId)
		.first<{ name: string }>();
	await db
		.prepare("INSERT INTO messages (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)")
		.bind(id, senderId, receiverId, content)
		.run();
	return {
		id,
		senderId,
		senderName: user?.name ?? "Unknown",
		content,
		createdAt: new Date().toISOString(),
		readAt: null,
	};
}

// --- Court queue (digital paddle stack: no paddles on the floor) ---
export type QueueEntry = { userId: string; userName: string; position: number; createdAt: string };

export async function getCourtQueue(db: D1DB, courtId: string): Promise<QueueEntry[]> {
	const rows = await db
		.prepare(
			`SELECT cq.user_id, cq.created_at, u.name as user_name
       FROM court_queue cq
       JOIN users u ON cq.user_id = u.id
       WHERE cq.court_id = ?
       ORDER BY cq.created_at ASC`,
		)
		.bind(courtId)
		.all<{ user_id: string; user_name: string; created_at: string }>();
	const results = rows.results ?? [];
	return results.map((r, i) => ({
		userId: r.user_id,
		userName: r.user_name,
		position: i + 1,
		createdAt: r.created_at,
	}));
}

export async function getQueuesForCourts(
	db: D1DB,
	courtIds: string[],
): Promise<Record<string, QueueEntry[]>> {
	const out: Record<string, QueueEntry[]> = {};
	for (const courtId of courtIds) {
		out[courtId] = await getCourtQueue(db, courtId);
	}
	return out;
}

export async function joinCourtQueue(db: D1DB, courtId: string, userId: string): Promise<void> {
	await db
		.prepare(
			"INSERT OR IGNORE INTO court_queue (court_id, user_id, created_at) VALUES (?, ?, datetime('now'))",
		)
		.bind(courtId, userId)
		.run();
	// First person in queue becomes creator/admin
	const admins = await getCourtAdmins(db, courtId);
	if (admins.length === 0) {
		await db
			.prepare(
				"INSERT OR IGNORE INTO court_admins (court_id, user_id, created_at) VALUES (?, ?, datetime('now'))",
			)
			.bind(courtId, userId)
			.run();
	}
}

export async function leaveCourtQueue(db: D1DB, courtId: string, userId: string): Promise<void> {
	await db
		.prepare("DELETE FROM court_queue WHERE court_id = ? AND user_id = ?")
		.bind(courtId, userId)
		.run();
}

export async function isInQueue(db: D1DB, courtId: string, userId: string): Promise<boolean> {
	const row = await db
		.prepare("SELECT 1 FROM court_queue WHERE court_id = ? AND user_id = ?")
		.bind(courtId, userId)
		.first();
	return !!row;
}

// --- Room codes: shareable hash so others can scan QR or enter code to join queue ---
export async function getCourtByCode(db: D1DB, code: string): Promise<string | null> {
	const row = await db
		.prepare("SELECT court_id FROM court_room_codes WHERE UPPER(TRIM(?)) = UPPER(code)")
		.bind(code)
		.first<{ court_id: string }>();
	return row?.court_id ?? null;
}

export async function getCodeForCourt(db: D1DB, courtId: string): Promise<string | null> {
	const row = await db
		.prepare("SELECT code FROM court_room_codes WHERE court_id = ?")
		.bind(courtId)
		.first<{ code: string }>();
	return row?.code ?? null;
}

export async function getCodesForCourts(
	db: D1DB,
	courtIds: string[],
): Promise<Record<string, string>> {
	const out: Record<string, string> = {};
	for (const courtId of courtIds) {
		const code = await getCodeForCourt(db, courtId);
		if (code) out[courtId] = code;
	}
	return out;
}

// --- Court admins: creator (first admin) can make others admin ---
export type CourtAdminEntry = { userId: string; userName: string; createdAt: string };

export async function getCourtAdmins(db: D1DB, courtId: string): Promise<CourtAdminEntry[]> {
	const rows = await db
		.prepare(
			`SELECT ca.user_id, ca.created_at, u.name as user_name
       FROM court_admins ca
       JOIN users u ON ca.user_id = u.id
       WHERE ca.court_id = ?
       ORDER BY ca.created_at ASC`,
		)
		.bind(courtId)
		.all<{ user_id: string; user_name: string; created_at: string }>();
	return (rows.results ?? []).map((r) => ({
		userId: r.user_id,
		userName: r.user_name,
		createdAt: r.created_at,
	}));
}

export async function getAdminsForCourts(
	db: D1DB,
	courtIds: string[],
): Promise<Record<string, CourtAdminEntry[]>> {
	const out: Record<string, CourtAdminEntry[]> = {};
	for (const courtId of courtIds) {
		out[courtId] = await getCourtAdmins(db, courtId);
	}
	return out;
}

export async function isCourtAdmin(db: D1DB, courtId: string, userId: string): Promise<boolean> {
	const row = await db
		.prepare("SELECT 1 FROM court_admins WHERE court_id = ? AND user_id = ?")
		.bind(courtId, userId)
		.first();
	return !!row;
}

export async function addCourtAdmin(db: D1DB, courtId: string, userId: string): Promise<void> {
	await db
		.prepare(
			"INSERT OR IGNORE INTO court_admins (court_id, user_id, created_at) VALUES (?, ?, datetime('now'))",
		)
		.bind(courtId, userId)
		.run();
}

export async function removeCourtAdmin(db: D1DB, courtId: string, userId: string): Promise<void> {
	await db
		.prepare("DELETE FROM court_admins WHERE court_id = ? AND user_id = ?")
		.bind(courtId, userId)
		.run();
}

// --- Tournaments: single-elimination, admin creates and chooses who progresses ---
export type Tournament = {
	id: string;
	name: string;
	adminId: string;
	adminName: string;
	status: string;
	createdAt: string;
};
export type TournamentParticipant = { userId: string; userName: string; seed: number };
export type BracketMatch = {
	id: string;
	tournamentId: string;
	round: number;
	matchOrder: number;
	player1Id: string | null;
	player1Name: string | null;
	player2Id: string | null;
	player2Name: string | null;
	winnerId: string | null;
	winnerName: string | null;
	nextMatchId: string | null;
	nextSlot: number | null;
};

export async function createTournament(db: D1DB, name: string, adminId: string): Promise<string> {
	const id = `tournament-${crypto.randomUUID()}`;
	await db
		.prepare("INSERT INTO tournaments (id, name, admin_id, status) VALUES (?, ?, ?, 'draft')")
		.bind(id, name, adminId)
		.run();
	return id;
}

export async function getTournaments(db: D1DB, limit = 50): Promise<Tournament[]> {
	const rows = await db
		.prepare(
			`SELECT t.id, t.name, t.admin_id, t.status, t.created_at, u.name as admin_name
       FROM tournaments t
       JOIN users u ON t.admin_id = u.id
       ORDER BY t.created_at DESC LIMIT ?`,
		)
		.bind(limit)
		.all<{
			id: string;
			name: string;
			admin_id: string;
			status: string;
			created_at: string;
			admin_name: string;
		}>();
	return (rows.results ?? []).map((r) => ({
		id: r.id,
		name: r.name,
		adminId: r.admin_id,
		adminName: r.admin_name,
		status: r.status,
		createdAt: r.created_at,
	}));
}

export async function getTournament(db: D1DB, id: string): Promise<Tournament | null> {
	const row = await db
		.prepare(
			`SELECT t.id, t.name, t.admin_id, t.status, t.created_at, u.name as admin_name
       FROM tournaments t
       JOIN users u ON t.admin_id = u.id
       WHERE t.id = ?`,
		)
		.bind(id)
		.first<{
			id: string;
			name: string;
			admin_id: string;
			status: string;
			created_at: string;
			admin_name: string;
		}>();
	if (!row) return null;
	return {
		id: row.id,
		name: row.name,
		adminId: row.admin_id,
		adminName: row.admin_name,
		status: row.status,
		createdAt: row.created_at,
	};
}

export async function isTournamentAdmin(
	db: D1DB,
	tournamentId: string,
	userId: string,
): Promise<boolean> {
	const row = await db
		.prepare("SELECT 1 FROM tournaments WHERE id = ? AND admin_id = ?")
		.bind(tournamentId, userId)
		.first();
	return !!row;
}

export async function getTournamentParticipants(
	db: D1DB,
	tournamentId: string,
): Promise<TournamentParticipant[]> {
	const rows = await db
		.prepare(
			`SELECT tp.user_id, tp.seed, u.name as user_name
       FROM tournament_participants tp
       JOIN users u ON tp.user_id = u.id
       WHERE tp.tournament_id = ?
       ORDER BY tp.seed ASC`,
		)
		.bind(tournamentId)
		.all<{ user_id: string; seed: number; user_name: string }>();
	return (rows.results ?? []).map((r) => ({
		userId: r.user_id,
		userName: r.user_name,
		seed: r.seed,
	}));
}

export async function addTournamentParticipant(
	db: D1DB,
	tournamentId: string,
	userId: string,
): Promise<void> {
	const count = await db
		.prepare("SELECT COUNT(*) as c FROM tournament_participants WHERE tournament_id = ?")
		.bind(tournamentId)
		.first<{ c: number }>();
	const seed = (count?.c ?? 0) + 1;
	await db
		.prepare(
			"INSERT OR IGNORE INTO tournament_participants (tournament_id, user_id, seed) VALUES (?, ?, ?)",
		)
		.bind(tournamentId, userId, seed)
		.run();
}

export async function startTournament(db: D1DB, tournamentId: string): Promise<{ error?: string }> {
	const participants = await getTournamentParticipants(db, tournamentId);
	const n = participants.length;
	if (n < 2) return { error: "Need at least 2 participants" };
	const log2 = Math.log2(n);
	if (Math.floor(log2) !== log2)
		return { error: "Participants must be a power of 2 (2, 4, 8, 16)" };
	await db
		.prepare("UPDATE tournaments SET status = 'in_progress' WHERE id = ?")
		.bind(tournamentId)
		.run();
	const numRounds = Math.ceil(Math.log2(n));
	const _round1Matches = n / 2;
	const matchIds: string[][] = [];
	for (let round = 1; round <= numRounds; round++) {
		const matchesInRound = n / 2 ** round;
		matchIds[round] = [];
		for (let order = 1; order <= matchesInRound; order++) {
			const id = `match-${crypto.randomUUID()}`;
			matchIds[round].push(id);
			const isRound1 = round === 1;
			const p1 = isRound1 ? participants[(order - 1) * 2] : null;
			const p2 = isRound1 ? participants[(order - 1) * 2 + 1] : null;
			const _nextMatchId = round < numRounds ? null : null;
			const _nextSlot = round < numRounds ? null : null;
			await db
				.prepare(
					"INSERT INTO bracket_matches (id, tournament_id, round, match_order, player1_id, player2_id, next_match_id, next_slot) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
				)
				.bind(id, tournamentId, round, order, p1?.userId ?? null, p2?.userId ?? null, null, null)
				.run();
		}
	}
	for (let round = 1; round < numRounds; round++) {
		const matchesInRound = matchIds[round].length;
		for (let order = 1; order <= matchesInRound; order++) {
			const matchId = matchIds[round][order - 1];
			const nextRound = round + 1;
			const nextOrder = Math.ceil(order / 2);
			const nextMatchId = matchIds[nextRound][nextOrder - 1];
			const nextSlot = order % 2 === 1 ? 1 : 2;
			await db
				.prepare("UPDATE bracket_matches SET next_match_id = ?, next_slot = ? WHERE id = ?")
				.bind(nextMatchId, nextSlot, matchId)
				.run();
		}
	}
	return {};
}

export async function getBracketMatches(db: D1DB, tournamentId: string): Promise<BracketMatch[]> {
	const rows = await db
		.prepare(
			`SELECT m.id, m.tournament_id, m.round, m.match_order, m.player1_id, m.player2_id, m.winner_id, m.next_match_id, m.next_slot
       FROM bracket_matches m
       WHERE m.tournament_id = ?
       ORDER BY m.round ASC, m.match_order ASC`,
		)
		.bind(tournamentId)
		.all<{
			id: string;
			tournament_id: string;
			round: number;
			match_order: number;
			player1_id: string | null;
			player2_id: string | null;
			winner_id: string | null;
			next_match_id: string | null;
			next_slot: number | null;
		}>();
	const out: BracketMatch[] = [];
	for (const r of rows.results ?? []) {
		let p1Name: string | null = null;
		let p2Name: string | null = null;
		let winnerName: string | null = null;
		if (r.player1_id)
			p1Name =
				(
					await db
						.prepare("SELECT name FROM users WHERE id = ?")
						.bind(r.player1_id)
						.first<{ name: string }>()
				)?.name ?? null;
		if (r.player2_id)
			p2Name =
				(
					await db
						.prepare("SELECT name FROM users WHERE id = ?")
						.bind(r.player2_id)
						.first<{ name: string }>()
				)?.name ?? null;
		if (r.winner_id)
			winnerName =
				(
					await db
						.prepare("SELECT name FROM users WHERE id = ?")
						.bind(r.winner_id)
						.first<{ name: string }>()
				)?.name ?? null;
		out.push({
			id: r.id,
			tournamentId: r.tournament_id,
			round: r.round,
			matchOrder: r.match_order,
			player1Id: r.player1_id,
			player1Name: p1Name,
			player2Id: r.player2_id,
			player2Name: p2Name,
			winnerId: r.winner_id,
			winnerName,
			nextMatchId: r.next_match_id,
			nextSlot: r.next_slot,
		});
	}
	return out;
}

export async function setMatchWinner(
	db: D1DB,
	matchId: string,
	winnerId: string,
): Promise<{ error?: string }> {
	const match = await db
		.prepare(
			"SELECT id, tournament_id, player1_id, player2_id, next_match_id, next_slot FROM bracket_matches WHERE id = ?",
		)
		.bind(matchId)
		.first<{
			id: string;
			tournament_id: string;
			player1_id: string | null;
			player2_id: string | null;
			next_match_id: string | null;
			next_slot: number | null;
		}>();
	if (!match) return { error: "Match not found" };
	if (winnerId !== match.player1_id && winnerId !== match.player2_id)
		return { error: "Winner must be a player in this match" };
	await db
		.prepare("UPDATE bracket_matches SET winner_id = ? WHERE id = ?")
		.bind(winnerId, matchId)
		.run();
	if (match.next_match_id && match.next_slot) {
		if (match.next_slot === 1) {
			await db
				.prepare("UPDATE bracket_matches SET player1_id = ? WHERE id = ?")
				.bind(winnerId, match.next_match_id)
				.run();
		} else {
			await db
				.prepare("UPDATE bracket_matches SET player2_id = ? WHERE id = ?")
				.bind(winnerId, match.next_match_id)
				.run();
		}
	}
	return {};
}

// --- Coaching / private lessons: users advertise themselves ---
export type CoachingListing = {
	id: string;
	userId: string;
	userName: string;
	title: string;
	description: string | null;
	location: string | null;
	availability: string | null;
	rate: string | null;
	contactInfo: string | null;
	createdAt: string;
};

export async function getCoachingListings(db: D1DB, limit = 100): Promise<CoachingListing[]> {
	const rows = await db
		.prepare(
			`SELECT c.id, c.user_id, c.title, c.description, c.location, c.availability, c.rate, c.contact_info, c.created_at, u.name as user_name
       FROM coaching_listings c
       JOIN users u ON c.user_id = u.id
       ORDER BY c.created_at DESC
       LIMIT ?`,
		)
		.bind(limit)
		.all<{
			id: string;
			user_id: string;
			title: string;
			description: string | null;
			location: string | null;
			availability: string | null;
			rate: string | null;
			contact_info: string | null;
			created_at: string;
			user_name: string;
		}>();
	return (rows.results ?? []).map((r) => ({
		id: r.id,
		userId: r.user_id,
		userName: r.user_name,
		title: r.title,
		description: r.description,
		location: r.location,
		availability: r.availability,
		rate: r.rate,
		contactInfo: r.contact_info,
		createdAt: r.created_at,
	}));
}

export async function createCoachingListing(
	db: D1DB,
	userId: string,
	data: {
		title: string;
		description?: string;
		location?: string;
		availability?: string;
		rate?: string;
		contactInfo?: string;
	},
): Promise<CoachingListing> {
	const id = `coaching-${crypto.randomUUID()}`;
	await db
		.prepare(
			`INSERT INTO coaching_listings (id, user_id, title, description, location, availability, rate, contact_info)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		)
		.bind(
			id,
			userId,
			data.title,
			data.description ?? null,
			data.location ?? null,
			data.availability ?? null,
			data.rate ?? null,
			data.contactInfo ?? null,
		)
		.run();
	const user = await db
		.prepare("SELECT name FROM users WHERE id = ?")
		.bind(userId)
		.first<{ name: string }>();
	return {
		id,
		userId,
		userName: user?.name ?? "Unknown",
		title: data.title,
		description: data.description ?? null,
		location: data.location ?? null,
		availability: data.availability ?? null,
		rate: data.rate ?? null,
		contactInfo: data.contactInfo ?? null,
		createdAt: new Date().toISOString(),
	};
}

export async function deleteCoachingListing(
	db: D1DB,
	listingId: string,
	userId: string,
): Promise<{ error?: string }> {
	const row = await db
		.prepare("SELECT user_id FROM coaching_listings WHERE id = ?")
		.bind(listingId)
		.first<{ user_id: string }>();
	if (!row) return { error: "Listing not found" };
	if (row.user_id !== userId) return { error: "You can only delete your own listing" };
	await db.prepare("DELETE FROM coaching_listings WHERE id = ?").bind(listingId).run();
	return {};
}

// --- Courts directory (Pickleheads-style court finder, add a court) ---
export type Court = {
	id: string;
	name: string;
	address: string | null;
	city: string | null;
	state: string | null;
	country: string;
	courtCount: number;
	amenities: string | null;
	courtType: string | null;
	reservable: boolean;
	createdBy: string | null;
	createdAt: string;
};

export async function getCourts(
	db: D1DB,
	opts?: { city?: string; limit?: number },
): Promise<Court[]> {
	try {
		const limit = opts?.limit ?? 200;
		let query =
			"SELECT id, name, address, city, state, country, court_count, amenities, court_type, reservable, created_by, created_at FROM courts ORDER BY name LIMIT ?";
		const params: (string | number)[] = [limit];
		if (opts?.city?.trim()) {
			query =
				"SELECT id, name, address, city, state, country, court_count, amenities, court_type, reservable, created_by, created_at FROM courts WHERE LOWER(TRIM(city)) = LOWER(TRIM(?)) ORDER BY name LIMIT ?";
			params.unshift(opts.city.trim());
		}
		const rows = await db
			.prepare(query)
			.bind(...params)
			.all<{
				id: string;
				name: string;
				address: string | null;
				city: string | null;
				state: string | null;
				country: string;
				court_count: number;
				amenities: string | null;
				court_type: string | null;
				reservable: number;
				created_by: string | null;
				created_at: string;
			}>();
		return (rows.results ?? []).map((r) => ({
			id: r.id,
			name: r.name,
			address: r.address,
			city: r.city,
			state: r.state,
			country: r.country,
			courtCount: r.court_count,
			amenities: r.amenities,
			courtType: r.court_type,
			reservable: !!r.reservable,
			createdBy: r.created_by,
			createdAt: r.created_at,
		}));
	} catch {
		return [];
	}
}

export async function getCourt(db: D1DB, id: string): Promise<Court | null> {
	const row = await db
		.prepare(
			"SELECT id, name, address, city, state, country, court_count, amenities, court_type, reservable, created_by, created_at FROM courts WHERE id = ?",
		)
		.bind(id)
		.first<{
			id: string;
			name: string;
			address: string | null;
			city: string | null;
			state: string | null;
			country: string;
			court_count: number;
			amenities: string | null;
			court_type: string | null;
			reservable: number;
			created_by: string | null;
			created_at: string;
		}>();
	if (!row) return null;
	return {
		id: row.id,
		name: row.name,
		address: row.address,
		city: row.city,
		state: row.state,
		country: row.country,
		courtCount: row.court_count,
		amenities: row.amenities,
		courtType: row.court_type,
		reservable: !!row.reservable,
		createdBy: row.created_by,
		createdAt: row.created_at,
	};
}

export async function createCourt(
	db: D1DB,
	userId: string,
	data: {
		name: string;
		address?: string;
		city?: string;
		state?: string;
		country?: string;
		courtCount?: number;
		amenities?: string;
		courtType?: string;
		reservable?: boolean;
	},
): Promise<Court> {
	const id = `court-${crypto.randomUUID()}`;
	await db
		.prepare(
			"INSERT INTO courts (id, name, address, city, state, country, court_count, amenities, court_type, reservable, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
		)
		.bind(
			id,
			data.name,
			data.address ?? null,
			data.city ?? null,
			data.state ?? null,
			data.country ?? "USA",
			data.courtCount ?? 1,
			data.amenities ?? null,
			data.courtType ?? null,
			data.reservable ? 1 : 0,
			userId,
		)
		.run();
	const court = await getCourt(db, id);
	if (!court) throw new Error("Failed to load created court");
	return court;
}

// --- Paddles (gear database: specs for comparison) ---
export type Paddle = {
	id: string;
	brand: string;
	model: string;
	coreType: string | null;
	faceMaterial: string | null;
	weightOz: number | null;
	swingWeight: number | null;
	shape: string | null;
	lengthIn: number | null;
	widthIn: number | null;
	thicknessIn: number | null;
	gripLengthIn: number | null;
	priceUsd: number | null;
	description: string | null;
	createdAt: string;
};

export async function getPaddles(
	db: D1DB,
	opts?: { brand?: string; coreType?: string; limit?: number },
): Promise<Paddle[]> {
	try {
		const limit = opts?.limit ?? 200;
		const base =
			"SELECT id, brand, model, core_type, face_material, weight_oz, swing_weight, shape, length_in, width_in, thickness_in, grip_length_in, price_usd, description, created_at FROM paddles";
		const conditions: string[] = [];
		const params: (string | number)[] = [];
		if (opts?.brand?.trim()) {
			conditions.push("LOWER(TRIM(brand)) = LOWER(TRIM(?))");
			params.push(opts.brand.trim());
		}
		if (opts?.coreType?.trim()) {
			conditions.push("LOWER(TRIM(core_type)) = LOWER(TRIM(?))");
			params.push(opts.coreType.trim());
		}
		const where = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";
		const query = `${base}${where} ORDER BY brand, model LIMIT ?`;
		params.push(limit);
		const rows = await db
			.prepare(query)
			.bind(...params)
			.all<{
				id: string;
				brand: string;
				model: string;
				core_type: string | null;
				face_material: string | null;
				weight_oz: number | null;
				swing_weight: number | null;
				shape: string | null;
				length_in: number | null;
				width_in: number | null;
				thickness_in: number | null;
				grip_length_in: number | null;
				price_usd: number | null;
				description: string | null;
				created_at: string;
			}>();
		return (rows.results ?? []).map((r) => ({
			id: r.id,
			brand: r.brand,
			model: r.model,
			coreType: r.core_type,
			faceMaterial: r.face_material,
			weightOz: r.weight_oz,
			swingWeight: r.swing_weight,
			shape: r.shape,
			lengthIn: r.length_in,
			widthIn: r.width_in,
			thicknessIn: r.thickness_in,
			gripLengthIn: r.grip_length_in,
			priceUsd: r.price_usd,
			description: r.description,
			createdAt: r.created_at,
		}));
	} catch {
		return [];
	}
}

export async function getPaddle(db: D1DB, id: string): Promise<Paddle | null> {
	const row = await db
		.prepare(
			"SELECT id, brand, model, core_type, face_material, weight_oz, swing_weight, shape, length_in, width_in, thickness_in, grip_length_in, price_usd, description, created_at FROM paddles WHERE id = ?",
		)
		.bind(id)
		.first<{
			id: string;
			brand: string;
			model: string;
			core_type: string | null;
			face_material: string | null;
			weight_oz: number | null;
			swing_weight: number | null;
			shape: string | null;
			length_in: number | null;
			width_in: number | null;
			thickness_in: number | null;
			grip_length_in: number | null;
			price_usd: number | null;
			description: string | null;
			created_at: string;
		}>();
	if (!row) return null;
	return {
		id: row.id,
		brand: row.brand,
		model: row.model,
		coreType: row.core_type,
		faceMaterial: row.face_material,
		weightOz: row.weight_oz,
		swingWeight: row.swing_weight,
		shape: row.shape,
		lengthIn: row.length_in,
		widthIn: row.width_in,
		thicknessIn: row.thickness_in,
		gripLengthIn: row.grip_length_in,
		priceUsd: row.price_usd,
		description: row.description,
		createdAt: row.created_at,
	};
}

// --- Regions (PlayTime Scheduler-style: country + region) ---
export type Region = {
	id: string;
	country: string;
	name: string;
	color: string | null;
	createdAt: string;
};

export async function getRegions(db: D1DB, limit = 100): Promise<Region[]> {
	const rows = await db
		.prepare(
			"SELECT id, country, name, color, created_at as created_at FROM regions ORDER BY country, name LIMIT ?",
		)
		.bind(limit)
		.all<{ id: string; country: string; name: string; color: string | null; created_at: string }>();
	return (rows.results ?? []).map((r) => ({
		id: r.id,
		country: r.country,
		name: r.name,
		color: r.color,
		createdAt: r.created_at,
	}));
}

export async function createRegion(
	db: D1DB,
	country: string,
	name: string,
	color?: string,
): Promise<Region> {
	const id = `region-${crypto.randomUUID()}`;
	await db
		.prepare("INSERT INTO regions (id, country, name, color) VALUES (?, ?, ?, ?)")
		.bind(id, country, name, color ?? null)
		.run();
	return { id, country, name, color: color ?? null, createdAt: new Date().toISOString() };
}

// --- Play sessions (arrange play with others; not court reservation) ---
export type PlaySession = {
	id: string;
	creatorId: string;
	creatorName: string;
	regionId: string | null;
	regionName: string | null;
	regionColor: string | null;
	venue: string;
	sessionDate: string;
	sessionTime: string;
	skillLevel: string | null;
	formatType: string | null;
	eventName: string | null;
	playerMin: number;
	playerMax: number | null;
	signupCount: number;
	mySignup: boolean;
	gameOn: boolean;
	createdAt: string;
	courtId?: string | null;
	isRecurring?: boolean;
	recurrenceDay?: string | null;
	waitlistCount?: number;
	myWaitlist?: boolean;
	isFull?: boolean;
};

export type SessionNote = {
	id: string;
	sessionId: string;
	userId: string;
	userName: string;
	content: string;
	createdAt: string;
};

export type SessionSignup = { userId: string; userName: string; createdAt: string };

type PlaySessionRow = {
	id: string;
	creator_id: string;
	region_id: string | null;
	venue: string;
	session_date: string;
	session_time: string;
	skill_level: string | null;
	format_type: string | null;
	event_name: string | null;
	player_min: number;
	player_max: number | null;
	created_at: string;
	creator_name: string;
	court_id?: string | null;
	is_recurring?: number;
	recurrence_day?: string | null;
};

export async function getPlaySessionsForWeek(
	db: D1DB,
	startDate: string,
	endDate: string,
	currentUserId: string | null,
): Promise<PlaySession[]> {
	let rows: { results?: PlaySessionRow[] };
	try {
		rows = await db
			.prepare(
				`SELECT s.id, s.creator_id, s.region_id, s.venue, s.session_date, s.session_time, s.skill_level, s.format_type, s.event_name, s.player_min, s.player_max, s.created_at, u.name as creator_name,
         s.court_id, s.is_recurring, s.recurrence_day
       FROM play_sessions s
       JOIN users u ON s.creator_id = u.id
       WHERE s.session_date >= ? AND s.session_date <= ?
       ORDER BY s.session_date, s.session_time`,
			)
			.bind(startDate, endDate)
			.all<PlaySessionRow>();
	} catch {
		rows = await db
			.prepare(
				`SELECT s.id, s.creator_id, s.region_id, s.venue, s.session_date, s.session_time, s.skill_level, s.format_type, s.event_name, s.player_min, s.player_max, s.created_at, u.name as creator_name
       FROM play_sessions s
       JOIN users u ON s.creator_id = u.id
       WHERE s.session_date >= ? AND s.session_date <= ?
       ORDER BY s.session_date, s.session_time`,
			)
			.bind(startDate, endDate)
			.all<PlaySessionRow>();
	}
	const out: PlaySession[] = [];
	for (const r of rows.results ?? []) {
		const signupCount = await db
			.prepare("SELECT COUNT(*) as c FROM play_session_signups WHERE session_id = ?")
			.bind(r.id)
			.first<{ c: number }>();
		const count = signupCount?.c ?? 0;
		let mySignup = false;
		let waitlistCount = 0;
		let myWaitlist = false;
		if (currentUserId) {
			const me = await db
				.prepare("SELECT 1 FROM play_session_signups WHERE session_id = ? AND user_id = ?")
				.bind(r.id, currentUserId)
				.first();
			mySignup = !!me;
			try {
				const wl = await db
					.prepare("SELECT COUNT(*) as c FROM play_session_waitlist WHERE session_id = ?")
					.bind(r.id)
					.first<{ c: number }>();
				waitlistCount = wl?.c ?? 0;
				const onWl = await db
					.prepare("SELECT 1 FROM play_session_waitlist WHERE session_id = ? AND user_id = ?")
					.bind(r.id, currentUserId)
					.first();
				myWaitlist = !!onWl;
			} catch {
				// waitlist table may not exist yet
			}
		}
		const playerMax = r.player_max ?? 999;
		const isFull = playerMax > 0 && count >= playerMax;
		let regionName: string | null = null;
		let regionColor: string | null = null;
		if (r.region_id) {
			const reg = await db
				.prepare("SELECT name, color FROM regions WHERE id = ?")
				.bind(r.region_id)
				.first<{ name: string; color: string | null }>();
			regionName = reg?.name ?? null;
			regionColor = reg?.color ?? null;
		}
		out.push({
			id: r.id,
			creatorId: r.creator_id,
			creatorName: r.creator_name,
			regionId: r.region_id,
			regionName,
			regionColor,
			venue: r.venue,
			sessionDate: r.session_date,
			sessionTime: r.session_time,
			skillLevel: r.skill_level,
			formatType: r.format_type,
			eventName: r.event_name,
			playerMin: r.player_min,
			playerMax: r.player_max,
			signupCount: count,
			mySignup,
			gameOn: count >= r.player_min,
			createdAt: r.created_at,
			courtId: r.court_id ?? null,
			isRecurring: !!(r.is_recurring ?? 0),
			recurrenceDay: r.recurrence_day ?? null,
			waitlistCount,
			myWaitlist,
			isFull,
		});
	}
	return out;
}

export async function getPlaySession(
	db: D1DB,
	sessionId: string,
	currentUserId: string | null,
): Promise<PlaySession | null> {
	const [start, end] = ["1970-01-01", "2099-12-31"];
	const sessions = await getPlaySessionsForWeek(db, start, end, currentUserId);
	return sessions.find((s) => s.id === sessionId) ?? null;
}

export async function getSessionSignups(db: D1DB, sessionId: string): Promise<SessionSignup[]> {
	const rows = await db
		.prepare(
			`SELECT ss.user_id, ss.created_at, u.name as user_name FROM play_session_signups ss JOIN users u ON ss.user_id = u.id WHERE ss.session_id = ? ORDER BY ss.created_at ASC`,
		)
		.bind(sessionId)
		.all<{ user_id: string; user_name: string; created_at: string }>();
	return (rows.results ?? []).map((r) => ({
		userId: r.user_id,
		userName: r.user_name,
		createdAt: r.created_at,
	}));
}

export async function getSessionNotes(db: D1DB, sessionId: string): Promise<SessionNote[]> {
	const rows = await db
		.prepare(
			`SELECT n.id, n.session_id, n.user_id, n.content, n.created_at, u.name as user_name FROM play_session_notes n JOIN users u ON n.user_id = u.id WHERE n.session_id = ? ORDER BY n.created_at ASC`,
		)
		.bind(sessionId)
		.all<{
			id: string;
			session_id: string;
			user_id: string;
			content: string;
			created_at: string;
			user_name: string;
		}>();
	return (rows.results ?? []).map((r) => ({
		id: r.id,
		sessionId: r.session_id,
		userId: r.user_id,
		userName: r.user_name,
		content: r.content,
		createdAt: r.created_at,
	}));
}

export async function createPlaySession(
	db: D1DB,
	creatorId: string,
	data: {
		venue: string;
		sessionDate: string;
		sessionTime: string;
		regionId?: string;
		courtId?: string;
		skillLevel?: string;
		formatType?: string;
		eventName?: string;
		playerMin?: number;
		playerMax?: number;
		isRecurring?: boolean;
		recurrenceDay?: string;
	},
): Promise<PlaySession> {
	const id = `session-${crypto.randomUUID()}`;
	try {
		await db
			.prepare(
				`INSERT INTO play_sessions (id, creator_id, region_id, court_id, venue, session_date, session_time, skill_level, format_type, event_name, player_min, player_max, is_recurring, recurrence_day) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			)
			.bind(
				id,
				creatorId,
				data.regionId ?? null,
				data.courtId ?? null,
				data.venue,
				data.sessionDate,
				data.sessionTime,
				data.skillLevel ?? null,
				data.formatType ?? null,
				data.eventName ?? null,
				data.playerMin ?? 4,
				data.playerMax ?? null,
				data.isRecurring ? 1 : 0,
				data.recurrenceDay ?? null,
			)
			.run();
	} catch {
		await db
			.prepare(
				`INSERT INTO play_sessions (id, creator_id, region_id, venue, session_date, session_time, skill_level, format_type, event_name, player_min, player_max) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			)
			.bind(
				id,
				creatorId,
				data.regionId ?? null,
				data.venue,
				data.sessionDate,
				data.sessionTime,
				data.skillLevel ?? null,
				data.formatType ?? null,
				data.eventName ?? null,
				data.playerMin ?? 4,
				data.playerMax ?? null,
			)
			.run();
	}
	const session = await getPlaySession(db, id, creatorId);
	if (!session) throw new Error("Failed to load created session");
	return session;
}

export async function joinPlaySession(
	db: D1DB,
	sessionId: string,
	userId: string,
): Promise<{ error?: string }> {
	await db
		.prepare("INSERT OR IGNORE INTO play_session_signups (session_id, user_id) VALUES (?, ?)")
		.bind(sessionId, userId)
		.run();
	return {};
}

export async function leavePlaySession(db: D1DB, sessionId: string, userId: string): Promise<void> {
	await db
		.prepare("DELETE FROM play_session_signups WHERE session_id = ? AND user_id = ?")
		.bind(sessionId, userId)
		.run();
}

export async function addSessionNote(
	db: D1DB,
	sessionId: string,
	userId: string,
	content: string,
): Promise<SessionNote> {
	const id = `note-${crypto.randomUUID()}`;
	const user = await db
		.prepare("SELECT name FROM users WHERE id = ?")
		.bind(userId)
		.first<{ name: string }>();
	await db
		.prepare(
			"INSERT INTO play_session_notes (id, session_id, user_id, content) VALUES (?, ?, ?, ?)",
		)
		.bind(id, sessionId, userId, content)
		.run();
	return {
		id,
		sessionId,
		userId,
		userName: user?.name ?? "Unknown",
		content,
		createdAt: new Date().toISOString(),
	};
}

export async function getSessionWaitlist(db: D1DB, sessionId: string): Promise<SessionSignup[]> {
	try {
		const rows = await db
			.prepare(
				`SELECT w.user_id, w.created_at, u.name as user_name FROM play_session_waitlist w JOIN users u ON w.user_id = u.id WHERE w.session_id = ? ORDER BY w.created_at ASC`,
			)
			.bind(sessionId)
			.all<{ user_id: string; user_name: string; created_at: string }>();
		return (rows.results ?? []).map((r) => ({
			userId: r.user_id,
			userName: r.user_name,
			createdAt: r.created_at,
		}));
	} catch {
		return [];
	}
}

export async function joinSessionWaitlist(
	db: D1DB,
	sessionId: string,
	userId: string,
): Promise<{ error?: string }> {
	try {
		await db
			.prepare("INSERT OR IGNORE INTO play_session_waitlist (session_id, user_id) VALUES (?, ?)")
			.bind(sessionId, userId)
			.run();
		return {};
	} catch {
		return { error: "Waitlist not available" };
	}
}

export async function leaveSessionWaitlist(
	db: D1DB,
	sessionId: string,
	userId: string,
): Promise<void> {
	try {
		await db
			.prepare("DELETE FROM play_session_waitlist WHERE session_id = ? AND user_id = ?")
			.bind(sessionId, userId)
			.run();
	} catch {
		// table may not exist
	}
}
