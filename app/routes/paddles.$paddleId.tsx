import { Link, useLoaderData } from "react-router";
import { getPaddle, getSessionToken, getSessionUser } from "~/lib/db.server";
import type { Route } from "./+types/paddles.$paddleId";

export function meta({ data }: Route.MetaArgs) {
	if (!data?.paddle) return [{ title: "Paddle - Pickleball" }];
	return [{ title: `${data.paddle.brand} ${data.paddle.model} - Pickleball` }];
}

export async function loader({ context, params, request }: Route.LoaderArgs) {
	const db = context.cloudflare.env.DB;
	const paddleId = params.paddleId;
	if (!db || !paddleId) return { paddle: null, user: null };
	const token = getSessionToken(request.headers.get("Cookie") ?? null);
	const user = await getSessionUser(db, token);
	const paddle = await getPaddle(db, paddleId);
	return { paddle, user };
}

function SpecRow({ label, value }: { label: string; value: string | number | null | undefined }) {
	if (value == null || value === "") return null;
	return (
		<tr className="border-b border-gray-200 dark:border-gray-700 last:border-0">
			<td className="py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">{label}</td>
			<td className="py-2 text-gray-900 dark:text-white">{value}</td>
		</tr>
	);
}

export default function PaddleDetail() {
	const { paddle } = useLoaderData<typeof loader>();

	if (!paddle) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
				<div className="text-center">
					<p className="text-gray-600 dark:text-gray-400">Paddle not found.</p>
					<Link
						to="/paddles"
						className="mt-4 inline-block text-emerald-600 dark:text-emerald-400 hover:underline"
					>
						Paddle database
					</Link>
				</div>
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
							to="/paddles"
							className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
						>
							Paddles
						</Link>
						<Link
							to="/guides"
							className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
						>
							Guides
						</Link>
					</div>
				</div>
			</nav>

			<main className="container mx-auto px-4 py-8 max-w-4xl">
				<Link
					to="/paddles"
					className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
				>
					← Paddle database
				</Link>
				<h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
					{paddle.brand} {paddle.model}
				</h1>
				{paddle.description && (
					<p className="mt-2 text-gray-600 dark:text-gray-400">{paddle.description}</p>
				)}

				<table className="mt-6 w-full max-w-md">
					<tbody>
						<SpecRow label="Brand" value={paddle.brand} />
						<SpecRow label="Model" value={paddle.model} />
						<SpecRow label="Core" value={paddle.coreType} />
						<SpecRow label="Face" value={paddle.faceMaterial} />
						<SpecRow
							label="Weight"
							value={paddle.weightOz != null ? `${paddle.weightOz} oz` : null}
						/>
						<SpecRow label="Swing weight" value={paddle.swingWeight} />
						<SpecRow label="Shape" value={paddle.shape} />
						<SpecRow
							label="Length"
							value={paddle.lengthIn != null ? `${paddle.lengthIn}"` : null}
						/>
						<SpecRow label="Width" value={paddle.widthIn != null ? `${paddle.widthIn}"` : null} />
						<SpecRow
							label="Thickness"
							value={paddle.thicknessIn != null ? `${paddle.thicknessIn}"` : null}
						/>
						<SpecRow
							label="Grip length"
							value={paddle.gripLengthIn != null ? `${paddle.gripLengthIn}"` : null}
						/>
						<SpecRow label="Price" value={paddle.priceUsd != null ? `$${paddle.priceUsd}` : null} />
					</tbody>
				</table>
			</main>
		</div>
	);
}
