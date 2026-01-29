import { useState } from "react";
import { Link, useLoaderData, useParams, useNavigate } from "react-router";
import type { Route } from "./+types/profile.$userId";
import {
	getSessionToken,
	getSessionUser,
	getProfile,
	getFriendStatus,
	sendFriendRequest,
	acceptFriendRequest,
	rejectFriendRequest,
	upsertProfile,
} from "~/lib/db.server";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Profile - Pickleball" }];
}

export async function loader({ context, request, params }: Route.LoaderArgs) {
	const db = context.cloudflare.env.DB;
	const userId = params.userId;
	if (!db || !userId) return { currentUser: null, profileUser: null, profile: null, friendStatus: "none" as const };
	const cookieHeader = request.headers.get("Cookie");
	const token = getSessionToken(cookieHeader);
	const currentUser = await getSessionUser(db, token);
	const isMe = currentUser?.id === userId;
	const profileUser = await db.prepare("SELECT id, email, name, provider FROM users WHERE id = ?").bind(userId).first<{ id: string; email: string | null; name: string; provider: string }>();
	if (!profileUser) return { currentUser, profileUser: null, profile: null, friendStatus: "none" as const };
	const profile = await getProfile(db, userId);
	const friendStatus = currentUser && !isMe ? await getFriendStatus(db, currentUser.id, userId) : "none";
	return { currentUser, profileUser, profile, friendStatus, isMe };
}

export async function action({ context, request, params }: Route.ActionArgs) {
	const db = context.cloudflare.env.DB;
	const userId = params.userId;
	if (!db || !userId) return { error: "Not found" };
	const formData = await request.formData();
	const intent = formData.get("intent");
	const cookieHeader = request.headers.get("Cookie");
	const token = getSessionToken(cookieHeader);
	const currentUser = await getSessionUser(db, token);
	if (!currentUser) return { error: "Login required" };

	if (intent === "updateProfile" && currentUser.id === userId) {
		await upsertProfile(db, userId, {
			bio: (formData.get("bio") as string) || undefined,
			paddle: (formData.get("paddle") as string) || undefined,
			shoes: (formData.get("shoes") as string) || undefined,
			gear: (formData.get("gear") as string) || undefined,
			duprLink: (formData.get("duprLink") as string) || undefined,
		});
		return { ok: true };
	}

	if (intent === "addFriend" && currentUser.id !== userId) {
		await sendFriendRequest(db, currentUser.id, userId);
		return { ok: true };
	}
	if (intent === "acceptFriend") {
		const fromId = formData.get("fromId") as string;
		if (fromId) await acceptFriendRequest(db, fromId, currentUser.id);
		return { ok: true };
	}
	if (intent === "rejectFriend") {
		const fromId = formData.get("fromId") as string;
		if (fromId) await rejectFriendRequest(db, fromId, currentUser.id);
		return { ok: true };
	}

	return { error: "Unknown action" };
}

export default function ProfileUserId() {
	const { currentUser, profileUser, profile, friendStatus, isMe } = useLoaderData<typeof loader>();
	const [editing, setEditing] = useState(false);
	const navigate = useNavigate();

	if (!profileUser) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
				<p className="text-gray-600 dark:text-gray-400">User not found.</p>
				<Link to="/home" className="text-emerald-600 ml-2">Back to home</Link>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-950">
			<nav className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
				<div className="container mx-auto px-4 py-3 max-w-4xl flex items-center justify-between">
					<Link to="/home" className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
						Pickleball
					</Link>
					<div className="flex gap-2">
						<Link to="/friends" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
							Friends
						</Link>
						<Link to="/messages" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
							Messages
						</Link>
					</div>
				</div>
			</nav>

			<main className="container mx-auto px-4 py-8 max-w-2xl">
				{/* Profile header */}
				<div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
					<div className="flex items-center gap-4 mb-4">
						<div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-2xl font-bold">
							{profileUser.name.slice(0, 1).toUpperCase()}
						</div>
						<div>
							<h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profileUser.name}</h1>
							{!isMe && currentUser && (
								<div className="mt-2 flex gap-2">
									{friendStatus === "none" && (
										<form method="post">
											<input type="hidden" name="intent" value="addFriend" />
											<button type="submit" className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500">
												Add friend
											</button>
										</form>
									)}
									{friendStatus === "pending_sent" && (
										<span className="px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm">Request sent</span>
									)}
									{friendStatus === "pending_received" && (
										<>
											<form method="post" className="inline">
												<input type="hidden" name="intent" value="acceptFriend" />
												<input type="hidden" name="fromId" value={profileUser.id} />
												<button type="submit" className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-medium mr-2">Accept</button>
											</form>
											<form method="post" className="inline">
												<input type="hidden" name="intent" value="rejectFriend" />
												<input type="hidden" name="fromId" value={profileUser.id} />
												<button type="submit" className="px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm">Decline</button>
											</form>
										</>
									)}
									{friendStatus === "friends" && (
										<Link to={`/messages/${profileUser.id}`} className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500">
											Message
										</Link>
									)}
								</div>
							)}
						</div>
					</div>

					{!editing ? (
						<div className="space-y-3 text-gray-700 dark:text-gray-300">
							{profile?.bio && <p className="whitespace-pre-wrap">{profile.bio}</p>}
							<div className="grid gap-2 text-sm">
								{profile?.paddle && <p><span className="font-semibold text-gray-500 dark:text-gray-400">Paddle:</span> {profile.paddle}</p>}
								{profile?.shoes && <p><span className="font-semibold text-gray-500 dark:text-gray-400">Shoes:</span> {profile.shoes}</p>}
								{profile?.gear && <p><span className="font-semibold text-gray-500 dark:text-gray-400">Gear:</span> {profile.gear}</p>}
								{profile?.duprLink && (
									<p>
										<span className="font-semibold text-gray-500 dark:text-gray-400">DUPR:</span>{" "}
										<a href={profile.duprLink.startsWith("http") ? profile.duprLink : `https://${profile.duprLink}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline">
											{profile.duprLink}
										</a>
									</p>
								)}
							</div>
							{isMe && (
								<button type="button" onClick={() => setEditing(true)} className="mt-4 px-4 py-2 rounded-full border-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
									Edit profile
								</button>
							)}
						</div>
					) : (
						<form method="post" className="space-y-4" onSubmit={() => setEditing(false)}>
							<input type="hidden" name="intent" value="updateProfile" />
							<div>
								<label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Bio</label>
								<textarea name="bio" defaultValue={profile?.bio ?? ""} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" placeholder="A bit about you..." />
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Paddle</label>
								<input type="text" name="paddle" defaultValue={profile?.paddle ?? ""} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" placeholder="e.g. Selkirk Vanguard" />
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Shoes</label>
								<input type="text" name="shoes" defaultValue={profile?.shoes ?? ""} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" placeholder="e.g. K-Swiss" />
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Gear</label>
								<input type="text" name="gear" defaultValue={profile?.gear ?? ""} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" placeholder="Bags, grips, etc." />
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">DUPR link</label>
								<input type="url" name="duprLink" defaultValue={profile?.duprLink ?? ""} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" placeholder="https://dupr.com/..." />
							</div>
							<div className="flex gap-2">
								<button type="submit" className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500">Save</button>
								<button type="button" onClick={() => setEditing(false)} className="px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm">Cancel</button>
							</div>
						</form>
					)}
				</div>
			</main>
		</div>
	);
}
