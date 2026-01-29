import { Link, useLocation } from "react-router";

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

	const isActive = (to: string) => {
		if (to === "/home") return pathname === "/home" || pathname === "/";
		return pathname === to || pathname.startsWith(`${to}/`);
	};

	return (
		<div className="min-h-screen bg-[#f0f2f5] dark:bg-gray-950 flex">
			{/* Top bar — Facebook-style */}
			<header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2 px-2 sm:px-4 shadow-sm">
				<Link to="/home" className="flex items-center shrink-0">
					<span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
						Pickleball
					</span>
				</Link>
				{/* Search + main nav — center */}
				<div className="flex flex-1 items-center min-w-0 max-w-2xl mx-2">
					<div className="hidden md:flex flex-1 min-w-0 max-w-xs mr-2">
						<div className="w-full flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400">
							<svg
								className="w-4 h-4 mr-2 shrink-0"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden
							>
								<title>Search</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								/>
							</svg>
							<span>Search</span>
						</div>
					</div>
					<nav
						className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide shrink-0"
						aria-label="Primary"
					>
						<ul className="flex items-center gap-0.5 sm:gap-1 list-none m-0 p-0">
							{NAV_LINKS.map(({ to, label, icon: Icon }) => {
								const active = isActive(to);
								return (
									<li key={to} className="flex shrink-0">
										<Link
											to={to}
											className={`flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg min-w-[48px] sm:min-w-[72px] transition-colors ${
												active
													? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
													: "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
											}`}
											title={label}
											aria-current={active ? "page" : undefined}
										>
											<Icon className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" aria-hidden />
											<span className="hidden lg:inline text-sm font-medium truncate">{label}</span>
										</Link>
									</li>
								);
							})}
						</ul>
					</nav>
				</div>
				{/* Right: user menu */}
				<div className="flex items-center gap-1 sm:gap-2 shrink-0">
					{user ? (
						<>
							<Link
								to={`/profile/${user.id}`}
								className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
								<button
									type="submit"
									className="px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
									aria-label="Log out"
								>
									Log out
								</button>
							</form>
						</>
					) : (
						<>
							<Link
								to="/demo"
								className="px-2 sm:px-3 py-1.5 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-500"
							>
								Try demo
							</Link>
							<Link
								to="/home"
								className="px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
							>
								Log in
							</Link>
						</>
					)}
				</div>
			</header>

			{/* Left sidebar — Facebook-style shortcuts (desktop) */}
			<aside className="hidden lg:flex flex-col fixed left-0 top-14 w-60 h-[calc(100vh-3.5rem)] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto pt-4 pb-6">
				{user ? (
					<Link
						to={`/profile/${user.id}`}
						className="flex items-center gap-3 px-3 py-2 mx-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
				) : null}
				<nav className="mt-2 space-y-0.5" aria-label="App menu">
					<ul className="space-y-0.5 list-none m-0 p-0">
						{SIDEBAR_LINKS.map(({ to, label, icon: Icon }) => {
							const active = isActive(to);
							return (
								<li key={to}>
									<Link
										to={to}
										className={`flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg transition-colors ${
											active
												? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
												: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
										}`}
										aria-current={active ? "page" : undefined}
									>
										<Icon className="w-6 h-6 shrink-0" aria-hidden />
										<span className="font-medium">{label}</span>
									</Link>
								</li>
							);
						})}
					</ul>
				</nav>
			</aside>

			{/* Main content — skip target for accessibility */}
			<main id="main-content" className="flex-1 pt-14 lg:pl-60 min-h-screen" tabIndex={-1}>
				<div className="p-4 sm:p-6">{children}</div>
			</main>
		</div>
	);
}
