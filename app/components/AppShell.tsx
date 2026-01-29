import { useState } from "react";
import { Link, useLocation } from "react-router";
import { NavLink } from "~/components/ui";
import { Button } from "~/components/ui/Button";

type User = { id: string; name: string; avatarUrl?: string | null };

const NAV_LINKS = [
	{ to: "/home", label: "Home", icon: HomeIcon },
	{ to: "/friends", label: "Friends", icon: FriendsIcon },
	{ to: "/messages", label: "Messages", icon: MessagesIcon },
	{ to: "/courts", label: "Courts", icon: CourtsIcon },
	{ to: "/sessions", label: "Sessions", icon: SessionsIcon },
	{ to: "/tournaments", label: "Tournaments", icon: TournamentsIcon },
] as const;

const SIDEBAR_LINKS = [
	...NAV_LINKS,
	{ to: "/guides", label: "Guides", icon: GuidesIcon },
	{ to: "/paddles", label: "Paddles", icon: PaddlesIcon },
] as const;

function HomeIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			strokeWidth={2}
			aria-hidden
		>
			<title>Home</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
			/>
		</svg>
	);
}
function FriendsIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			strokeWidth={2}
			aria-hidden
		>
			<title>Friends</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
			/>
		</svg>
	);
}
function MessagesIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			strokeWidth={2}
			aria-hidden
		>
			<title>Messages</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
			/>
		</svg>
	);
}
function CourtsIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			strokeWidth={2}
			aria-hidden
		>
			<title>Courts</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
			/>
		</svg>
	);
}
function SessionsIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			strokeWidth={2}
			aria-hidden
		>
			<title>Sessions</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
			/>
		</svg>
	);
}
function TournamentsIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			strokeWidth={2}
			aria-hidden
		>
			<title>Tournaments</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
			/>
		</svg>
	);
}
function GuidesIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			strokeWidth={2}
			aria-hidden
		>
			<title>Guides</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
			/>
		</svg>
	);
}
function PaddlesIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			strokeWidth={2}
			aria-hidden
		>
			<title>Paddles</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
			/>
			<path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
		</svg>
	);
}

export function AppShell({ children, user }: { children: React.ReactNode; user: User | null }) {
	const location = useLocation();
	const pathname = location.pathname;
	const [drawerOpen, setDrawerOpen] = useState(false);

	const isActive = (to: string) => {
		if (to === "/home") return pathname === "/home" || pathname === "/";
		return pathname === to || pathname.startsWith(`${to}/`);
	};

	return (
		<div className="min-h-screen bg-[#f0f2f5] dark:bg-gray-950 flex flex-col">
			{/* Skip to main content — first focusable (WCAG 2.4.1) */}
			<a href="#main-content" className="skip-link">
				Skip to main content
			</a>

			<header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2 px-2 sm:px-4 shadow-sm">
				<div className="flex items-center gap-2 min-w-0">
					{/* Mobile menu — show on smaller than lg (sidebar hidden) */}
					<button
						type="button"
						onClick={() => setDrawerOpen(true)}
						className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
						aria-label="Open menu"
					>
						<svg
							className="w-6 h-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden
						>
							<title>Open menu</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 6h16M4 12h16M4 18h16"
							/>
						</svg>
					</button>
					<Link
						to="/home"
						className="flex items-center shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 rounded-lg"
					>
						<span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
							Pickleball
						</span>
					</Link>
				</div>

				<nav
					aria-label="Primary"
					className="flex flex-1 items-center min-w-0 max-w-2xl mx-2 justify-center lg:justify-start"
				>
					<div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide shrink-0">
						{NAV_LINKS.map(({ to, label, icon: Icon }) => (
							<NavLink
								key={to}
								to={to}
								label={label}
								icon={<Icon className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />}
								isActive={isActive(to)}
								labelHiddenOnMobile
							/>
						))}
					</div>
				</nav>

				<div className="flex items-center gap-1 sm:gap-2 shrink-0">
					{user ? (
						<>
							<Link
								to={`/profile/${user.id}`}
								className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
								title={user.name}
							>
								{user.avatarUrl ? (
									<img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
								) : (
									<div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
										{user.name.slice(0, 1).toUpperCase()}
									</div>
								)}
								<span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
									{user.name}
								</span>
							</Link>
							<form method="post" action="/auth/logout" className="inline">
								<Button type="submit" variant="ghost" size="sm">
									Log out
								</Button>
							</form>
						</>
					) : (
						<>
							<Link to="/demo">
								<Button variant="primary" size="sm">
									Try demo
								</Button>
							</Link>
							<Link to="/home">
								<Button variant="secondary" size="sm">
									Log in
								</Button>
							</Link>
						</>
					)}
				</div>
			</header>

			{/* Mobile drawer — full sidebar links when sidebar is hidden */}
			{drawerOpen && (
				<>
					<div
						className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
						aria-hidden
						onClick={() => setDrawerOpen(false)}
					/>
					<aside
						className="fixed top-0 left-0 z-50 w-72 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-xl lg:hidden flex flex-col pt-14 animate-fade-in-up"
						aria-label="Navigation menu"
					>
						<button
							type="button"
							onClick={() => setDrawerOpen(false)}
							className="absolute top-4 right-4 p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
							aria-label="Close menu"
						>
							<svg
								className="w-5 h-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden
							>
								<title>Close menu</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
						{user && (
							<Link
								to={`/profile/${user.id}`}
								onClick={() => setDrawerOpen(false)}
								className="flex items-center gap-3 px-4 py-3 mx-2 mt-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
							>
								{user.avatarUrl ? (
									<img src={user.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
								) : (
									<div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
										{user.name.slice(0, 1).toUpperCase()}
									</div>
								)}
								<span className="font-medium text-gray-900 dark:text-white truncate">
									{user.name}
								</span>
							</Link>
						)}
						<nav className="mt-2 overflow-y-auto flex-1 p-2 space-y-0.5" aria-label="Secondary">
							{SIDEBAR_LINKS.map(({ to, label, icon: Icon }) => {
								const active = isActive(to);
								return (
									<Link
										key={to}
										to={to}
										onClick={() => setDrawerOpen(false)}
										className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
											active
												? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
												: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
										}`}
										aria-current={active ? "page" : undefined}
									>
										<Icon className="w-6 h-6 shrink-0" />
										<span className="font-medium">{label}</span>
									</Link>
								);
							})}
						</nav>
					</aside>
				</>
			)}

			{/* Desktop sidebar */}
			<aside className="hidden lg:flex flex-col fixed left-0 top-14 w-60 h-[calc(100vh-3.5rem)] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto pt-4 pb-6">
				{user && (
					<Link
						to={`/profile/${user.id}`}
						className="flex items-center gap-3 px-3 py-2 mx-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
					>
						{user.avatarUrl ? (
							<img src={user.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
						) : (
							<div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
								{user.name.slice(0, 1).toUpperCase()}
							</div>
						)}
						<span className="font-medium text-gray-900 dark:text-white truncate">{user.name}</span>
					</Link>
				)}
				<nav className="mt-2 space-y-0.5" aria-label="Secondary">
					{SIDEBAR_LINKS.map(({ to, label, icon: Icon }) => {
						const active = isActive(to);
						return (
							<Link
								key={to}
								to={to}
								className={`flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
									active
										? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
										: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
								}`}
								aria-current={active ? "page" : undefined}
							>
								<Icon className="w-6 h-6 shrink-0" />
								<span className="font-medium">{label}</span>
							</Link>
						);
					})}
				</nav>
			</aside>

			<main id="main-content" tabIndex={-1} className="flex-1 pt-14 lg:pl-60 min-h-screen">
				<div className="p-4 sm:p-6 flex flex-col min-h-[calc(100vh-3.5rem)]">
					{children}
					{/* Global footer — single source of truth */}
					<footer className="mt-auto border-t border-gray-200 dark:border-gray-800 py-6">
						<div className="mx-auto max-w-4xl flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
							<span className="font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
								Pickleball
							</span>
							<div className="flex gap-6">
								<a
									href="/#privacy"
									className="hover:text-emerald-600 dark:hover:text-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded"
								>
									Privacy
								</a>
								<a
									href="/#terms"
									className="hover:text-emerald-600 dark:hover:text-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded"
								>
									Terms
								</a>
								<a
									href="/#contact"
									className="hover:text-emerald-600 dark:hover:text-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded"
								>
									Contact
								</a>
							</div>
						</div>
					</footer>
				</div>
			</main>
		</div>
	);
}
