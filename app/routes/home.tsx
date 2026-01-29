import { useState } from "react";
import { Link, redirect, useFetcher, useLoaderData } from "react-router";
import { AppShell } from "~/components/AppShell";
import {
	addComment,
	addCourtAdmin,
	createCoachingListing,
	createPost,
	createSession,
	deleteCoachingListing,
	getAdminsForCourts,
	getCoachingListings,
	getCodesForCourts,
	getCourts,
	getMyQueueAndAdminStatusForCourts,
	getOptionalUser,
	getOrCreateDemoUser,
	getPosts,
	getQueuesForCourts,
	getUsers,
	isCourtAdmin,
	joinCourtQueue,
	leaveCourtQueue,
	sessionCookie,
	toggleLike,
} from "~/lib/db.server";
import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "Pickleball - Connect, Find Courts, Find Games" },
		{
			name: "description",
			content:
				"The pickleball community. Chat, find courts, and join games and sessions—all in one place.",
		},
	];
}

const COURT_IDS = ["1", "2", "3"]; // fallback when courts table empty; otherwise derived from courts

export async function loader({ context, request }: Route.LoaderArgs) {
	const db = context.cloudflare.env.DB;
	if (!db) {
		return {
			user: null,
			posts: [],
			users: [],
			courtQueues: {} as Record<
				string,
				{ userId: string; userName: string; position: number; createdAt: string }[]
			>,
			courtCodes: {} as Record<string, string>,
			courtAdmins: {} as Record<string, { userId: string; userName: string; createdAt: string }[]>,
			myInQueue: {} as Record<string, boolean>,
			myAdminStatus: {} as Record<string, boolean>,
			coachingListings: [] as {
				id: string;
				userId: string;
				userName: string;
				title: string;
				description: string | null;
				location: string | null;
				availability: string | null;
				rate: string | null;
				contactInfo: string | null;
				createdAt: string;
			}[],
			courts: [] as {
				id: string;
				name: string;
				address: string | null;
				city: string | null;
				state: string | null;
				country: string;
				courtCount: number;
				amenities: string | null;
				courtType: string | null;
				reservable: boolean;
				createdAt: string;
			}[],
			origin: "",
			oauth: {
				google: !!context.cloudflare.env.GOOGLE_CLIENT_ID,
				github: !!context.cloudflare.env.GITHUB_CLIENT_ID,
			},
		};
	}
	const user = await getOptionalUser(db, request);
	const posts = await getPosts(db, user?.id ?? null);
	const users = await getUsers(db, 50);
	const courtsFromDb = await getCourts(db, { limit: 50 });
	const courtIds = courtsFromDb.length > 0 ? courtsFromDb.map((c) => c.id) : COURT_IDS;
	const [courtQueues, courtCodes, courtAdmins, queueAndAdmin] = await Promise.all([
		getQueuesForCourts(db, courtIds),
		getCodesForCourts(db, courtIds),
		getAdminsForCourts(db, courtIds),
		user
			? getMyQueueAndAdminStatusForCourts(db, user.id, courtIds)
			: Promise.resolve({
					inQueue: {} as Record<string, boolean>,
					isAdmin: {} as Record<string, boolean>,
				}),
	]);
	const myInQueue = queueAndAdmin.inQueue;
	const myAdminStatus = queueAndAdmin.isAdmin;
	const coachingListings = await getCoachingListings(db, 100);
	const origin = new URL(request.url).origin;
	return {
		user,
		posts,
		users,
		courtQueues,
		courtCodes,
		courtAdmins,
		myInQueue,
		myAdminStatus,
		coachingListings,
		courts: courtsFromDb,
		origin,
		oauth: {
			google: !!context.cloudflare.env.GOOGLE_CLIENT_ID,
			github: !!context.cloudflare.env.GITHUB_CLIENT_ID,
		},
	};
}

export async function action({ context, request }: Route.ActionArgs) {
	const db = context.cloudflare.env.DB;
	if (!db) {
		return { error: "Database not configured" };
	}
	const formData = await request.formData();
	const intent = formData.get("intent");

	if (intent === "demoLogin") {
		const email = (formData.get("email") as string)?.trim();
		const _password = formData.get("password");
		if (!email) return { error: "Email required" };
		const user = await getOrCreateDemoUser(db, email, email.split("@")[0] || "Player");
		const token = await createSession(db, user.id);
		return redirect("/home", {
			headers: { "Set-Cookie": sessionCookie(token) },
		});
	}

	if (intent === "addPost" || intent === "like" || intent === "addComment") {
		const user = await getOptionalUser(db, request);
		if (!user) return { error: "Login required" };

		if (intent === "addPost") {
			const content = (formData.get("content") as string)?.trim();
			if (!content) return { error: "Content required" };
			await createPost(db, user.id, content);
			return redirect("/home");
		}

		if (intent === "like") {
			const postId = formData.get("postId") as string;
			if (!postId) return { error: "postId required" };
			await toggleLike(db, postId, user.id);
			return redirect("/home");
		}

		if (intent === "addComment") {
			const postId = formData.get("postId") as string;
			const content = (formData.get("content") as string)?.trim();
			if (!postId || !content) return { error: "postId and content required" };
			await addComment(db, postId, user.id, content);
			return redirect("/home");
		}
	}

	if (intent === "joinQueue" || intent === "leaveQueue") {
		const user = await getOptionalUser(db, request);
		if (!user) return { error: "Login required" };
		const courtId = formData.get("courtId") as string;
		if (!courtId) return { error: "Invalid court" };
		if (intent === "joinQueue") await joinCourtQueue(db, courtId, user.id);
		else await leaveCourtQueue(db, courtId, user.id);
		return redirect("/home");
	}

	if (intent === "makeAdmin") {
		const currentUser = await getOptionalUser(db, request);
		if (!currentUser) return { error: "Login required" };
		const courtId = formData.get("courtId") as string;
		const targetUserId = formData.get("userId") as string;
		if (!courtId || !targetUserId) return { error: "Invalid request" };
		const isAdmin = await isCourtAdmin(db, courtId, currentUser.id);
		if (!isAdmin) return { error: "Only admins can make others admin" };
		await addCourtAdmin(db, courtId, targetUserId);
		return redirect("/home");
	}

	if (intent === "addCoaching") {
		const user = await getOptionalUser(db, request);
		if (!user) return { error: "Login required" };
		const title = (formData.get("title") as string)?.trim();
		if (!title) return { error: "Title required" };
		await createCoachingListing(db, user.id, {
			title,
			description: (formData.get("description") as string)?.trim() || undefined,
			location: (formData.get("location") as string)?.trim() || undefined,
			availability: (formData.get("availability") as string)?.trim() || undefined,
			rate: (formData.get("rate") as string)?.trim() || undefined,
			contactInfo: (formData.get("contactInfo") as string)?.trim() || undefined,
		});
		return redirect("/home");
	}

	if (intent === "deleteCoaching") {
		const user = await getOptionalUser(db, request);
		if (!user) return { error: "Login required" };
		const listingId = formData.get("listingId") as string;
		if (!listingId) return { error: "Listing ID required" };
		const result = await deleteCoachingListing(db, listingId, user.id);
		if (result.error) return { error: result.error };
		return redirect("/home");
	}

	return { error: "Unknown action" };
}

const MOCK_COURTS = [
	{ id: "1", name: "Downtown Community Center", courts: 4, rating: "4.8", address: "123 Main St" },
	{ id: "2", name: "Riverside Park", courts: 2, rating: "4.6", address: "456 River Rd" },
	{ id: "3", name: "Sunset Rec Complex", courts: 6, rating: "4.9", address: "789 Sunset Blvd" },
];

const TIME_SLOTS = [
	"9:00 AM",
	"10:00 AM",
	"11:00 AM",
	"12:00 PM",
	"1:00 PM",
	"2:00 PM",
	"3:00 PM",
	"4:00 PM",
	"5:00 PM",
];

function isSlotTaken(slotIndex: number, courtId: string): boolean {
	const hash = (courtId + slotIndex) % 5;
	return hash === 0 || hash === 2;
}

function formatTime(iso: string) {
	const d = new Date(iso);
	const now = new Date();
	const diff = now.getTime() - d.getTime();
	if (diff < 60000) return "Just now";
	if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
	if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
	if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
	return d.toLocaleDateString();
}

export default function Home() {
	const loaderData = useLoaderData<typeof loader>();
	const {
		user,
		posts,
		courtQueues = {},
		courtCodes = {},
		courtAdmins = {},
		myInQueue = {},
		myAdminStatus = {},
		coachingListings = [],
		courts = [],
		origin = "",
	} = loaderData;
	const [activeTab, setActiveTab] = useState<"feed" | "courts" | "reserve" | "coaching">("feed");
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
	const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
	const [selectedDate, setSelectedDate] = useState<string>("");
	const [selectedTime, setSelectedTime] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [reservationId, setReservationId] = useState<string>("");
	const courtsForTab = courts.length > 0 ? courts : MOCK_COURTS;
	const isLoggedIn = !!user;
	const likeFetcher = useFetcher();
	const commentFetcher = useFetcher();

	const handleReserve = async () => {
		if (!selectedCourt || !selectedDate || !selectedTime) return;
		setIsSubmitting(true);
		setReservationId("");
		await new Promise((r) => setTimeout(r, 1500));
		setReservationId(`PB-${Date.now().toString(36).toUpperCase().slice(-6)}`);
		setIsSubmitting(false);
		setIsSuccess(true);
	};

	const resetSimulation = () => {
		setSelectedCourt(null);
		setSelectedDate("");
		setSelectedTime(null);
		setIsSuccess(false);
		setReservationId("");
	};

	const handleLike = (postId: string) => {
		if (!user) {
			setShowLoginModal(true);
			return;
		}
		likeFetcher.submit({ intent: "like", postId }, { method: "post" });
	};

	const handleAddComment = (postId: string) => {
		const content = (commentInputs[postId] ?? "").trim();
		if (!user || !content) return;
		commentFetcher.submit({ intent: "addComment", postId, content }, { method: "post" });
		setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
	};

	const court = courtsForTab.find((c) => c.id === selectedCourt);
	const today = new Date().toISOString().slice(0, 10);
	const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

	return (
		<AppShell user={user}>
			{/* Login Modal — demo: any email/password creates or reuses a demo account */}
			{showLoginModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
					<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
						<button
							type="button"
							onClick={() => setShowLoginModal(false)}
							className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
						>
							<svg
								className="w-6 h-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden
							>
								<title>Close</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
						<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome back</h2>
						<p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
							Demo — any email and password work.
						</p>
						<form method="post" className="space-y-4">
							<input type="hidden" name="intent" value="demoLogin" />
							<input
								type="email"
								name="email"
								placeholder="Email"
								required
								className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none"
							/>
							<input
								type="password"
								name="password"
								placeholder="Password"
								required
								className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none"
							/>
							<button
								type="submit"
								className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold disabled:opacity-50"
							>
								Login
							</button>
						</form>
					</div>
				</div>
			)}

			{/* Home page tabs — Feed first (Facebook-like) */}
			<div className="mx-auto max-w-2xl">
				<div className="flex flex-wrap gap-2 mb-6 p-1 rounded-xl bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 shadow-sm">
					<button
						type="button"
						onClick={() => setActiveTab("feed")}
						className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
							activeTab === "feed"
								? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm"
								: "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
						}`}
					>
						Feed
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("courts")}
						className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
							activeTab === "courts"
								? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm"
								: "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
						}`}
					>
						Courts
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("reserve")}
						className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
							activeTab === "reserve"
								? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm"
								: "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
						}`}
					>
						Reserve
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("coaching")}
						className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
							activeTab === "coaching"
								? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm"
								: "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
						}`}
					>
						Lessons
					</button>
				</div>

				<div className="min-h-[60vh]">
					{/* Feed tab */}
					{activeTab === "feed" && (
						<div className="space-y-6">
							{isLoggedIn && (
								<div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
									<form method="post" className="space-y-3">
										<input type="hidden" name="intent" value="addPost" />
										<textarea
											name="content"
											required
											placeholder="What's on your mind? Ask for partners, share court tips..."
											rows={3}
											className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none resize-none"
										/>
										<div className="flex justify-end">
											<button
												type="submit"
												className="px-5 py-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm hover:shadow-md"
											>
												Post
											</button>
										</div>
									</form>
								</div>
							)}

							<div className="space-y-4">
								{posts.map((post) => (
									<article
										key={post.id}
										className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
									>
										<div className="p-4">
											<div className="flex items-center gap-3 mb-3">
												<div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
													{post.authorName.slice(0, 1).toUpperCase()}
												</div>
												<div>
													<div className="font-semibold text-gray-900 dark:text-white">
														{post.authorName}
													</div>
													<div className="text-xs text-gray-500 dark:text-gray-400">
														{formatTime(post.createdAt)}
													</div>
												</div>
											</div>
											<p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
												{post.content}
											</p>
											<div className="flex items-center gap-4 mt-4">
												<button
													type="button"
													onClick={() => handleLike(post.id)}
													className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
														post.likedByMe
															? "text-emerald-600 dark:text-emerald-400"
															: "text-gray-500 dark:text-gray-400 hover:text-emerald-600"
													}`}
												>
													<svg
														className="w-5 h-5"
														fill={post.likedByMe ? "currentColor" : "none"}
														viewBox="0 0 24 24"
														stroke="currentColor"
														aria-hidden
													>
														<title>Like</title>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
														/>
													</svg>
													{post.likes}
												</button>
												<span className="text-sm text-gray-500 dark:text-gray-400">
													{post.comments.length} comments
												</span>
											</div>
										</div>
										{/* Comments */}
										{post.comments.length > 0 && (
											<div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 px-4 py-3 space-y-3">
												{post.comments.map((c) => (
													<div key={c.id} className="flex gap-2">
														<span className="font-medium text-gray-900 dark:text-white text-sm">
															{c.authorName}:
														</span>
														<span className="text-gray-700 dark:text-gray-300 text-sm">
															{c.content}
														</span>
														<span className="text-xs text-gray-500 ml-auto">
															{formatTime(c.createdAt)}
														</span>
													</div>
												))}
											</div>
										)}
										{isLoggedIn && (
											<div className="border-t border-gray-200 dark:border-gray-700 p-3 flex gap-2">
												<input
													value={commentInputs[post.id] ?? ""}
													onChange={(e) =>
														setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
													}
													onKeyDown={(e) => {
														if (e.key === "Enter" && !e.shiftKey) {
															e.preventDefault();
															handleAddComment(post.id);
														}
													}}
													placeholder="Write a comment..."
													className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
												/>
												<button
													type="button"
													onClick={() => handleAddComment(post.id)}
													disabled={!(commentInputs[post.id] ?? "").trim()}
													className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-emerald-500"
												>
													Reply
												</button>
											</div>
										)}
									</article>
								))}
							</div>
						</div>
					)}

					{/* Courts tab */}
					{activeTab === "courts" && (
						<div className="space-y-6">
							<h1 className="text-2xl font-bold text-gray-900 dark:text-white">Find courts</h1>
							<p className="text-gray-600 dark:text-gray-400">
								Browse courts, join the queue (no paddles on the floor!), or reserve a spot.
							</p>
							<div className="flex gap-2 mb-4">
								<Link
									to="/courts"
									className="px-3 py-2 rounded-lg text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
								>
									See all courts →
								</Link>
								<Link
									to="/guides"
									className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
								>
									Guides & learn
								</Link>
							</div>
							<div className="grid gap-4">
								{courtsForTab.map((c) => {
									const queue = courtQueues[c.id] ?? [];
									const inQueue = myInQueue[c.id];
									const myPosition = queue.findIndex((e) => e.userId === user?.id) + 1;
									const roomCode = courtCodes[c.id];
									const joinUrl = origin && roomCode ? `${origin}/join/${roomCode}` : "";
									const courtCount = "courtCount" in c ? c.courtCount : c.courts;
									const address = "address" in c ? c.address : c.address;
									return (
										<div
											key={c.id}
											className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4"
										>
											<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
												<div>
													<Link
														to={`/courts/${c.id}`}
														className="font-semibold text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400"
													>
														{c.name}
													</Link>
													<p className="text-sm text-gray-500 dark:text-gray-400">
														{address ?? ""}
													</p>
													<p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
														{courtCount} courts
														{"rating" in c ? ` · ${c.rating}★` : ""}
													</p>
												</div>
												<button
													type="button"
													onClick={() => {
														setSelectedCourt(c.id);
														setActiveTab("reserve");
													}}
													className="px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm hover:shadow-md self-start sm:self-center"
												>
													Reserve
												</button>
											</div>
											{/* Room code: others scan QR or enter code to join */}
											{roomCode && (
												<div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex flex-col sm:flex-row sm:items-start gap-4">
													<div>
														<h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
															Room code
														</h3>
														<p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
															Other players can scan the QR code or enter this code to join this
															room.
														</p>
														<p className="font-mono text-lg font-bold text-gray-900 dark:text-white tracking-wider">
															{roomCode}
														</p>
													</div>
													{joinUrl && (
														<div className="flex-shrink-0">
															<img
																src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(joinUrl)}`}
																alt={`QR code to join ${c.name}`}
																className="rounded-lg border border-gray-200 dark:border-gray-600 w-[120px] h-[120px]"
															/>
														</div>
													)}
												</div>
											)}
											{/* Court queue: digital paddle stack */}
											<div className="border-t border-gray-200 dark:border-gray-700 pt-4">
												{(courtAdmins[c.id] ?? []).length > 0 && (
													<div className="mb-2">
														<span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
															Admins:{" "}
														</span>
														<span className="text-xs text-gray-700 dark:text-gray-300">
															{(courtAdmins[c.id] ?? []).map((a) => a.userName).join(", ")}
														</span>
														{myAdminStatus[c.id] && (
															<span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium ml-1">
																(you)
															</span>
														)}
													</div>
												)}
												<div className="flex items-center justify-between mb-2">
													<h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
														Queue
													</h3>
													<span className="text-xs text-gray-500 dark:text-gray-400">
														{queue.length} in line
													</span>
												</div>
												<p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
													No need to put your paddle on the floor — join the digital queue.
												</p>
												{queue.length > 0 && (
													<ul className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 mb-3 space-y-0.5">
														{queue.slice(0, 8).map((e) => {
															const isAdmin = (courtAdmins[c.id] ?? []).some(
																(a) => a.userId === e.userId,
															);
															return (
																<li key={e.userId} className="flex items-center gap-2 flex-wrap">
																	<span>
																		{e.userName}
																		{e.userId === user?.id && (
																			<span className="text-emerald-600 dark:text-emerald-400 ml-1">
																				(you)
																			</span>
																		)}
																		{isAdmin && (
																			<span className="text-amber-600 dark:text-amber-400 text-xs ml-1">
																				admin
																			</span>
																		)}
																	</span>
																	{myAdminStatus[c.id] && !isAdmin && e.userId !== user?.id && (
																		<form method="post" className="inline">
																			<input type="hidden" name="intent" value="makeAdmin" />
																			<input type="hidden" name="courtId" value={c.id} />
																			<input type="hidden" name="userId" value={e.userId} />
																			<button
																				type="submit"
																				className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
																			>
																				Make admin
																			</button>
																		</form>
																	)}
																</li>
															);
														})}
														{queue.length > 8 && (
															<li className="text-gray-500">+{queue.length - 8} more</li>
														)}
													</ul>
												)}
												{isLoggedIn ? (
													inQueue ? (
														<div className="flex items-center gap-2 flex-wrap">
															{myPosition > 0 && (
																<span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
																	You're #{myPosition} in line
																</span>
															)}
															<form method="post" className="inline">
																<input type="hidden" name="intent" value="leaveQueue" />
																<input type="hidden" name="courtId" value={c.id} />
																<button
																	type="submit"
																	className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
																>
																	Leave queue
																</button>
															</form>
														</div>
													) : (
														<form method="post" className="inline">
															<input type="hidden" name="intent" value="joinQueue" />
															<input type="hidden" name="courtId" value={c.id} />
															<button
																type="submit"
																className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500"
															>
																Join queue
															</button>
														</form>
													)
												) : (
													<button
														type="button"
														onClick={() => setShowLoginModal(true)}
														className="text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
													>
														Log in to join queue
													</button>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					)}

					{/* Coaching / private lessons tab */}
					{activeTab === "coaching" && (
						<div className="space-y-6">
							<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
								Private lessons & coaching
							</h1>
							<p className="text-gray-600 dark:text-gray-400">
								Find coaches or advertise your own lessons. List your availability, location, and
								rate.
							</p>

							{!isLoggedIn && (
								<div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 text-center">
									<p className="text-gray-700 dark:text-gray-300 mb-4">
										Log in to post a coaching listing.
									</p>
									<button
										type="button"
										onClick={() => setShowLoginModal(true)}
										className="px-6 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:shadow-md"
									>
										Login to post
									</button>
								</div>
							)}

							{isLoggedIn && (
								<div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
									<h2 className="font-semibold text-gray-900 dark:text-white mb-4">
										Post a listing
									</h2>
									<form method="post" className="space-y-4">
										<input type="hidden" name="intent" value="addCoaching" />
										<div>
											<label
												htmlFor="coaching-title"
												className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
											>
												Title *
											</label>
											<input
												id="coaching-title"
												type="text"
												name="title"
												required
												placeholder="e.g. Private pickleball lessons — all levels"
												className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
											/>
										</div>
										<div>
											<label
												htmlFor="coaching-description"
												className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
											>
												Description
											</label>
											<textarea
												id="coaching-description"
												name="description"
												rows={3}
												placeholder="What you offer, experience, style..."
												className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm resize-none"
											/>
										</div>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
											<div>
												<label
													htmlFor="coaching-location"
													className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
												>
													Location
												</label>
												<input
													id="coaching-location"
													type="text"
													name="location"
													placeholder="e.g. Downtown Rec, Riverside Park"
													className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
												/>
											</div>
											<div>
												<label
													htmlFor="coaching-availability"
													className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
												>
													Availability
												</label>
												<input
													id="coaching-availability"
													type="text"
													name="availability"
													placeholder="e.g. Weekends 9am–5pm, weekday evenings"
													className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
												/>
											</div>
										</div>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
											<div>
												<label
													htmlFor="coaching-rate"
													className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
												>
													Rate
												</label>
												<input
													id="coaching-rate"
													type="text"
													name="rate"
													placeholder="e.g. $50/hr, $30/session"
													className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
												/>
											</div>
											<div>
												<label
													htmlFor="coaching-contactInfo"
													className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
												>
													Contact
												</label>
												<input
													id="coaching-contactInfo"
													type="text"
													name="contactInfo"
													placeholder="e.g. DM here, or email@example.com"
													className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
												/>
											</div>
										</div>
										<button
											type="submit"
											className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm hover:shadow-md"
										>
											Post listing
										</button>
									</form>
								</div>
							)}

							<div className="space-y-4">
								<h2 className="text-lg font-semibold text-gray-900 dark:text-white">Listings</h2>
								{coachingListings.length === 0 ? (
									<p className="text-gray-500 dark:text-gray-400">
										No coaching listings yet. Be the first to post.
									</p>
								) : (
									<ul className="space-y-4">
										{coachingListings.map((listing) => (
											<li
												key={listing.id}
												className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm"
											>
												<div className="flex items-start justify-between gap-4">
													<div className="min-w-0 flex-1">
														<h3 className="font-semibold text-gray-900 dark:text-white">
															{listing.title}
														</h3>
														<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
															{listing.userName} · {formatTime(listing.createdAt)}
														</p>
														{listing.description && (
															<p className="mt-2 text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
																{listing.description}
															</p>
														)}
														<div className="mt-3 flex flex-wrap gap-3 text-sm">
															{listing.location && (
																<span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
																	<svg
																		className="w-4 h-4 flex-shrink-0"
																		fill="none"
																		viewBox="0 0 24 24"
																		stroke="currentColor"
																		aria-hidden
																	>
																		<title>Location</title>
																		<path
																			strokeLinecap="round"
																			strokeLinejoin="round"
																			strokeWidth={2}
																			d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
																		/>
																		<path
																			strokeLinecap="round"
																			strokeLinejoin="round"
																			strokeWidth={2}
																			d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
																		/>
																	</svg>
																	{listing.location}
																</span>
															)}
															{listing.availability && (
																<span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
																	<svg
																		className="w-4 h-4 flex-shrink-0"
																		fill="none"
																		viewBox="0 0 24 24"
																		stroke="currentColor"
																		aria-hidden
																	>
																		<title>Availability</title>
																		<path
																			strokeLinecap="round"
																			strokeLinejoin="round"
																			strokeWidth={2}
																			d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
																		/>
																	</svg>
																	{listing.availability}
																</span>
															)}
															{listing.rate && (
																<span className="font-medium text-emerald-600 dark:text-emerald-400">
																	{listing.rate}
																</span>
															)}
														</div>
														{listing.contactInfo && (
															<p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
																Contact: {listing.contactInfo}
															</p>
														)}
													</div>
													{user?.id === listing.userId && (
														<form method="post" className="flex-shrink-0">
															<input type="hidden" name="intent" value="deleteCoaching" />
															<input type="hidden" name="listingId" value={listing.id} />
															<button
																type="submit"
																className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
															>
																Remove
															</button>
														</form>
													)}
												</div>
											</li>
										))}
									</ul>
								)}
							</div>
						</div>
					)}

					{/* Reserve tab */}
					{activeTab === "reserve" && (
						<div className="space-y-6">
							<h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reserve a court</h1>
							<p className="text-gray-600 dark:text-gray-400">
								Pick a court, date, and time. Demo — no real booking.
							</p>

							{!isLoggedIn ? (
								<div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
									<p className="text-gray-700 dark:text-gray-300 mb-6">Log in to reserve a spot.</p>
									<button
										type="button"
										onClick={() => setShowLoginModal(true)}
										className="px-6 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:shadow-md"
									>
										Login to reserve
									</button>
								</div>
							) : !isSuccess ? (
								<div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
									<div>
										<span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
											Court
										</span>
										<div className="grid gap-2">
											{courtsForTab.map((c) => (
												<button
													key={c.id}
													type="button"
													onClick={() => setSelectedCourt(c.id)}
													className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${
														selectedCourt === c.id
															? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-500"
															: "border-gray-200 dark:border-gray-600 hover:border-emerald-300"
													}`}
												>
													<span className="font-medium text-gray-900 dark:text-white">
														{c.name}
													</span>
													<span className="text-sm text-gray-500 dark:text-gray-400">
														{"courtCount" in c ? c.courtCount : c.courts} courts
														{"rating" in c ? ` · ${c.rating}★` : ""}
													</span>
												</button>
											))}
										</div>
									</div>
									{selectedCourt && (
										<>
											{courtCodes[selectedCourt] && origin && (
												<div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 p-4 flex items-center gap-4">
													<div>
														<p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
															Share room code — others scan to join
														</p>
														<p className="font-mono font-bold text-gray-900 dark:text-white tracking-wider">
															{courtCodes[selectedCourt]}
														</p>
													</div>
													<img
														src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`${origin}/join/${courtCodes[selectedCourt]}`)}`}
														alt="QR code to join room"
														className="rounded-lg border border-gray-200 dark:border-gray-600 w-[80px] h-[80px] flex-shrink-0"
													/>
												</div>
											)}
											<div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 p-4">
												<p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
													Or join the queue (no paddles on the floor)
												</p>
												{(courtQueues[selectedCourt] ?? []).length > 0 && (
													<p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
														{(courtQueues[selectedCourt] ?? []).length} in line
													</p>
												)}
												{myInQueue[selectedCourt] ? (
													<form method="post">
														<input type="hidden" name="intent" value="leaveQueue" />
														<input type="hidden" name="courtId" value={selectedCourt} />
														<button
															type="submit"
															className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
														>
															Leave queue
														</button>
													</form>
												) : (
													<form method="post">
														<input type="hidden" name="intent" value="joinQueue" />
														<input type="hidden" name="courtId" value={selectedCourt} />
														<button
															type="submit"
															className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500"
														>
															Join queue
														</button>
													</form>
												)}
											</div>
										</>
									)}
									<div>
										<span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
											Date
										</span>
										<div className="flex gap-2">
											<button
												type="button"
												onClick={() => setSelectedDate(today)}
												className={`px-4 py-2 rounded-lg border-2 font-medium text-sm ${
													selectedDate === today
														? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
														: "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
												}`}
											>
												Today
											</button>
											<button
												type="button"
												onClick={() => setSelectedDate(tomorrow)}
												className={`px-4 py-2 rounded-lg border-2 font-medium text-sm ${
													selectedDate === tomorrow
														? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
														: "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
												}`}
											>
												Tomorrow
											</button>
										</div>
									</div>
									<div>
										<span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
											Time
										</span>
										<div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
											{TIME_SLOTS.map((time, i) => {
												const taken = selectedCourt ? isSlotTaken(i, selectedCourt) : false;
												const isSelected = selectedTime === time;
												return (
													<button
														key={time}
														type="button"
														disabled={taken}
														onClick={() => !taken && setSelectedTime(time)}
														className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
															taken
																? "border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed line-through"
																: isSelected
																	? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
																	: "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-emerald-300"
														}`}
													>
														{time}
													</button>
												);
											})}
										</div>
									</div>
									<button
										type="button"
										onClick={handleReserve}
										disabled={!selectedCourt || !selectedDate || !selectedTime || isSubmitting}
										className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
									>
										{isSubmitting ? (
											<span className="flex items-center justify-center gap-2">
												<svg
													className="animate-spin h-5 w-5"
													viewBox="0 0 24 24"
													fill="none"
													aria-hidden
												>
													<title>Loading</title>
													<circle
														className="opacity-25"
														cx="12"
														cy="12"
														r="10"
														stroke="currentColor"
														strokeWidth="4"
													/>
													<path
														className="opacity-75"
														fill="currentColor"
														d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
													/>
												</svg>
												Reserving…
											</span>
										) : (
											"Reserve this spot"
										)}
									</button>
								</div>
							) : (
								<div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-emerald-500 p-8 text-center">
									<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
										<svg
											className="w-8 h-8 text-emerald-600 dark:text-emerald-400"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											aria-hidden
										>
											<title>Success</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M5 13l4 4L19 7"
											/>
										</svg>
									</div>
									<h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
										You're all set!
									</h2>
									<p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
										Demo only — no real booking.
									</p>
									<div className="bg-gray-100 dark:bg-gray-700/50 rounded-xl p-4 text-left max-w-sm mx-auto mb-6 text-sm">
										<div className="text-gray-500 dark:text-gray-400">Confirmation #</div>
										<div className="font-mono font-bold text-gray-900 dark:text-white">
											{reservationId}
										</div>
										<div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
											{court?.name}
											<br />
											{selectedDate === today ? "Today" : "Tomorrow"} at {selectedTime}
										</div>
									</div>
									<button
										type="button"
										onClick={resetSimulation}
										className="px-5 py-2.5 rounded-full border-2 border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
									>
										Reserve another
									</button>
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			<footer className="border-t border-gray-200 dark:border-gray-800 py-6 mt-12">
				<div className="mx-auto max-w-2xl flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
					<span className="font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
						Pickleball
					</span>
					<div className="flex gap-6">
						<a href="/#privacy" className="hover:text-emerald-600 dark:hover:text-emerald-400">
							Privacy
						</a>
						<a href="/#terms" className="hover:text-emerald-600 dark:hover:text-emerald-400">
							Terms
						</a>
						<a href="/#contact" className="hover:text-emerald-600 dark:hover:text-emerald-400">
							Contact
						</a>
					</div>
				</div>
			</footer>
		</AppShell>
	);
}
