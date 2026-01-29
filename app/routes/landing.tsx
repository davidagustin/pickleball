import { Link } from "react-router";
import type { Route } from "./+types/landing";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Pickleball - Connect, Find Courts, Reserve" },
		{ name: "description", content: "The pickleball community. Chat, find courts, and reserve spots." },
	];
}

export default function Landing() {
	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
			{/* Hero gradient background */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-400/20 dark:bg-emerald-500/10 blur-3xl" />
				<div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-teal-400/15 dark:bg-teal-500/10 blur-3xl" />
			</div>

			<header className="relative z-10 border-b border-gray-200/50 dark:border-gray-800/50">
				<div className="container mx-auto px-4 py-4 max-w-5xl flex items-center justify-between">
					<span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
						Pickleball
					</span>
					<Link
						to="/home"
						className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/25"
					>
						Login
					</Link>
				</div>
			</header>

			<main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24 text-center">
				<h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight max-w-3xl leading-tight">
					Connect. Find courts.{" "}
					<span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
						Reserve.
					</span>
				</h1>
				<p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl">
					Join the pickleball community. Chat with players, discover courts near you, and book your next game in one place.
				</p>
				<div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
					<Link
						to="/demo"
						className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-90 transition-opacity shadow-xl shadow-emerald-500/30"
					>
						Try demo
					</Link>
					<Link
						to="/home"
						className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-semibold border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
					>
						Go to app
					</Link>
				</div>
				<p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
					Try demo logs you in as Alex so you can see the feed, courts, tournaments, lessons, and more.
				</p>

				{/* Feature pills */}
				<div className="mt-16 flex flex-wrap justify-center gap-3">
					<span className="px-4 py-2 rounded-full bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm">
						Community feed
					</span>
					<span className="px-4 py-2 rounded-full bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm">
						Find courts
					</span>
					<span className="px-4 py-2 rounded-full bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm">
						Reserve spots
					</span>
					<span className="px-4 py-2 rounded-full bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm">
						Tournaments
					</span>
					<span className="px-4 py-2 rounded-full bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm">
						Lessons & coaching
					</span>
				</div>
			</main>

			<footer className="relative z-10 border-t border-gray-200/50 dark:border-gray-800/50 py-6">
				<div className="container mx-auto px-4 max-w-5xl flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
					<span className="font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
						Pickleball
					</span>
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
