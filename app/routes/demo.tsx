import { redirect } from "react-router";
import type { Route } from "./+types/demo";
import { getSessionToken, getSessionUser, createSession, sessionCookie } from "~/lib/db.server";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Try demo - Pickleball" }];
}

/**
 * One-click demo: log in as the seeded demo user (Alex, demo@pickleball.app)
 * so the app shows all demo data (feed, courts, tournaments, coaching, friends, messages).
 * Run migrations including 0007_seed_demo.sql first.
 */
export async function loader({ context, request }: Route.LoaderArgs) {
	const db = context.cloudflare.env.DB;
	if (!db) return redirect("/home");

	const token = getSessionToken(request.headers.get("Cookie") ?? null);
	const user = await getSessionUser(db, token);
	if (user) return redirect("/home");

	const demoUser = await db
		.prepare("SELECT id FROM users WHERE provider = 'demo' AND email = ?")
		.bind("demo@pickleball.app")
		.first<{ id: string }>();
	if (!demoUser) return redirect("/home");

	const sessionToken = await createSession(db, demoUser.id);
	return redirect("/home", {
		headers: { "Set-Cookie": sessionCookie(sessionToken) },
	});
}

export default function Demo() {
	return null;
}
