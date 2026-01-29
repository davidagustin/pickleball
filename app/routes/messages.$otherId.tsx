import { Link, useParams } from "react-router";
import type { Route } from "./+types/messages.$otherId";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Conversation - Pickleball" }];
}

export default function MessagesOther() {
	const { otherId } = useParams();
	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-950">
			<nav className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
				<div className="container mx-auto px-4 py-3 max-w-4xl flex items-center justify-between">
					<Link to="/home" className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
						Pickleball
					</Link>
					<Link to="/messages" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
						Messages
					</Link>
				</div>
			</nav>
			<main className="container mx-auto px-4 py-8 max-w-4xl">
				<h1 className="text-2xl font-bold text-gray-900 dark:text-white">Conversation</h1>
				<p className="mt-2 text-gray-600 dark:text-gray-400">Chat with user {otherId}.</p>
				<Link to="/messages" className="mt-4 inline-block text-emerald-600 dark:text-emerald-400 hover:underline">
					← Back to Messages
				</Link>
			</main>
		</div>
	);
}
