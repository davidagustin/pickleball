import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Pickleball - The Fastest Growing Sport in America" },
		{ name: "description", content: "Join the pickleball revolution. Find courts, connect with players, and elevate your game." },
	];
}

export function loader({ context }: Route.LoaderArgs) {
	return {};
}

export default function Home() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
			{/* Navigation */}
			<nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-800/50">
				<div className="container mx-auto px-6 py-4">
					<div className="flex items-center justify-between">
						<div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
							Pickleball
						</div>
						<div className="hidden md:flex items-center gap-8">
							<a href="#courts" className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Find Courts</a>
							<a href="#features" className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Features</a>
							<a href="#about" className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">About</a>
							<button className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all">
								Get Started
							</button>
						</div>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<section className="pt-32 pb-20 px-6">
				<div className="container mx-auto max-w-6xl">
					<div className="text-center mb-16">
						<div className="inline-block mb-6 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-700 dark:text-emerald-400 text-sm font-semibold">
							America's Fastest Growing Sport
						</div>
						<h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
							<span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent animate-gradient">
								Serve. Rally.
							</span>
							<br />
							<span className="text-gray-900 dark:text-white">Win Together.</span>
						</h1>
						<p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
							Connect with players, discover courts, and join the community that's taking the world by storm.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
							<button className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-lg font-bold rounded-full hover:shadow-2xl hover:scale-105 transition-all">
								Find Courts Near You
							</button>
							<button className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg font-semibold rounded-full border-2 border-gray-300 dark:border-gray-700 hover:border-emerald-600 dark:hover:border-emerald-500 transition-all">
								Watch How It Works
							</button>
						</div>
					</div>

					{/* Hero Visual */}
					<div className="relative mt-20">
						<div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-gray-800 dark:to-gray-900 border-4 border-white dark:border-gray-700">
							<div className="absolute inset-0 flex items-center justify-center">
								<div className="text-center">
									<div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl">
										<svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
										</svg>
									</div>
									<div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
										{[...Array(3)].map((_, i) => (
											<div key={i} className="h-24 bg-white/80 dark:bg-gray-800/80 rounded-xl border-2 border-emerald-200 dark:border-emerald-800"></div>
										))}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Stats Section */}
			<section className="py-16 px-6 bg-white/50 dark:bg-gray-900/50">
				<div className="container mx-auto max-w-6xl">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-8">
						{[
							{ number: "8.9M", label: "Active Players" },
							{ number: "50K+", label: "Courts Nationwide" },
							{ number: "159%", label: "Growth Rate" },
							{ number: "4.8★", label: "Average Rating" },
						].map((stat, i) => (
							<div key={i} className="text-center">
								<div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
									{stat.number}
								</div>
								<div className="text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id="features" className="py-24 px-6">
				<div className="container mx-auto max-w-6xl">
					<div className="text-center mb-16">
						<h2 className="text-5xl md:text-6xl font-black mb-4 text-gray-900 dark:text-white">
							Everything You Need
						</h2>
						<p className="text-xl text-gray-600 dark:text-gray-300">
							Your complete pickleball companion
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8">
						{[
							{
								icon: (
									<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
								),
								title: "Find Courts",
								description: "Discover courts near you with real-time availability and ratings from the community.",
							},
							{
								icon: (
									<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
									</svg>
								),
								title: "Connect Players",
								description: "Join matches, find partners, and build your pickleball network.",
							},
							{
								icon: (
									<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
									</svg>
								),
								title: "Track Progress",
								description: "Monitor your stats, improve your game, and climb the rankings.",
							},
						].map((feature, i) => (
							<div
								key={i}
								className="p-8 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all hover:shadow-xl group"
							>
								<div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
									{feature.icon}
								</div>
								<h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
									{feature.title}
								</h3>
								<p className="text-gray-600 dark:text-gray-300 leading-relaxed">
									{feature.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-24 px-6">
				<div className="container mx-auto max-w-4xl">
					<div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-600 p-12 md:p-16 text-center text-white shadow-2xl">
						<div className="absolute inset-0 bg-black/10"></div>
						<div className="relative z-10">
							<h2 className="text-4xl md:text-6xl font-black mb-6">
								Ready to Play?
							</h2>
							<p className="text-xl md:text-2xl mb-10 opacity-90">
								Join thousands of players and start your pickleball journey today.
							</p>
							<button className="px-10 py-5 bg-white text-emerald-600 text-lg font-bold rounded-full hover:shadow-2xl hover:scale-105 transition-all">
								Get Started Free
							</button>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="py-12 px-6 border-t border-gray-200 dark:border-gray-800">
				<div className="container mx-auto max-w-6xl">
					<div className="flex flex-col md:flex-row justify-between items-center gap-6">
						<div className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
							Pickleball
						</div>
						<div className="flex gap-6 text-gray-600 dark:text-gray-400">
							<a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Privacy</a>
							<a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Terms</a>
							<a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Contact</a>
						</div>
					</div>
					<div className="mt-8 text-center text-gray-500 dark:text-gray-500 text-sm">
						© 2026 Pickleball. All rights reserved.
					</div>
				</div>
			</footer>
		</div>
	);
}
