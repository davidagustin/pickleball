import { redirect } from "react-router";
import type { Route } from "./+types/auth.oauth.google.callback";
import {
	getOrCreateOAuthUser,
	createSession,
	sessionCookie,
	getOAuthStateFromCookie,
	clearOAuthStateCookie,
} from "~/lib/db.server";

export async function loader({ context, request }: Route.LoaderArgs) {
	const url = new URL(request.url);
	const code = url.searchParams.get("code");
	const stateFromProvider = url.searchParams.get("state");
	const cookieHeader = request.headers.get("Cookie");
	const stateFromCookie = getOAuthStateFromCookie(cookieHeader);
	if (!stateFromProvider || !stateFromCookie || stateFromProvider !== stateFromCookie) {
		return redirect("/home?error=oauth_failed");
	}
	const env = context.cloudflare.env;
	const db = env.DB;
	if (!code || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
		return redirect("/home?error=oauth_failed");
	}
	const origin = new URL(request.url).origin;
	const redirectUri = `${origin}/auth/oauth/google/callback`;
	const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			code,
			client_id: env.GOOGLE_CLIENT_ID,
			client_secret: env.GOOGLE_CLIENT_SECRET,
			redirect_uri: redirectUri,
			grant_type: "authorization_code",
		}),
	});
	if (!tokenRes.ok) {
		return redirect("/home?error=oauth_failed");
	}
	const tokens = (await tokenRes.json()) as { access_token: string };
	const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
		headers: { Authorization: `Bearer ${tokens.access_token}` },
	});
	if (!userRes.ok) {
		return redirect("/home?error=oauth_failed");
	}
	const profile = (await userRes.json()) as { id: string; email?: string; name?: string };
	const user = await getOrCreateOAuthUser(
		db,
		"google",
		profile.id,
		profile.email ?? null,
		profile.name ?? profile.email ?? "User"
	);
	const token = await createSession(db, user.id);
	const headers = new Headers();
	headers.append("Set-Cookie", sessionCookie(token));
	headers.append("Set-Cookie", clearOAuthStateCookie());
	return redirect("/home", { headers });
}
