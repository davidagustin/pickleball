import { Link, useLoaderData, redirect } from "react-router";
import type { Route } from "./+types/courts.$courtId";
import {
	getSessionToken,
	getSessionUser,
	getCourt,
	getCourtQueue,
	getCodeForCourt,
	getCourtAdmins,
	isCourtAdmin,
	joinCourtQueue,
	leaveCourtQueue,
	isInQueue,
	addCourtAdmin,
} from "~/lib/db.server";

export function meta({ data }: Route.MetaArgs) {
	if (!data?.court) return [{ title: "Court - Pickleball" }];
	return [{ title: `${data.court.name} - Pickleball` }];
}

export async function loader({ context, params, request }: Route.LoaderArgs) {
	const db = context.cloudflare.env.DB;
	const courtId = params.courtId;
	if (!db || !courtId) return { court: null, queue: [], code: null, admins: [], user: null, myInQueue: false, myAdmin: false, origin: "" };
	const token = getSessionToken(request.headers.get("Cookie") ?? null);
	const user = await getSessionUser(db, token);
	const [court, queue, code, admins] = await Promise.all([
		getCourt(db, courtId),
		getCourtQueue(db, courtId),
		getCodeForCourt(db, courtId),
		getCourtAdmins(db, courtId),
	]);
	const myInQueue = user ? await isInQueue(db, courtId, user.id) : false;
	const myAdmin = user ? await isCourtAdmin(db, courtId, user.id) : false;
	const origin = new URL(request.url).origin;
	return { court, queue, code, admins, user, myInQueue, myAdmin, origin };
}

export async function action({ context, request, params }: Route.ActionArgs) {
	const db = context.cloudflare.env.DB;
	const courtId = params.courtId;
	if (!db || !courtId) return { error: "Not found" };
	const formData = await request.formData();
	const intent = formData.get("intent");
	const token = getSessionToken(request.headers.get("Cookie"));
	const user = await getSessionUser(db, token);
	if (!user) return { error: "Login required" };

	if (intent === "joinQueue" || intent === "leaveQueue") {
		if (intent === "joinQueue") await joinCourtQueue(db, courtId, user.id);
		else await leaveCourtQueue(db, courtId, user.id);
		return redirect(`/courts/${courtId}`);
	}
	if (intent === "makeAdmin") {
		const targetUserId = formData.get("userId") as string;
		if (!targetUserId) return { error: "User required" };
		const isAdmin = await isCourtAdmin(db, courtId, user.id);
		if (!isAdmin) return { error: "Only admins can add admins" };
		await addCourtAdmin(db, courtId, targetUserId);
		return redirect(`/courts/${courtId}`);
	}
	return { error: "Unknown action" };
}

export default function CourtDetail() {
	const { court, queue, code, admins, user, myInQueue, myAdmin, origin } = useLoaderData<typeof loader>();

	if (!court) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
				<div className="text-center">
					<p className="text-gray-600 dark:text-gray-400">Court not found.</p>
					<Link to="/courts" className="mt-4 inline-block text-emerald-600 dark:text-emerald-400 hover:underline">Find courts</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-950">
			<nav className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
				<div className="container mx-auto px-4 py-3 max-w-4xl flex items-center justify-between">
					<Link to="/courts" className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
						Pickleball
					</Link>
					<div className="flex gap-2">
						<Link to="/courts" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
							Courts
						</Link>
						<Link to="/home" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
							Home
						</Link>
					</div>
				</div>
			</nav>

			<main className="container mx-auto px-4 py-8 max-w-4xl">
				<div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white">{court.name}</h1>
					{court.address && <p className="text-gray-600 dark:text-gray-400 mt-1">{court.address}</p>}
					<div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
						{court.city && <span>{court.city}</span>}
						{court.state && <span>{court.state}</span>}
						<span>{court.courtCount} court{court.courtCount !== 1 ? "s" : ""}</span>
						{court.courtType && <span> · {court.courtType}</span>}
						{court.reservable && <span> · Reservable</span>}
						{court.amenities && <span> · {court.amenities}</span>}
					</div>
					<p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
						<a href="mailto:support@example.com" className="text-emerald-600 dark:text-emerald-400 hover:underline">Suggest changes</a> to this court
					</p>
				</div>

				<div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
					<h2 className="font-semibold text-gray-900 dark:text-white mb-3">Court queue (digital paddle stack)</h2>
					{code && origin && (
						<div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 p-4 flex items-center gap-4 mb-4">
							<div>
								<p className="text-sm font-medium text-gray-700 dark:text-gray-300">Room code — scan or share</p>
								<p className="font-mono font-bold text-gray-900 dark:text-white tracking-wider">{code}</p>
								<Link to={`/join/${code}`} className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
									Join via link /join/{code}
								</Link>
							</div>
							<img
								src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`${origin}/join/${code}`)}`}
								alt="QR code"
								className="rounded-lg border border-gray-200 dark:border-gray-600 w-20 h-20 flex-shrink-0"
							/>
						</div>
					)}
					{queue.length > 0 && (
						<ul className="space-y-2 mb-4">
							{queue.map((e, i) => (
								<li key={e.userId} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700/50">
									<span className="font-medium text-gray-900 dark:text-white">#{i + 1} {e.userName}</span>
									{myAdmin && (
										<form method="post">
											<input type="hidden" name="intent" value="makeAdmin" />
											<input type="hidden" name="userId" value={e.userId} />
											<button type="submit" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">Make admin</button>
										</form>
									)}
								</li>
							))}
						</ul>
					)}
					{user && (
						<div>
							{myInQueue ? (
								<form method="post">
									<input type="hidden" name="intent" value="leaveQueue" />
									<button type="submit" className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
										Leave queue
									</button>
								</form>
							) : (
								<form method="post">
									<input type="hidden" name="intent" value="joinQueue" />
									<button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500">
										Join queue
									</button>
								</form>
							)}
						</div>
					)}
					{!user && <p className="text-sm text-gray-500 dark:text-gray-400"><Link to="/home" className="text-emerald-600 dark:text-emerald-400 hover:underline">Log in</Link> to join the queue.</p>}
				</div>

				{admins.length > 0 && (
					<div className="text-sm text-gray-500 dark:text-gray-400">
						Admins: {admins.map((a) => a.userName).join(", ")}
					</div>
				)}
			</main>
		</div>
	);
}
