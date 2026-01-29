import { redirect } from "react-router";
import type { Route } from "./+types/auth.logout";
import { getSessionToken, deleteSession, clearSessionCookie } from "~/lib/db.server";

export async function action({ context, request }: Route.ActionArgs) {
	if (request.method !== "POST") {
		return redirect("/home");
	}
	const cookieHeader = request.headers.get("Cookie");
	const token = getSessionToken(cookieHeader);
	if (token) {
		await deleteSession(context.cloudflare.env.DB, token);
	}
	return redirect("/home", {
		headers: {
			"Set-Cookie": clearSessionCookie(),
		},
	});
}
