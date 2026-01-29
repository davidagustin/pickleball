import { Link, useLoaderData, useActionData } from "react-router";
import { redirect } from "react-router";
import type { Route } from "./+types/courts.new";
import { getSessionToken, getSessionUser, createCourt } from "~/lib/db.server";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Add a court - Pickleball" }];
}

export async function loader({ context }: Route.LoaderArgs) {
	const db = context.cloudflare.env.DB;
	if (!db) return { user: null };
	const token = getSessionToken(context.request?.headers.get("Cookie") ?? null);
	const user = await getSessionUser(db, token);
	return { user };
}

export async function action({ context, request }: Route.ActionArgs) {
	const db = context.cloudflare.env.DB;
	if (!db) return { error: "Database not configured" };
	const token = getSessionToken(request.headers.get("Cookie"));
	const user = await getSessionUser(db, token);
	if (!user) return redirect("/home?login=1");
	const formData = await request.formData();
	const name = (formData.get("name") as string)?.trim();
	if (!name) return { error: "Court name required" };
	await createCourt(db, user.id, {
		name,
		address: (formData.get("address") as string)?.trim() || undefined,
		city: (formData.get("city") as string)?.trim() || undefined,
		state: (formData.get("state") as string)?.trim() || undefined,
		country: (formData.get("country") as string)?.trim() || "USA",
		courtCount: Number(formData.get("courtCount")) || 1,
		amenities: (formData.get("amenities") as string)?.trim() || undefined,
		courtType: (formData.get("courtType") as string) || undefined,
		reservable: formData.get("reservable") === "on",
	});
	return redirect("/courts");
}

export default function CourtsNew() {
	const { user } = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();

	if (!user) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
				<div className="text-center">
					<p className="text-gray-600 dark:text-gray-400">Log in to add a court.</p>
					<Link to="/home" className="mt-4 inline-block text-emerald-600 dark:text-emerald-400 hover:underline">Home</Link>
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
					<Link to="/courts" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
						Courts
					</Link>
				</div>
			</nav>

			<main className="container mx-auto px-4 py-8 max-w-md">
				<h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add a court</h1>
				<p className="mt-1 text-gray-600 dark:text-gray-400 text-sm">Submit a new court so others can find it. Any player can add courts.</p>

				{actionData?.error && (
					<div className="mt-4 px-4 py-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
						{actionData.error}
					</div>
				)}

				<form method="post" className="mt-6 space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Court / venue name *</label>
						<input
							type="text"
							name="name"
							required
							placeholder="e.g. Downtown Community Center"
							className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
						<input type="text" name="address" placeholder="Street address" className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
							<input type="text" name="city" placeholder="City" className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
							<input type="text" name="state" placeholder="State" className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
						</div>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
						<input type="text" name="country" defaultValue="USA" placeholder="USA" className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Number of courts</label>
						<input type="number" name="courtCount" min={1} defaultValue={1} className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
						<select name="courtType" className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
							<option value="">—</option>
							<option value="outdoor">Outdoor</option>
							<option value="indoor">Indoor</option>
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amenities</label>
						<input type="text" name="amenities" placeholder="Lights, restrooms, etc." className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
					</div>
					<div className="flex items-center gap-2">
						<input type="checkbox" name="reservable" id="reservable" className="rounded border-gray-300 dark:border-gray-600" />
						<label htmlFor="reservable" className="text-sm text-gray-700 dark:text-gray-300">Reservable</label>
					</div>
					<div className="flex gap-2 pt-2">
						<button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500">
							Submit court
						</button>
						<Link to="/courts" className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">
							Cancel
						</Link>
					</div>
				</form>
			</main>
		</div>
	);
}
