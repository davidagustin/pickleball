import { Link, redirect, useLoaderData } from "react-router";
import { AppShell } from "~/components/AppShell";
import { createTournament, getSessionToken, getSessionUser, getTournaments } from "~/lib/db.server";
import type { Route } from "./+types/tournaments";

export function meta(_args: Route.MetaArgs) {
	return [{ title: "Tournaments - Pickleball" }];
}

export async function loader({ context }: Route.LoaderArgs) {
	const db = context.cloudflare.env.DB;
	if (!db) return { tournaments: [], user: null };
	const token = getSessionToken(context.request?.headers.get("Cookie") ?? null);
	const user = await getSessionUser(db, token);
	const tournaments = await getTournaments(db, 50);
	return { tournaments, user };
}

export async function action({ context, request }: Route.ActionArgs) {
	const db = context.cloudflare.env.DB;
	if (!db) return { error: "Database not configured" };
	const formData = await request.formData();
	const intent = formData.get("intent");
	const token = getSessionToken(request.headers.get("Cookie"));
	const user = await getSessionUser(db, token);
	if (!user) return redirect("/home?login=1");

	if (intent === "create") {
		const name = (formData.get("name") as string)?.trim();
		if (!name) return { error: "Tournament name required" };
		const id = await createTournament(db, name, user.id);
		return redirect(`/tournaments/${id}`);
	}

	return { error: "Unknown action" };
}

export default function Tournaments() {
	const { tournaments, user } = useLoaderData<typeof loader>();

	return (
		<AppShell user={user}>
			<div className="mx-auto max-w-4xl">
				<div className="flex items-center justify-between mb-8">
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tournaments</h1>
					{user && (
						<form method="post">
							<input type="hidden" name="intent" value="create" />
							<input
								type="text"
								name="name"
								placeholder="Tournament name"
								required
								className="mr-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
							/>
							<button
								type="submit"
								className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500"
							>
								Create tournament
							</button>
						</form>
					)}
				</div>

				{!user && (
					<p className="text-gray-600 dark:text-gray-400 mb-6">
						<Link
							to="/home"
							className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
						>
							Log in
						</Link>{" "}
						to create a tournament.
					</p>
				)}

				<div className="space-y-4">
					{tournaments.length === 0 ? (
						<p className="text-gray-500 dark:text-gray-400">
							No tournaments yet. Create one to get started.
						</p>
					) : (
						tournaments.map((t) => (
							<Link
								key={t.id}
								to={`/tournaments/${t.id}`}
								className="block bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors"
							>
								<div className="flex items-center justify-between">
									<div>
										<h2 className="font-semibold text-gray-900 dark:text-white">{t.name}</h2>
										<p className="text-sm text-gray-500 dark:text-gray-400">
											Admin: {t.adminName} · {t.status}
										</p>
									</div>
									<span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">
										View →
									</span>
								</div>
							</Link>
						))
					)}
				</div>
			</div>
		</AppShell>
	);
}
