import { Link, useLoaderData, useParams } from "react-router";
import { redirect } from "react-router";
import type { Route } from "./+types/join.$code";
import { getSessionToken, getSessionUser, getCourtByCode, joinCourtQueue } from "~/lib/db.server";

const COURT_NAMES: Record<string, string> = {
	"1": "Downtown Community Center",
	"2": "Riverside Park",
	"3": "Sunset Rec Complex",
};

export function meta({}: Route.MetaArgs) {
	return [{ title: "Join room - Pickleball" }];
}

export async function loader({ context, params }: Route.LoaderArgs) {
	const db = context.cloudflare.env.DB;
	const code = params.code?.trim().toUpperCase();
	if (!db || !code) return { courtId: null, courtName: null, code: null, joined: false };
	const courtId = await getCourtByCode(db, code);
	const courtName = courtId ? COURT_NAMES[courtId] ?? `Court ${courtId}` : null;
	return { courtId, courtName, code, joined: false };
}

export async function action({ context, request, params }: Route.ActionArgs) {
	const db = context.cloudflare.env.DB;
	const code = params.code?.trim().toUpperCase();
	if (!db || !code) return { error: "Invalid code" };
	const courtId = await getCourtByCode(db, code);
	if (!courtId) return { error: "Room not found" };
	const cookieHeader = request.headers.get("Cookie");
	const token = getSessionToken(cookieHeader);
	const user = await getSessionUser(db, token);
	if (!user) return redirect(`/home?login=1&join=${encodeURIComponent(code)}`);
	await joinCourtQueue(db, courtId, user.id);
	return redirect(`/home?court=${courtId}&joined=1`);
}

export default function JoinCode() {
	const { courtId, courtName, code, joined } = useLoaderData<typeof loader>();
	const params = useParams();

	if (!code) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
				<p className="text-gray-600 dark:text-gray-400 mb-4">Invalid or missing room code.</p>
				<Link to="/home" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">Back to home</Link>
			</div>
		);
	}

	if (!courtId || !courtName) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
				<p className="text-gray-600 dark:text-gray-400 mb-2">Room not found for code: <strong>{params.code}</strong></p>
				<p className="text-sm text-gray-500 dark:text-gray-500 mb-4">Check the code and try again.</p>
				<Link to="/home" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">Back to home</Link>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
			<div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-8 max-w-md w-full text-center">
				<h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Join this room</h1>
				<p className="text-gray-600 dark:text-gray-400 mb-1">You scanned or entered the room code.</p>
				<p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 mb-6">{courtName}</p>
				<p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Join the queue so you're in line for the next game — no paddles on the floor.</p>
				<form method="post" className="space-y-4">
					<button
						type="submit"
						className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-lg hover:shadow-lg transition-all"
					>
						Join queue
					</button>
				</form>
				<p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
					Not logged in? <Link to="/home" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">Log in first</Link>, then open this link again.
				</p>
				<Link to="/home" className="block mt-6 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
					← Back to home
				</Link>
			</div>
		</div>
	);
}
