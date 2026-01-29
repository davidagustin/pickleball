import { getProfile } from "~/lib/db.server";
import type { Route } from "./+types/api.avatar.$userId";

export async function loader({ context, params }: Route.LoaderArgs) {
	const db = context.cloudflare.env.DB;
	const bucket = context.cloudflare.env.PICKLEBALL_BUCKET;
	const userId = params.userId;
	if (!db || !bucket || !userId) {
		return new Response(null, { status: 404 });
	}
	const profile = await getProfile(db, userId);
	if (!profile?.avatarUrl) {
		return new Response(null, { status: 404 });
	}
	const object = await bucket.get(profile.avatarUrl);
	if (!object) {
		return new Response(null, { status: 404 });
	}
	const body = object.body;
	const contentType = object.httpMetadata?.contentType ?? "image/jpeg";
	const headers = new Headers({
		"Content-Type": contentType,
		"Cache-Control": "public, max-age=86400",
	});
	return new Response(body, { status: 200, headers });
}

export default function ApiAvatarUserId() {
	return null;
}
