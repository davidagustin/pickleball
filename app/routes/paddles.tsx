import { Link, useLoaderData, useSearchParams } from "react-router";
import { getPaddles, getSessionToken, getSessionUser } from "~/lib/db.server";
import type { Route } from "./+types/paddles";

export function meta(_: Route.MetaArgs) {
	return [{ title: "Paddle database - Pickleball" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
	const db = context.cloudflare.env.DB;
	const url = new URL(request.url);
	const brand = url.searchParams.get("brand")?.trim() ?? undefined;
	const coreType = url.searchParams.get("core")?.trim() ?? undefined;
	if (!db) return { paddles: [], user: null };
	const token = getSessionToken(request.headers.get("Cookie") ?? null);
	const user = await getSessionUser(db, token);
	const paddles = await getPaddles(db, { brand, coreType, limit: 200 });
	return { paddles, user };
}

export default function Paddles() {
	const { paddles } = useLoaderData<typeof loader>();
	const [searchParams, setSearchParams] = useSearchParams();
	const brand = searchParams.get("brand") ?? "";
	const core = searchParams.get("core") ?? "";

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-950">
			<nav className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
				<div className="container mx-auto px-4 py-3 max-w-4xl flex items-center justify-between">
					<Link
						to="/home"
						className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"
					>
						Pickleball
					</Link>
					<div className="flex gap-2">
						<Link
							to="/home"
							className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
						>
							Home
						</Link>
						<Link
							to="/guides"
							className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
						>
							Guides
						</Link>
					</div>
				</div>
			</nav>

			<main className="container mx-auto px-4 py-8 max-w-4xl">
				<h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paddle database</h1>
				<p className="mt-1 text-gray-600 dark:text-gray-400">
					Compare specs: brand, core, face, weight, shape, and dimensions.
				</p>

				<div className="mt-6 flex flex-wrap gap-4 items-center">
					<form
						className="flex flex-wrap gap-2"
						onSubmit={(e) => {
							e.preventDefault();
							const form = e.currentTarget;
							const brandInput = form.querySelector<HTMLInputElement>('input[name="brand"]');
							const coreInput = form.querySelector<HTMLSelectElement>('select[name="core"]');
							setSearchParams({
								...(brandInput?.value ? { brand: brandInput.value } : {}),
								...(coreInput?.value ? { core: coreInput.value } : {}),
							});
						}}
					>
						<input
							type="text"
							name="brand"
							placeholder="Brand"
							defaultValue={brand}
							className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm w-36"
						/>
						<select
							name="core"
							defaultValue={core}
							className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
						>
							<option value="">All cores</option>
							<option value="polymer">Polymer</option>
							<option value="nomex">Nomex</option>
							<option value="hybrid">Hybrid</option>
						</select>
						<button
							type="submit"
							className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500"
						>
							Filter
						</button>
					</form>
				</div>

				<ul className="mt-8 space-y-4">
					{paddles.length === 0 ? (
						<li className="text-gray-500 dark:text-gray-400 py-8 text-center">No paddles found.</li>
					) : (
						paddles.map((p) => (
							<li key={p.id}>
								<Link
									to={`/paddles/${p.id}`}
									className="block bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors"
								>
									<h2 className="font-semibold text-gray-900 dark:text-white">
										{p.brand} {p.model}
									</h2>
									<div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
										{p.coreType && <span>Core: {p.coreType}</span>}
										{p.faceMaterial && <span>Face: {p.faceMaterial}</span>}
										{p.weightOz != null && <span>{p.weightOz} oz</span>}
										{p.shape && <span>{p.shape}</span>}
										{p.priceUsd != null && <span>${p.priceUsd}</span>}
									</div>
								</Link>
							</li>
						))
					)}
				</ul>
			</main>
		</div>
	);
}
