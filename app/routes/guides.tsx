import { Link } from "react-router";
import type { Route } from "./+types/guides";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Guides & Learn - Pickleball" }];
}

const GUIDE_SECTIONS = [
	{ title: "How to play pickleball", description: "Learn the 9 simple rules for beginners. Serving, scoring, kitchen, and more.", href: "/guides" },
	{ title: "What is my skill rating?", description: "Take a quiz to get rated. Understand 2.0, 3.0, 4.0+ and how to improve.", href: "/guides" },
	{ title: "Best pickleball paddles", description: "Gear guides and reviews: paddles, balls, bags. Find the right paddle for your game.", href: "/guides" },
	{ title: "Find courts & games", description: "Use our court finder and play sessions to find places to play and games to join.", href: "/courts" },
	{ title: "Run a round robin", description: "Organize round robins, leagues, and ladders. Use sessions and tournaments here.", href: "/sessions" },
];

export default function Guides() {
	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-950">
			<nav className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
				<div className="container mx-auto px-4 py-3 max-w-4xl flex items-center justify-between">
					<Link to="/home" className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
						Pickleball
					</Link>
					<div className="flex gap-2">
						<Link to="/home" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
							Home
						</Link>
						<Link to="/courts" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
							Courts
						</Link>
					</div>
				</div>
			</nav>

			<main className="container mx-auto px-4 py-8 max-w-4xl">
				<h1 className="text-3xl font-bold text-gray-900 dark:text-white">Guides & learn</h1>
				<p className="mt-2 text-gray-600 dark:text-gray-400">
					Up your game with how-to guides, skill rating, and gear reviews.
				</p>

				<section className="mt-10">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Learn to play</h2>
					<div className="grid gap-4 sm:grid-cols-2">
						{GUIDE_SECTIONS.map((item) => (
							<Link
								key={item.title}
								to={item.href}
								className="block bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors group"
							>
								<h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
									{item.title}
								</h3>
								<p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
								<span className="mt-2 inline-block text-sm font-medium text-emerald-600 dark:text-emerald-400">
									Go →
								</span>
							</Link>
						))}
					</div>
				</section>

				<p className="mt-10 text-sm text-gray-500 dark:text-gray-400">
					Want to find a lesson? Check the <Link to="/home" className="text-emerald-600 dark:text-emerald-400 hover:underline">Lessons</Link> tab on Home for local coaches.
				</p>
			</main>
		</div>
	);
}
