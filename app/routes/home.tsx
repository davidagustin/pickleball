import { useState, useEffect, useCallback } from "react";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Pickleball - Connect, Find Courts, Reserve" },
		{ name: "description", content: "The pickleball community. Chat, find courts, and reserve spots." },
	];
}

export function loader({ context }: Route.LoaderArgs) {
	return {};
}

const MOCK_COURTS = [
	{ id: "1", name: "Downtown Community Center", courts: 4, rating: "4.8", address: "123 Main St" },
	{ id: "2", name: "Riverside Park", courts: 2, rating: "4.6", address: "456 River Rd" },
	{ id: "3", name: "Sunset Rec Complex", courts: 6, rating: "4.9", address: "789 Sunset Blvd" },
];

const TIME_SLOTS = [
	"9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
	"1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
];

function isSlotTaken(slotIndex: number, courtId: string): boolean {
	const hash = (courtId + slotIndex) % 5;
	return hash === 0 || hash === 2;
}

const STORAGE_POSTS = "pickleball_posts";

type Comment = { id: string; authorName: string; content: string; createdAt: string };
type Post = {
	id: string;
	authorId: string;
	authorName: string;
	content: string;
	createdAt: string;
	likes: number;
	likedBy: string[];
	comments: Comment[];
};

const SEED_POSTS: Post[] = [
	{
		id: "seed-1",
		authorId: "u1",
		authorName: "Sarah",
		content: "Looking for doubles partners at Downtown Community Center this Saturday 10am. Who's in? 🏓",
		createdAt: new Date(Date.now() - 3600000).toISOString(),
		likes: 12,
		likedBy: [],
		comments: [
			{ id: "c1", authorName: "Mike", content: "I'm down! See you there.", createdAt: new Date(Date.now() - 3000000).toISOString() },
			{ id: "c2", authorName: "Jen", content: "Count me in too!", createdAt: new Date(Date.now() - 2400000).toISOString() },
		],
	},
	{
		id: "seed-2",
		authorId: "u2",
		authorName: "Mike",
		content: "Riverside Park courts are freshly resurfaced. Played there yesterday — so smooth!",
		createdAt: new Date(Date.now() - 86400000).toISOString(),
		likes: 28,
		likedBy: [],
		comments: [
			{ id: "c3", authorName: "Alex", content: "Nice, need to check it out.", createdAt: new Date(Date.now() - 80000000).toISOString() },
		],
	},
	{
		id: "seed-3",
		authorId: "u3",
		authorName: "Jen",
		content: "Just reserved a spot at Sunset Rec for tomorrow 3pm. Anyone want to join? We have 3 so far.",
		createdAt: new Date(Date.now() - 7200000).toISOString(),
		likes: 5,
		likedBy: [],
		comments: [],
	},
];

function loadPosts(): Post[] {
	try {
		const raw = localStorage.getItem(STORAGE_POSTS);
		if (raw) {
			const parsed: Post[] = JSON.parse(raw);
			return parsed.map((p) => ({ ...p, likedBy: p.likedBy ?? [], comments: p.comments ?? [] }));
		}
		localStorage.setItem(STORAGE_POSTS, JSON.stringify(SEED_POSTS));
		return SEED_POSTS;
	} catch {
		return SEED_POSTS;
	}
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
	const [activeTab, setActiveTab] = useState<"feed" | "courts" | "reserve">("feed");
	const [posts, setPosts] = useState<Post[]>([]);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [user, setUser] = useState<{ email: string; name: string } | null>(null);
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [loginEmail, setLoginEmail] = useState("");
	const [loginPassword, setLoginPassword] = useState("");
	const [isLoggingIn, setIsLoggingIn] = useState(false);
	const [newPostContent, setNewPostContent] = useState("");
	const [isPosting, setIsPosting] = useState(false);
	const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
	const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
	const [selectedDate, setSelectedDate] = useState<string>("");
	const [selectedTime, setSelectedTime] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [reservationId, setReservationId] = useState<string>("");

	useEffect(() => {
		setPosts(loadPosts());
		const savedUser = localStorage.getItem("pickleball_user");
		if (savedUser) {
			const userData = JSON.parse(savedUser);
			setUser(userData);
			setIsLoggedIn(true);
		}
	}, []);

	const savePosts = useCallback((next: Post[]) => {
		setPosts(next);
		localStorage.setItem(STORAGE_POSTS, JSON.stringify(next));
	}, []);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!loginEmail.trim()) return;
		setIsLoggingIn(true);
		await new Promise((r) => setTimeout(r, 1000));
		const userData = { email: loginEmail, name: loginEmail.split("@")[0] || "Player" };
		localStorage.setItem("pickleball_user", JSON.stringify(userData));
		setUser(userData);
		setIsLoggedIn(true);
		setShowLoginModal(false);
		setLoginEmail("");
		setLoginPassword("");
		setIsLoggingIn(false);
	};

	const handleLogout = () => {
		localStorage.removeItem("pickleball_user");
		setUser(null);
		setIsLoggedIn(false);
		setSelectedCourt(null);
		setSelectedDate("");
		setSelectedTime(null);
		setIsSuccess(false);
	};

	const handleAddPost = async () => {
		if (!user || !newPostContent.trim()) return;
		setIsPosting(true);
		await new Promise((r) => setTimeout(r, 400));
		const post: Post = {
			id: `post-${Date.now()}`,
			authorId: user.email,
			authorName: user.name,
			content: newPostContent.trim(),
			createdAt: new Date().toISOString(),
			likes: 0,
			likedBy: [],
			comments: [],
		};
		savePosts([post, ...posts]);
		setNewPostContent("");
		setIsPosting(false);
	};

	const handleLike = (postId: string) => {
		if (!user) {
			setShowLoginModal(true);
			return;
		}
		const next = posts.map((p) => {
			if (p.id !== postId) return p;
			const liked = p.likedBy.includes(user.email);
			return {
				...p,
				likes: liked ? p.likes - 1 : p.likes + 1,
				likedBy: liked ? p.likedBy.filter((e) => e !== user.email) : [...p.likedBy, user.email],
			};
		});
		savePosts(next);
	};

	const handleAddComment = (postId: string) => {
		const content = (commentInputs[postId] || "").trim();
		if (!user || !content) return;
		const next = posts.map((p) => {
			if (p.id !== postId) return p;
			return {
				...p,
				comments: [
					...p.comments,
					{ id: `c-${Date.now()}`, authorName: user.name, content, createdAt: new Date().toISOString() },
				],
			};
		});
		savePosts(next);
		setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
	};

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

	const court = MOCK_COURTS.find((c) => c.id === selectedCourt);
	const today = new Date().toISOString().slice(0, 10);
	const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-950">
			{/* Login Modal */}
			{showLoginModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
					<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
						<button
							onClick={() => setShowLoginModal(false)}
							className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
						>
							<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
						<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome back</h2>
						<p className="text-gray-600 dark:text-gray-400 text-sm mb-6">Demo — any email and password work.</p>
						<form onSubmit={handleLogin} className="space-y-4">
							<input
								type="email"
								value={loginEmail}
								onChange={(e) => setLoginEmail(e.target.value)}
								placeholder="Email"
								required
								className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none"
							/>
							<input
								type="password"
								value={loginPassword}
								onChange={(e) => setLoginPassword(e.target.value)}
								placeholder="Password"
								required
								className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none"
							/>
							<button
								type="submit"
								disabled={isLoggingIn}
								className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold disabled:opacity-50"
							>
								{isLoggingIn ? "Logging in…" : "Login"}
							</button>
						</form>
					</div>
				</div>
			)}

			{/* Top nav */}
			<nav className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
				<div className="container mx-auto px-4 py-3 max-w-4xl">
					<div className="flex items-center justify-between">
						<div className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
							Pickleball
						</div>
						<div className="flex items-center gap-2 sm:gap-4">
							<button
								onClick={() => setActiveTab("feed")}
								className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
									activeTab === "feed"
										? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
										: "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
								}`}
							>
								Feed
							</button>
							<button
								onClick={() => setActiveTab("courts")}
								className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
									activeTab === "courts"
										? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
										: "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
								}`}
							>
								Courts
							</button>
							<button
								onClick={() => setActiveTab("reserve")}
								className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
									activeTab === "reserve"
										? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
										: "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
								}`}
							>
								Reserve
							</button>
							{isLoggedIn ? (
								<div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
									<span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">{user?.name}</span>
									<button
										onClick={handleLogout}
										className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
									>
										Logout
									</button>
								</div>
							) : (
								<button
									onClick={() => setShowLoginModal(true)}
									className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-90"
								>
									Login
								</button>
							)}
						</div>
					</div>
				</div>
			</nav>

			<main className="container mx-auto px-4 py-6 max-w-4xl min-h-[80vh]">
				{/* Feed tab */}
				{activeTab === "feed" && (
					<div className="space-y-6">
						{isLoggedIn && (
							<div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
								<textarea
									value={newPostContent}
									onChange={(e) => setNewPostContent(e.target.value)}
									placeholder="What's on your mind? Ask for partners, share court tips..."
									rows={3}
									className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none resize-none"
								/>
								<div className="mt-3 flex justify-end">
									<button
										onClick={handleAddPost}
										disabled={!newPostContent.trim() || isPosting}
										className="px-5 py-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm disabled:opacity-50 hover:shadow-md"
									>
										{isPosting ? "Posting…" : "Post"}
									</button>
								</div>
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
												<div className="font-semibold text-gray-900 dark:text-white">{post.authorName}</div>
												<div className="text-xs text-gray-500 dark:text-gray-400">{formatTime(post.createdAt)}</div>
											</div>
										</div>
										<p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{post.content}</p>
										<div className="flex items-center gap-4 mt-4">
											<button
												onClick={() => handleLike(post.id)}
												className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
													user && post.likedBy.includes(user.email)
														? "text-emerald-600 dark:text-emerald-400"
														: "text-gray-500 dark:text-gray-400 hover:text-emerald-600"
												}`}
											>
												<svg className="w-5 h-5" fill={user && post.likedBy.includes(user.email) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
												</svg>
												{post.likes}
											</button>
											<span className="text-sm text-gray-500 dark:text-gray-400">{post.comments.length} comments</span>
										</div>
									</div>
									{/* Comments */}
									{post.comments.length > 0 && (
										<div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 px-4 py-3 space-y-3">
											{post.comments.map((c) => (
												<div key={c.id} className="flex gap-2">
													<span className="font-medium text-gray-900 dark:text-white text-sm">{c.authorName}:</span>
													<span className="text-gray-700 dark:text-gray-300 text-sm">{c.content}</span>
													<span className="text-xs text-gray-500 ml-auto">{formatTime(c.createdAt)}</span>
												</div>
											))}
										</div>
									)}
									{isLoggedIn && (
										<div className="border-t border-gray-200 dark:border-gray-700 p-3 flex gap-2">
											<input
												value={commentInputs[post.id] ?? ""}
												onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
												onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleAddComment(post.id))}
												placeholder="Write a comment..."
												className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
											/>
											<button
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
						<p className="text-gray-600 dark:text-gray-400">Browse courts and reserve a spot when you're ready.</p>
						<div className="grid gap-4">
							{MOCK_COURTS.map((c) => (
								<div
									key={c.id}
									className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
								>
									<div>
										<h2 className="font-semibold text-gray-900 dark:text-white">{c.name}</h2>
										<p className="text-sm text-gray-500 dark:text-gray-400">{c.address}</p>
										<p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">{c.courts} courts · {c.rating}★</p>
									</div>
									<button
										onClick={() => { setSelectedCourt(c.id); setActiveTab("reserve"); }}
										className="px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm hover:shadow-md self-start sm:self-center"
									>
										Reserve
									</button>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Reserve tab */}
				{activeTab === "reserve" && (
					<div className="space-y-6">
						<h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reserve a court</h1>
						<p className="text-gray-600 dark:text-gray-400">Pick a court, date, and time. Demo — no real booking.</p>

						{!isLoggedIn ? (
							<div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
								<p className="text-gray-700 dark:text-gray-300 mb-6">Log in to reserve a spot.</p>
								<button
									onClick={() => setShowLoginModal(true)}
									className="px-6 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:shadow-md"
								>
									Login to reserve
								</button>
							</div>
						) : !isSuccess ? (
							<div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
								<div>
									<label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Court</label>
									<div className="grid gap-2">
										{MOCK_COURTS.map((c) => (
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
												<span className="font-medium text-gray-900 dark:text-white">{c.name}</span>
												<span className="text-sm text-gray-500 dark:text-gray-400">{c.courts} courts · {c.rating}★</span>
											</button>
										))}
									</div>
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date</label>
									<div className="flex gap-2">
										<button
											type="button"
											onClick={() => setSelectedDate(today)}
											className={`px-4 py-2 rounded-lg border-2 font-medium text-sm ${
												selectedDate === today ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
											}`}
										>
											Today
										</button>
										<button
											type="button"
											onClick={() => setSelectedDate(tomorrow)}
											className={`px-4 py-2 rounded-lg border-2 font-medium text-sm ${
												selectedDate === tomorrow ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
											}`}
										>
											Tomorrow
										</button>
									</div>
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Time</label>
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
											<svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
									<svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
									</svg>
								</div>
								<h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">You're all set!</h2>
								<p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">Demo only — no real booking.</p>
								<div className="bg-gray-100 dark:bg-gray-700/50 rounded-xl p-4 text-left max-w-sm mx-auto mb-6 text-sm">
									<div className="text-gray-500 dark:text-gray-400">Confirmation #</div>
									<div className="font-mono font-bold text-gray-900 dark:text-white">{reservationId}</div>
									<div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
										{court?.name}<br />
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
			</main>

			<footer className="border-t border-gray-200 dark:border-gray-800 py-6 mt-12">
				<div className="container mx-auto px-4 max-w-4xl flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
					<span className="font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Pickleball</span>
					<div className="flex gap-6">
						<a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400">Privacy</a>
						<a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400">Terms</a>
						<a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400">Contact</a>
					</div>
				</div>
			</footer>
		</div>
	);
}
