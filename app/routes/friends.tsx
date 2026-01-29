import { Link, useLoaderData } from "react-router";
import { AppShell } from "~/components/AppShell";
import { getOptionalUser } from "~/lib/db.server";
import type { Route } from "./+types/friends";

export function meta(_args: Route.MetaArgs) {
	return [{ title: "Friends - Pickleball" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
	const db = context.cloudflare.env.DB;
	if (!db) return { user: null };
	const user = await getOptionalUser(db, request);
	return { user };
}

export default function Friends() {
	const { user } = useLoaderData<typeof loader>();
	return (
		<AppShell user={user}>
			<div className="mx-auto max-w-2xl">
				<h1 className="text-2xl font-bold text-gray-900 dark:text-white">Friends</h1>
				<p className="mt-2 text-gray-600 dark:text-gray-400">
					Friend list and requests. (Demo: use Try demo to see friends as Alex.)
				</p>
				<Link
					to="/home"
					className="mt-4 inline-block text-emerald-600 dark:text-emerald-400 hover:underline"
				>
					← Back to Home
				</Link>
			</div>
		</AppShell>
	);
}
