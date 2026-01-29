import { Link, useLoaderData, redirect } from "react-router";
import type { Route } from "./+types/demo";
import {
	getSessionToken,
	getSessionUser,
	createSession,
	sessionCookie,
	getPosts,
	getCourts,
	getQueuesForCourts,
	getCoachingListings,
} from "~/lib/db.server";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "Demo showcase - Pickleball" },
		{ name: "description", content: "Explore every feature of the Pickleball app with seeded demo data." },
	];
}

/**
 * One-click demo: log in as the seeded demo user (Alex, demo@pickleball.app)
 * and show a rich showcase page with all demo data.
 *
 * If user is NOT logged in: create session for demo user, redirect back to /demo.
 * If user IS logged in: load all data and render showcase.
 */
export async function loader({ context, request }: Route.LoaderArgs) {
	const db = context.cloudflare.env.DB;
	if (!db) return redirect("/home");

	const token = getSessionToken(request.headers.get("Cookie") ?? null);
	const user = await getSessionUser(db, token);

	// Not logged in: create a session for the demo user and redirect back here
	if (!user) {
		const demoUser = await db
			.prepare("SELECT id FROM users WHERE provider = 'demo' AND email = ?")
			.bind("demo@pickleball.app")
			.first<{ id: string }>();
		if (!demoUser) return redirect("/home");

		const sessionToken = await createSession(db, demoUser.id);
		return redirect("/demo", {
			headers: { "Set-Cookie": sessionCookie(sessionToken) },
		});
	}

	// Logged in: load everything
	const posts = await getPosts(db, user.id);
	const courts = await getCourts(db, { limit: 50 });
	const courtIds = courts.map((c) => c.id);
	const courtQueues = await getQueuesForCourts(db, courtIds);
	const coachingListings = await getCoachingListings(db, 100);

	// Friends count
	let friendCount = 0;
	try {
		const friendRow = await db
			.prepare(
				"SELECT COUNT(*) as count FROM friend_requests WHERE (from_id = ? OR to_id = ?) AND status = 'accepted'",
			)
			.bind(user.id, user.id)
			.first<{ count: number }>();
		// Each friendship is stored once, but the query counts both directions for this user
		// so we divide by 1 (each row is one friendship involving this user)
		friendCount = friendRow?.count ?? 0;
	} catch {
		friendCount = 0;
	}

	// Messages
	type MessageRow = {
		id: string;
		sender_id: string;
		receiver_id: string;
		content: string;
		created_at: string;
		sender_name: string;
	};
	let messages: MessageRow[] = [];
	try {
		const msgRows = await db
			.prepare(
				`SELECT m.id, m.sender_id, m.receiver_id, m.content, m.created_at, u.name as sender_name
				FROM messages m
				JOIN users u ON u.id = m.sender_id
				WHERE m.receiver_id = ? OR m.sender_id = ?
				ORDER BY m.created_at DESC
				LIMIT 10`,
			)
			.bind(user.id, user.id)
			.all<MessageRow>();
		messages = msgRows.results ?? [];
	} catch {
		messages = [];
	}

	// Tournaments
	type TournamentRow = { id: string; name: string; status: string; admin_id: string };
	let tournaments: TournamentRow[] = [];
	try {
		const tRows = await db
			.prepare("SELECT id, name, status, admin_id FROM tournaments LIMIT 10")
			.all<TournamentRow>();
		tournaments = tRows.results ?? [];
	} catch {
		tournaments = [];
	}

	// Profile
	type ProfileRow = {
		user_id: string;
		bio: string | null;
		paddle: string | null;
		shoes: string | null;
		gear: string | null;
		dupr_link: string | null;
		skill_level: string | null;
		region_id: string | null;
		updated_at: string;
	};
	let profile: ProfileRow | null = null;
	try {
		profile = await db
			.prepare("SELECT * FROM user_profiles WHERE user_id = ?")
			.bind(user.id)
			.first<ProfileRow>();
	} catch {
		profile = null;
	}

	// Total queue count across all courts
	let totalQueueCount = 0;
	for (const entries of Object.values(courtQueues)) {
		totalQueueCount += entries.length;
	}

	return {
		user,
		posts,
		courts,
		courtQueues,
		totalQueueCount,
		coachingListings,
		friendCount,
		messages,
		tournaments,
		profile,
	};
}

function truncate(str: string, len: number): string {
	if (str.length <= len) return str;
	return str.slice(0, len) + "...";
}

function statusBadge(status: string) {
	const colors: Record<string, string> = {
		draft: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
		in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
		completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
	};
	return colors[status] ?? colors.draft;
}

export default function Demo() {
	const {
		user,
		posts,
		courts,
		totalQueueCount,
		coachingListings,
		friendCount,
		messages,
		tournaments,
		profile,
	} = useLoaderData<typeof loader>();

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-950">
			{/* Top nav */}
			<nav className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
				<div className="container mx-auto px-4 py-3 max-w-5xl">
					<div className="flex items-center justify-between">
						<Link
							to="/"
							className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent hover:opacity-90"
						>
							Pickleball
						</Link>
						<div className="flex items-center gap-3">
							<Link
								to="/home"
								className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
							>
								Home
							</Link>
							<div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
								<span className="text-sm text-gray-600 dark:text-gray-400">{user.name}</span>
								<Link
									to="/auth/logout"
									className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
								>
									Logout
								</Link>
							</div>
						</div>
					</div>
				</div>
			</nav>

			<main className="container mx-auto px-4 py-8 max-w-5xl">
				{/* Hero */}
				<div className="mb-10 text-center">
					<h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
						Welcome to the demo, {user.name}
					</h1>
					<p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
						You are logged in as the demo user. Below is a showcase of every feature, powered by
						seeded data. Tap any card to explore that section.
					</p>
				</div>

				{/* Feature grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
					{/* 1. Community Feed */}
					<Link
						to="/home"
						className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
					>
						<div className="text-3xl mb-3">📣</div>
						<h2 className="font-semibold text-gray-900 dark:text-white mb-1">Community Feed</h2>
						<p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
							{posts.length} post{posts.length !== 1 ? "s" : ""} in the feed
						</p>
						{posts.slice(0, 2).map((post) => (
							<div
								key={post.id}
								className="mb-2 text-sm text-gray-700 dark:text-gray-300 border-l-2 border-emerald-400 pl-3"
							>
								<span className="font-medium">{post.authorName}:</span>{" "}
								{truncate(post.content, 80)}
								<span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
									({post.likes} likes, {post.comments.length} comments)
								</span>
							</div>
						))}
						<span className="inline-block mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 group-hover:underline">
							Explore &rarr;
						</span>
					</Link>

					{/* 2. Courts */}
					<Link
						to="/courts"
						className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
					>
						<div className="text-3xl mb-3">🏟️</div>
						<h2 className="font-semibold text-gray-900 dark:text-white mb-1">Courts</h2>
						<p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
							{courts.length} court{courts.length !== 1 ? "s" : ""} in the directory
						</p>
						{courts.slice(0, 3).map((court) => (
							<div
								key={court.id}
								className="text-sm text-gray-700 dark:text-gray-300 mb-1"
							>
								{court.name}
								{court.city ? ` - ${court.city}` : ""}
								{court.state ? `, ${court.state}` : ""}
							</div>
						))}
						<span className="inline-block mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 group-hover:underline">
							Explore &rarr;
						</span>
					</Link>

					{/* 3. Court Queue */}
					<Link
						to="/home"
						className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
					>
						<div className="text-3xl mb-3">🎾</div>
						<h2 className="font-semibold text-gray-900 dark:text-white mb-1">Court Queue</h2>
						<p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
							{totalQueueCount} player{totalQueueCount !== 1 ? "s" : ""} in queues across all
							courts
						</p>
						<p className="text-sm text-gray-700 dark:text-gray-300">
							Digital paddle stack - no paddles on the floor! Join a queue, see your position,
							and get notified when it is your turn.
						</p>
						<span className="inline-block mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 group-hover:underline">
							Explore &rarr;
						</span>
					</Link>

					{/* 4. Coaching & Lessons */}
					<Link
						to="/home"
						className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
					>
						<div className="text-3xl mb-3">🎓</div>
						<h2 className="font-semibold text-gray-900 dark:text-white mb-1">
							Coaching & Lessons
						</h2>
						<p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
							{coachingListings.length} listing
							{coachingListings.length !== 1 ? "s" : ""} available
						</p>
						{coachingListings.slice(0, 2).map((listing) => (
							<div
								key={listing.id}
								className="text-sm text-gray-700 dark:text-gray-300 mb-1 border-l-2 border-teal-400 pl-3"
							>
								{listing.title}
								{listing.rate ? ` - ${listing.rate}` : ""}
							</div>
						))}
						<span className="inline-block mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 group-hover:underline">
							Explore &rarr;
						</span>
					</Link>

					{/* 5. Tournaments */}
					<Link
						to="/tournaments"
						className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
					>
						<div className="text-3xl mb-3">🏆</div>
						<h2 className="font-semibold text-gray-900 dark:text-white mb-1">Tournaments</h2>
						<p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
							{tournaments.length} tournament{tournaments.length !== 1 ? "s" : ""}
						</p>
						{tournaments.slice(0, 3).map((t) => (
							<div
								key={t.id}
								className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-1"
							>
								<span>{t.name}</span>
								<span
									className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(t.status)}`}
								>
									{t.status.replace("_", " ")}
								</span>
							</div>
						))}
						<span className="inline-block mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 group-hover:underline">
							Explore &rarr;
						</span>
					</Link>

					{/* 6. Friends */}
					<Link
						to="/friends"
						className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
					>
						<div className="text-3xl mb-3">👥</div>
						<h2 className="font-semibold text-gray-900 dark:text-white mb-1">Friends</h2>
						<p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
							{friendCount} friend{friendCount !== 1 ? "s" : ""} connected
						</p>
						<p className="text-sm text-gray-700 dark:text-gray-300">
							Send friend requests, accept incoming requests, and see your pickleball network
							grow.
						</p>
						<span className="inline-block mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 group-hover:underline">
							Explore &rarr;
						</span>
					</Link>

					{/* 7. Messages */}
					<Link
						to="/messages"
						className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
					>
						<div className="text-3xl mb-3">💬</div>
						<h2 className="font-semibold text-gray-900 dark:text-white mb-1">Messages</h2>
						<p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
							{messages.length} recent message{messages.length !== 1 ? "s" : ""}
						</p>
						{messages.slice(0, 3).map((msg) => (
							<div
								key={msg.id}
								className="text-sm text-gray-700 dark:text-gray-300 mb-1 border-l-2 border-emerald-400 pl-3"
							>
								<span className="font-medium">{msg.sender_name}:</span>{" "}
								{truncate(msg.content, 60)}
							</div>
						))}
						<span className="inline-block mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 group-hover:underline">
							Explore &rarr;
						</span>
					</Link>

					{/* 8. Profile */}
					<Link
						to={`/profile/${user.id}`}
						className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
					>
						<div className="text-3xl mb-3">👤</div>
						<h2 className="font-semibold text-gray-900 dark:text-white mb-1">Profile</h2>
						{profile ? (
							<div className="text-sm text-gray-700 dark:text-gray-300 space-y-1 mb-3">
								{profile.bio && (
									<p className="border-l-2 border-teal-400 pl-3">
										{truncate(profile.bio, 80)}
									</p>
								)}
								{profile.paddle && <p>Paddle: {profile.paddle}</p>}
								{profile.skill_level && <p>Skill: {profile.skill_level}</p>}
							</div>
						) : (
							<p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
								No profile set up yet. Add your bio, paddle, and skill level.
							</p>
						)}
						<span className="inline-block mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 group-hover:underline">
							Explore &rarr;
						</span>
					</Link>

					{/* 9. Paddle Database */}
					<Link
						to="/paddles"
						className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
					>
						<div className="text-3xl mb-3">🏓</div>
						<h2 className="font-semibold text-gray-900 dark:text-white mb-1">
							Paddle Database
						</h2>
						<p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
							Browse and compare paddle specs - weight, swing weight, core type, face material,
							and price. Find your perfect match.
						</p>
						<span className="inline-block mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 group-hover:underline">
							Explore &rarr;
						</span>
					</Link>

					{/* 10. Guides & Learn */}
					<Link
						to="/guides"
						className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
					>
						<div className="text-3xl mb-3">📖</div>
						<h2 className="font-semibold text-gray-900 dark:text-white mb-1">
							Guides & Learn
						</h2>
						<p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
							Rules, scoring, strategy tips, and beginner guides. Everything you need to improve
							your game.
						</p>
						<span className="inline-block mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 group-hover:underline">
							Explore &rarr;
						</span>
					</Link>

					{/* 11. Play Sessions */}
					<Link
						to="/sessions"
						className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
					>
						<div className="text-3xl mb-3">📅</div>
						<h2 className="font-semibold text-gray-900 dark:text-white mb-1">
							Play Sessions
						</h2>
						<p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
							Organize and join pickup games. Set skill level, format, and player limits.
							Waitlist support for full sessions.
						</p>
						<span className="inline-block mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 group-hover:underline">
							Explore &rarr;
						</span>
					</Link>
				</div>

				{/* CTA */}
				<div className="mt-12 text-center bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8">
					<h2 className="text-xl font-bold text-white mb-2">
						This is seeded demo data
					</h2>
					<p className="text-emerald-100 mb-6 max-w-lg mx-auto">
						Everything you see above is sample data so you can explore every feature. Sign up
						with Google or GitHub for a real account.
					</p>
					<div className="flex flex-wrap justify-center gap-3">
						<Link
							to="/home"
							className="px-6 py-3 rounded-full bg-white text-emerald-700 font-semibold text-sm hover:shadow-md"
						>
							Continue to app
						</Link>
						<Link
							to="/auth/logout"
							className="px-6 py-3 rounded-full border-2 border-white text-white font-semibold text-sm hover:bg-white/10"
						>
							Sign out & use real account
						</Link>
					</div>
				</div>
			</main>

			<footer className="border-t border-gray-200 dark:border-gray-800 py-6 mt-12">
				<div className="container mx-auto px-4 max-w-5xl flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
					<span className="font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
						Pickleball
					</span>
					<div className="flex gap-6">
						<a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400">
							Privacy
						</a>
						<a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400">
							Terms
						</a>
						<a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400">
							Contact
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
}
