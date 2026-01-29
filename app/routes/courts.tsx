import { Link, useLoaderData, useSearchParams } from "react-router";
import type { Route } from "./+types/courts";
import { getSessionToken, getSessionUser, getCourts } from "~/lib/db.server";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Find courts - Pickleball" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
	const db = context.cloudflare.env.DB;
	const url = new URL(request.url);
	const city = url.searchParams.get("city")?.trim() ?? undefined;
	if (!db) return { courts: [], user: null };
	const token = getSessionToken(request.headers.get("Cookie") ?? null);
	const user = await getSessionUser(db, token);
	const courts = await getCourts(db, { city, limit: 200 });
	return { courts, user };
}

export default function Courts() {
	const { courts, user } = useLoaderData<typeof loader>();
	const [searchParams, setSearchParams] = useSearchParams();
	const city = searchParams.get("city") ?? "";

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-950">
			<nav className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
				<div className="container mx-auto px-4 py-3 max-w-4xl flex items-center justify-between">
					<Link to="/home" className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
						Pickleball
					</Link>
					<div className="flex gap-2">
						<Link to="/home" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
							Home
						</Link>
						<Link to="/sessions" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
							Sessions
						</Link>
					</div>
				</div>
			</nav>

			<main className="container mx-auto px-4 py-8 max-w-4xl">
				<h1 className="text-2xl font-bold text-gray-900 dark:text-white">Find pickleball courts</h1>
				<p className="mt-1 text-gray-600 dark:text-gray-400">
					Browse courts near you.
				</p>

				<div className="mt-6 flex flex-wrap gap-4 items-center">
					<form
						className="flex gap-2"
						onSubmit={(e) => {
							e.preventDefault();
							const form = e.currentTarget;
							const cityInput = form.querySelector<HTMLInputElement>('input[name="city"]');
							if (cityInput) setSearchParams(cityInput.value ? { city: cityInput.value } : {});
						}}
					>
						<input
							type="text"
							name="city"
							placeholder="Filter by city"
							defaultValue={city}
							className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm w-48"
						/>
						<button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500">
							Search
						</button>
					</form>
					{user && (
						<Link
							to="/courts/new"
							className="px-4 py-2 rounded-lg border border-emerald-600 text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
						>
							Add a court
						</Link>
					)}
				</div>

				<ul className="mt-8 space-y-4">
					{courts.length === 0 ? (
						<li className="text-gray-500 dark:text-gray-400 py-8 text-center">
							No courts found. {user ? <Link to="/courts/new" className="text-emerald-600 dark:text-emerald-400 hover:underline">Add one</Link> : "Log in to add a court."}
						</li>
					) : (
						courts.map((court) => (
							<li key={court.id}>
								<Link
									to={`/courts/${court.id}`}
									className="block bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors"
								>
									<h2 className="font-semibold text-gray-900 dark:text-white">{court.name}</h2>
									{court.address && <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{court.address}</p>}
									<div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
										{court.city && <span>{court.city}</span>}
										{court.state && <span>{court.state}</span>}
										<span>{court.courtCount} court{court.courtCount !== 1 ? "s" : ""}</span>
										{court.courtType && <span> · {court.courtType}</span>}
										{court.reservable && <span> · Reservable</span>}
									</div>
									<span className="mt-2 inline-block text-emerald-600 dark:text-emerald-400 text-sm font-medium">View details →</span>
								</Link>
							</li>
						))
					)}
				</ul>
			</main>
		</div>
	);
}
