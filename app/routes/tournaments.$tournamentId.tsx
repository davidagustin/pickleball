import { Link, useLoaderData, useActionData } from "react-router";
import { redirect } from "react-router";
import type { Route } from "./+types/tournaments.$tournamentId";
import {
	getSessionToken,
	getSessionUser,
	getTournament,
	getTournamentParticipants,
	getBracketMatches,
	isTournamentAdmin,
	addTournamentParticipant,
	startTournament,
	setMatchWinner,
	type BracketMatch,
} from "~/lib/db.server";

export function meta({ data }: Route.MetaArgs) {
	if (!data?.tournament) return [{ title: "Tournament - Pickleball" }];
	return [{ title: `${data.tournament.name} - Pickleball` }];
}

export async function loader({ context, params }: Route.LoaderArgs) {
	const db = context.cloudflare.env.DB;
	const tournamentId = params.tournamentId;
	if (!db || !tournamentId) return { tournament: null, participants: [], bracket: [], user: null, isAdmin: false };

	const token = getSessionToken(context.request?.headers.get("Cookie") ?? null);
	const user = await getSessionUser(db, token);
	const tournament = await getTournament(db, tournamentId);
	if (!tournament) return { tournament: null, participants: [], bracket: [], user, isAdmin: false };

	const [participants, bracket] = await Promise.all([
		getTournamentParticipants(db, tournamentId),
		getBracketMatches(db, tournamentId),
	]);
	const isAdmin = user ? await isTournamentAdmin(db, tournamentId, user.id) : false;
	return { tournament, participants, bracket, user, isAdmin };
}

export async function action({ context, request, params }: Route.ActionArgs) {
	const db = context.cloudflare.env.DB;
	const tournamentId = params.tournamentId;
	if (!db || !tournamentId) return { error: "Not found" };

	const formData = await request.formData();
	const intent = formData.get("intent");
	const token = getSessionToken(request.headers.get("Cookie"));
	const user = await getSessionUser(db, token);
	if (!user) return redirect("/home?login=1");

	if (intent === "join") {
		await addTournamentParticipant(db, tournamentId, user.id);
		return redirect(`/tournaments/${tournamentId}`);
	}

	if (intent === "start") {
		const isAdmin = await isTournamentAdmin(db, tournamentId, user.id);
		if (!isAdmin) return { error: "Only the tournament admin can start the tournament" };
		const result = await startTournament(db, tournamentId);
		if (result.error) return { error: result.error };
		return redirect(`/tournaments/${tournamentId}`);
	}

	if (intent === "set_winner") {
		const isAdmin = await isTournamentAdmin(db, tournamentId, user.id);
		if (!isAdmin) return { error: "Only the tournament admin can set match winners" };
		const matchId = formData.get("matchId") as string;
		const winnerId = formData.get("winnerId") as string;
		if (!matchId || !winnerId) return { error: "Missing match or winner" };
		const result = await setMatchWinner(db, matchId, winnerId);
		if (result.error) return { error: result.error };
		return redirect(`/tournaments/${tournamentId}`);
	}

	return { error: "Unknown action" };
}

function MatchCard({ match, isAdmin }: { match: BracketMatch; isAdmin: boolean }) {
	const hasPlayers = match.player1Id || match.player2Id;
	const p1Name = match.player1Name ?? "TBD";
	const p2Name = match.player2Name ?? "TBD";
	const winnerId = match.winnerId;

	return (
		<div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden min-w-[200px]">
			<div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700/50 text-xs font-medium text-gray-500 dark:text-gray-400">
				Round {match.round} · Match {match.matchOrder}
			</div>
			<div className="divide-y divide-gray-200 dark:divide-gray-700">
				<div
					className={`px-3 py-2 flex items-center justify-between ${
						winnerId === match.player1Id ? "bg-emerald-50 dark:bg-emerald-900/20 font-medium text-emerald-700 dark:text-emerald-400" : ""
					}`}
				>
					<span className="truncate">{p1Name}</span>
					{isAdmin && match.player1Id && !winnerId && hasPlayers && (
						<form method="post" className="inline">
							<input type="hidden" name="intent" value="set_winner" />
							<input type="hidden" name="matchId" value={match.id} />
							<input type="hidden" name="winnerId" value={match.player1Id} />
							<button type="submit" className="text-xs px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-500">
								Winner
							</button>
						</form>
					)}
				</div>
				<div
					className={`px-3 py-2 flex items-center justify-between ${
						winnerId === match.player2Id ? "bg-emerald-50 dark:bg-emerald-900/20 font-medium text-emerald-700 dark:text-emerald-400" : ""
					}`}
				>
					<span className="truncate">{p2Name}</span>
					{isAdmin && match.player2Id && !winnerId && hasPlayers && (
						<form method="post" className="inline">
							<input type="hidden" name="intent" value="set_winner" />
							<input type="hidden" name="matchId" value={match.id} />
							<input type="hidden" name="winnerId" value={match.player2Id} />
							<button type="submit" className="text-xs px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-500">
								Winner
							</button>
						</form>
					)}
				</div>
			</div>
		</div>
	);
}

export default function TournamentDetail() {
	const { tournament, participants, bracket, user, isAdmin } = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();

	if (!tournament) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tournament not found</h1>
					<Link to="/tournaments" className="mt-4 inline-block text-emerald-600 dark:text-emerald-400 hover:underline">
						Back to Tournaments
					</Link>
				</div>
			</div>
		);
	}

	const byRound = bracket.reduce<Record<number, BracketMatch[]>>((acc, m) => {
		if (!acc[m.round]) acc[m.round] = [];
		acc[m.round].push(m);
		return acc;
	}, {});
	const rounds = Object.keys(byRound)
		.map(Number)
		.sort((a, b) => a - b);

	const isParticipant = user && participants.some((p) => p.userId === user.id);
	const canJoin = tournament.status === "draft" && user && !isParticipant;
	const isPowerOf2 = (n: number) => n >= 2 && (n & (n - 1)) === 0;
	const canStart = isAdmin && tournament.status === "draft" && isPowerOf2(participants.length);

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-950">
			<nav className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
				<div className="container mx-auto px-4 py-3 max-w-5xl flex items-center justify-between">
					<Link
						to="/tournaments"
						className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"
					>
						Pickleball
					</Link>
					<div className="flex gap-2">
						<Link
							to="/tournaments"
							className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
						>
							Tournaments
						</Link>
						<Link
							to="/home"
							className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
						>
							Home
						</Link>
					</div>
				</div>
			</nav>

			<main className="container mx-auto px-4 py-8 max-w-5xl">
				{actionData?.error && (
					<div className="mb-4 px-4 py-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
						{actionData.error}
					</div>
				)}
				{/* Header */}
				<div className="flex flex-wrap items-start justify-between gap-4 mb-8">
					<div>
						<h1 className="text-3xl font-bold text-gray-900 dark:text-white">{tournament.name}</h1>
						<p className="text-gray-500 dark:text-gray-400 mt-1">
							Admin: {tournament.adminName} · Created {new Date(tournament.createdAt).toLocaleDateString()}
						</p>
						<span
							className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
								tournament.status === "draft"
									? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
									: tournament.status === "in_progress"
										? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
										: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300"
							}`}
						>
							{tournament.status.replace("_", " ")}
						</span>
					</div>
					<div className="flex flex-wrap gap-2">
						{canJoin && (
							<form method="post">
								<input type="hidden" name="intent" value="join" />
								<button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500">
									Join tournament
								</button>
							</form>
						)}
						{canStart && (
							<form method="post">
								<input type="hidden" name="intent" value="start" />
								<button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500">
									Start tournament
								</button>
							</form>
						)}
						{isAdmin && tournament.status === "draft" && !isPowerOf2(participants.length) && participants.length >= 2 && (
							<span className="px-3 py-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
								Need 2, 4, 8, or 16 players to start
							</span>
						)}
					</div>
				</div>

				{/* Participants */}
				<section className="mb-10">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Participants ({participants.length})</h2>
					{participants.length === 0 ? (
						<p className="text-gray-500 dark:text-gray-400">No participants yet. Join above if the tournament is in draft.</p>
					) : (
						<ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
							{participants.map((p) => (
								<li
									key={p.userId}
									className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
								>
									<span className="font-medium text-gray-900 dark:text-white">#{p.seed}</span>
									<span className="text-gray-700 dark:text-gray-300 truncate">{p.userName}</span>
								</li>
							))}
						</ul>
					)}
				</section>

				{/* Bracket */}
				{bracket.length > 0 && (
					<section>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Elimination bracket</h2>
						<div className="overflow-x-auto pb-4">
							<div className="flex gap-8 min-w-max" style={{ justifyContent: "space-between" }}>
								{rounds.map((round) => (
									<div key={round} className="flex flex-col gap-6">
										<h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
											{round === Math.max(...rounds) ? "Final" : round === Math.max(...rounds) - 1 ? "Semi-final" : `Round ${round}`}
										</h3>
										<div className="flex flex-col gap-6 justify-around" style={{ minHeight: `${byRound[round].length * 100}px` }}>
											{byRound[round].map((m) => (
												<MatchCard key={m.id} match={m} isAdmin={isAdmin} />
											))}
										</div>
									</div>
								))}
							</div>
						</div>
					</section>
				)}

				{tournament.status === "in_progress" && bracket.length === 0 && (
					<p className="text-gray-500 dark:text-gray-400">Bracket is being generated. Refresh in a moment.</p>
				)}
			</main>
		</div>
	);
}
