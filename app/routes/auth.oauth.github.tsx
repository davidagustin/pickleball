import { redirect } from "react-router";
import type { Route } from "./+types/auth.oauth.github";
import { oauthStateCookie } from "~/lib/db.server";

export function loader({ context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const clientId = env.GITHUB_CLIENT_ID;
	if (!clientId) {
		return redirect("/home?error=oauth_not_configured");
	}
	const origin = new URL(context.request.url).origin;
	const redirectUri = `${origin}/auth/oauth/github/callback`;
	const state = crypto.randomUUID();
	const url = new URL("https://github.com/login/oauth/authorize");
	url.searchParams.set("client_id", clientId);
	url.searchParams.set("redirect_uri", redirectUri);
	url.searchParams.set("scope", "user:email read:user");
	url.searchParams.set("state", state);
	return redirect(url.toString(), {
		headers: { "Set-Cookie": oauthStateCookie(state) },
	});
}
