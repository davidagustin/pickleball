import { redirect } from "react-router";
import type { Route } from "./+types/auth.oauth.github.callback";
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
	if (!code || !env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
		return redirect("/home?error=oauth_failed");
	}
	const origin = new URL(request.url).origin;
	const redirectUri = `${origin}/auth/oauth/github/callback`;
	const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
		method: "POST",
		headers: { Accept: "application/json", "Content-Type": "application/json" },
		body: JSON.stringify({
			client_id: env.GITHUB_CLIENT_ID,
			client_secret: env.GITHUB_CLIENT_SECRET,
			code,
			redirect_uri: redirectUri,
		}),
	});
	if (!tokenRes.ok) {
		return redirect("/home?error=oauth_failed");
	}
	const tokens = (await tokenRes.json()) as { access_token?: string };
	const accessToken = tokens.access_token;
	if (!accessToken) {
		return redirect("/home?error=oauth_failed");
	}
	const userRes = await fetch("https://api.github.com/user", {
		headers: { Authorization: `Bearer ${accessToken}` },
	});
	if (!userRes.ok) {
		return redirect("/home?error=oauth_failed");
	}
	const profile = (await userRes.json()) as { id: number; login: string; name?: string; email?: string };
	const user = await getOrCreateOAuthUser(
		db,
		"github",
		String(profile.id),
		profile.email ?? null,
		profile.name ?? profile.login ?? "User"
	);
	const token = await createSession(db, user.id);
	const headers = new Headers();
	headers.append("Set-Cookie", sessionCookie(token));
	headers.append("Set-Cookie", clearOAuthStateCookie());
	return redirect("/home", { headers });
}
