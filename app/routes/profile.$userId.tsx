import { useState } from "react";
import { Link, useLoaderData } from "react-router";
import {
	acceptFriendRequest,
	getFriendStatus,
	getProfile,
	getRegions,
	getSessionToken,
	getSessionUser,
	getUser,
	rejectFriendRequest,
	sendFriendRequest,
	upsertProfile,
} from "~/lib/db.server";
import type { Route } from "./+types/profile.$userId";

export function meta(_args: Route.MetaArgs) {
	return [{ title: "Profile - Pickleball" }];
}

export async function loader({ context, request, params }: Route.LoaderArgs) {
	const db = context.cloudflare.env.DB;
	const userId = params.userId;
	if (!db || !userId)
		return {
			currentUser: null,
			profileUser: null,
			profile: null,
			regions: [],
			friendStatus: "none" as const,
		};
	const cookieHeader = request.headers.get("Cookie");
	const token = getSessionToken(cookieHeader);
	const currentUser = await getSessionUser(db, token);
	const isMe = currentUser?.id === userId;
	const profileUser = await getUser(db, userId);
	if (!profileUser)
		return {
			currentUser,
			profileUser: null,
			profile: null,
			regions: [],
			friendStatus: "none" as const,
		};
	const [profile, regions] = await Promise.all([getProfile(db, userId), getRegions(db, 100)]);
	const friendStatus =
		currentUser && !isMe ? await getFriendStatus(db, currentUser.id, userId) : "none";
	return { currentUser, profileUser, profile, regions, friendStatus, isMe };
}

const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2MB
const AVATAR_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function action({ context, request, params }: Route.ActionArgs) {
	const db = context.cloudflare.env.DB;
	const bucket = context.cloudflare.env.PICKLEBALL_BUCKET;
	const userId = params.userId;
	if (!db || !userId) return { error: "Not found" };
	const formData = await request.formData();
	const intent = formData.get("intent");
	const cookieHeader = request.headers.get("Cookie");
	const token = getSessionToken(cookieHeader);
	const currentUser = await getSessionUser(db, token);
	if (!currentUser) return { error: "Login required" };

	if (intent === "uploadAvatar" && currentUser.id === userId && bucket) {
		const file = formData.get("avatar") as File | null;
		if (!file || file.size === 0) return { error: "No file" };
		if (file.size > AVATAR_MAX_BYTES) return { error: "File too large (max 2MB)" };
		const type = file.type?.toLowerCase();
		if (!type || !AVATAR_ALLOWED_TYPES.includes(type))
			return { error: "Invalid type (use JPEG, PNG, WebP, or GIF)" };
		const ext =
			type === "image/jpeg"
				? "jpg"
				: type === "image/png"
					? "png"
					: type === "image/webp"
						? "webp"
						: "gif";
		const key = `avatars/${userId}.${ext}`;
		const arrayBuffer = await file.arrayBuffer();
		await bucket.put(key, arrayBuffer, {
			httpMetadata: { contentType: type },
		});
		await upsertProfile(db, userId, { avatarUrl: key });
		return { ok: true };
	}

	if (intent === "updateProfile" && currentUser.id === userId) {
		await upsertProfile(db, userId, {
			bio: (formData.get("bio") as string) || undefined,
			paddle: (formData.get("paddle") as string) || undefined,
			shoes: (formData.get("shoes") as string) || undefined,
			gear: (formData.get("gear") as string) || undefined,
			duprLink: (formData.get("duprLink") as string) || undefined,
			skillLevel: (formData.get("skillLevel") as string) || undefined,
			regionId: (formData.get("regionId") as string) || undefined,
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
	const { currentUser, profileUser, profile, regions, friendStatus, isMe } =
		useLoaderData<typeof loader>();
	const [editing, setEditing] = useState(false);

	if (!profileUser) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
				<p className="text-gray-600 dark:text-gray-400">User not found.</p>
				<Link to="/home" className="text-emerald-600 ml-2">
					Back to home
				</Link>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-950">
			<nav className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
				<div className="container mx-auto px-4 py-3 max-w-4xl flex items-center justify-between">
					<Link
						to="/home"
						className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"
					>
						Pickleball
					</Link>
					<div className="flex gap-2">
						<Link
							to="/friends"
							className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
						>
							Friends
						</Link>
						<Link
							to="/messages"
							className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
						>
							Messages
						</Link>
					</div>
				</div>
			</nav>

			<main className="container mx-auto px-4 py-8 max-w-2xl">
				{/* Profile header */}
				<div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
					<div className="flex items-center gap-4 mb-4">
						<div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-2xl font-bold shrink-0">
							{profile?.avatarUrl ? (
								<img
									src={`/api/avatar/${profileUser.id}?v=${profile.updatedAt ?? ""}`}
									alt=""
									className="w-full h-full object-cover"
								/>
							) : (
								profileUser.name.slice(0, 1).toUpperCase()
							)}
						</div>
						<div>
							<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
								{profileUser.name}
							</h1>
							{!isMe && currentUser && (
								<div className="mt-2 flex gap-2">
									{friendStatus === "none" && (
										<form method="post">
											<input type="hidden" name="intent" value="addFriend" />
											<button
												type="submit"
												className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500"
											>
												Add friend
											</button>
										</form>
									)}
									{friendStatus === "pending_sent" && (
										<span className="px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm">
											Request sent
										</span>
									)}
									{friendStatus === "pending_received" && (
										<>
											<form method="post" className="inline">
												<input type="hidden" name="intent" value="acceptFriend" />
												<input type="hidden" name="fromId" value={profileUser.id} />
												<button
													type="submit"
													className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-medium mr-2"
												>
													Accept
												</button>
											</form>
											<form method="post" className="inline">
												<input type="hidden" name="intent" value="rejectFriend" />
												<input type="hidden" name="fromId" value={profileUser.id} />
												<button
													type="submit"
													className="px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
												>
													Decline
												</button>
											</form>
										</>
									)}
									{friendStatus === "friends" && (
										<Link
											to={`/messages/${profileUser.id}`}
											className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500"
										>
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
								{profile?.skillLevel && (
									<p>
										<span className="font-semibold text-gray-500 dark:text-gray-400">
											Skill level:
										</span>{" "}
										{profile.skillLevel}
									</p>
								)}
								{profile?.regionId && regions.length > 0 && (
									<p>
										<span className="font-semibold text-gray-500 dark:text-gray-400">Region:</span>{" "}
										{regions.find((r) => r.id === profile.regionId)?.name ?? profile.regionId}
									</p>
								)}
								{profile?.paddle && (
									<p>
										<span className="font-semibold text-gray-500 dark:text-gray-400">Paddle:</span>{" "}
										{profile.paddle}
									</p>
								)}
								{profile?.shoes && (
									<p>
										<span className="font-semibold text-gray-500 dark:text-gray-400">Shoes:</span>{" "}
										{profile.shoes}
									</p>
								)}
								{profile?.gear && (
									<p>
										<span className="font-semibold text-gray-500 dark:text-gray-400">Gear:</span>{" "}
										{profile.gear}
									</p>
								)}
								{profile?.duprLink && (
									<p>
										<span className="font-semibold text-gray-500 dark:text-gray-400">DUPR:</span>{" "}
										<a
											href={
												profile.duprLink.startsWith("http")
													? profile.duprLink
													: `https://${profile.duprLink}`
											}
											target="_blank"
											rel="noopener noreferrer"
											className="text-emerald-600 dark:text-emerald-400 hover:underline"
										>
											{profile.duprLink}
										</a>
									</p>
								)}
							</div>
							{isMe && (
								<button
									type="button"
									onClick={() => setEditing(true)}
									className="mt-4 px-4 py-2 rounded-full border-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
								>
									Edit profile
								</button>
							)}
						</div>
					) : (
						<form method="post" className="space-y-4" onSubmit={() => setEditing(false)}>
							<input type="hidden" name="intent" value="updateProfile" />
							{isMe && (
								<div>
									<label
										htmlFor="avatar-upload"
										className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
									>
										Avatar
									</label>
									<form
										method="post"
										encType="multipart/form-data"
										className="flex items-center gap-2"
									>
										<input type="hidden" name="intent" value="uploadAvatar" />
										<input
											id="avatar-upload"
											type="file"
											name="avatar"
											accept="image/jpeg,image/png,image/webp,image/gif"
											className="text-sm text-gray-600 dark:text-gray-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700 dark:file:bg-emerald-900/30 dark:file:text-emerald-300"
										/>
										<button
											type="submit"
											className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500"
										>
											Upload
										</button>
									</form>
									<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
										JPEG, PNG, WebP or GIF, max 2MB.
									</p>
								</div>
							)}
							<div>
								<label
									htmlFor="profile-bio"
									className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
								>
									Bio
								</label>
								<textarea
									id="profile-bio"
									name="bio"
									defaultValue={profile?.bio ?? ""}
									rows={3}
									className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
									placeholder="A bit about you..."
								/>
							</div>
							<div>
								<label
									htmlFor="profile-paddle"
									className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
								>
									Paddle
								</label>
								<input
									id="profile-paddle"
									type="text"
									name="paddle"
									defaultValue={profile?.paddle ?? ""}
									className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
									placeholder="e.g. Selkirk Vanguard"
								/>
							</div>
							<div>
								<label
									htmlFor="profile-shoes"
									className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
								>
									Shoes
								</label>
								<input
									id="profile-shoes"
									type="text"
									name="shoes"
									defaultValue={profile?.shoes ?? ""}
									className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
									placeholder="e.g. K-Swiss"
								/>
							</div>
							<div>
								<label
									htmlFor="profile-gear"
									className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
								>
									Gear
								</label>
								<input
									id="profile-gear"
									type="text"
									name="gear"
									defaultValue={profile?.gear ?? ""}
									className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
									placeholder="Bags, grips, etc."
								/>
							</div>
							<div>
								<label
									htmlFor="profile-duprLink"
									className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
								>
									DUPR link
								</label>
								<input
									id="profile-duprLink"
									type="url"
									name="duprLink"
									defaultValue={profile?.duprLink ?? ""}
									className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
									placeholder="https://dupr.com/..."
								/>
							</div>
							<div>
								<label
									htmlFor="profile-skillLevel"
									className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
								>
									Skill level
								</label>
								<input
									id="profile-skillLevel"
									type="text"
									name="skillLevel"
									defaultValue={profile?.skillLevel ?? ""}
									className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
									placeholder="e.g. 2.5-3.5, All levels"
								/>
							</div>
							<div>
								<label
									htmlFor="profile-regionId"
									className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
								>
									Region
								</label>
								<select
									id="profile-regionId"
									name="regionId"
									className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
									defaultValue={profile?.regionId ?? ""}
								>
									<option value="">—</option>
									{regions.map((r) => (
										<option key={r.id} value={r.id}>
											{r.country} · {r.name}
										</option>
									))}
								</select>
							</div>
							<div className="flex gap-2">
								<button
									type="submit"
									className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500"
								>
									Save
								</button>
								<button
									type="button"
									onClick={() => setEditing(false)}
									className="px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm"
								>
									Cancel
								</button>
							</div>
						</form>
					)}
				</div>
			</main>
		</div>
	);
}
