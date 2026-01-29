import { redirect } from "react-router";
import type { Route } from "./+types/auth.oauth.google";
import { oauthStateCookie } from "~/lib/db.server";

export function loader({ context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const clientId = env.GOOGLE_CLIENT_ID;
	if (!clientId) {
		return redirect("/home?error=oauth_not_configured");
	}
	const origin = new URL(context.request.url).origin;
	const redirectUri = `${origin}/auth/oauth/google/callback`;
	const state = crypto.randomUUID();
	const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
	url.searchParams.set("client_id", clientId);
	url.searchParams.set("redirect_uri", redirectUri);
	url.searchParams.set("response_type", "code");
	url.searchParams.set("scope", "openid email profile");
	url.searchParams.set("state", state);
	return redirect(url.toString(), {
		headers: { "Set-Cookie": oauthStateCookie(state) },
	});
}
