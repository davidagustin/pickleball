import { useState } from "react";
import { Link, redirect, useActionData, useLoaderData, useSearchParams } from "react-router";
import { AppShell } from "~/components/AppShell";
import {
	addSessionNote,
	createPlaySession,
	getCourts,
	getPlaySessionsForWeek,
	getRegions,
	getSessionNotes,
	getSessionSignups,
	getSessionToken,
	getSessionUser,
	getSessionWaitlist,
	joinPlaySession,
	joinSessionWaitlist,
	leavePlaySession,
	leaveSessionWaitlist,
	type PlaySession,
	type SessionNote,
	type SessionSignup,
} from "~/lib/db.server";
import type { Route } from "./+types/sessions";

export function meta(_args: Route.MetaArgs) {
	return [{ title: "Play sessions - Pickleball" }];
}

function getWeekRange(weekOffset: number): { start: string; end: string } {
	const now = new Date();
	const start = new Date(now);
	start.setDate(now.getDate() - now.getDay() + weekOffset * 7);
	const end = new Date(start);
	end.setDate(start.getDate() + 6);
	return {
		start: start.toISOString().slice(0, 10),
		end: end.toISOString().slice(0, 10),
	};
}

export async function loader({ context, request }: Route.LoaderArgs) {
	const db = context.cloudflare.env.DB;
	const url = new URL(request.url);
	const weekOffset = Number(url.searchParams.get("week") ?? 0);
	const { start: startDate, end: endDate } = getWeekRange(weekOffset);

	if (!db) {
		return {
			regions: [],
			courts: [],
			sessions: [],
			user: null,
			startDate,
			endDate,
			signups: [],
			notes: [],
			waitlist: [],
			selectedId: null,
		};
	}
	const token = getSessionToken(request.headers.get("Cookie") ?? null);
	const user = await getSessionUser(db, token);
	const [regions, courts, sessions] = await Promise.all([
		getRegions(db, 100),
		getCourts(db, { limit: 100 }),
		getPlaySessionsForWeek(db, startDate, endDate, user?.id ?? null),
	]);
	const selectedId = url.searchParams.get("session") ?? null;
	let signups: SessionSignup[] = [];
	let notes: SessionNote[] = [];
	let waitlist: SessionSignup[] = [];
	if (selectedId) {
		[signups, notes, waitlist] = await Promise.all([
			getSessionSignups(db, selectedId),
			getSessionNotes(db, selectedId),
			getSessionWaitlist(db, selectedId),
		]);
	}
	return {
		regions,
		courts,
		sessions,
		user,
		startDate,
		endDate,
		signups,
		notes,
		waitlist,
		selectedId,
	};
}

export async function action({ context, request }: Route.ActionArgs) {
	const db = context.cloudflare.env.DB;
	if (!db) return { error: "Database not configured" };
	const formData = await request.formData();
	const intent = formData.get("intent");
	const token = getSessionToken(request.headers.get("Cookie"));
	const user = await getSessionUser(db, token);
	if (!user && intent !== "addNote") return redirect("/home?login=1");

	if (intent === "create") {
		if (!user) return redirect("/home?login=1");
		const venue = (formData.get("venue") as string)?.trim();
		const sessionDate = formData.get("sessionDate") as string;
		const sessionTime = formData.get("sessionTime") as string;
		if (!venue || !sessionDate || !sessionTime) return { error: "Venue, date, and time required" };
		await createPlaySession(db, user.id, {
			venue,
			sessionDate,
			sessionTime,
			regionId: (formData.get("regionId") as string) || undefined,
			courtId: (formData.get("courtId") as string) || undefined,
			skillLevel: (formData.get("skillLevel") as string)?.trim() || undefined,
			formatType: (formData.get("formatType") as string) || undefined,
			eventName: (formData.get("eventName") as string)?.trim() || undefined,
			playerMin: Number(formData.get("playerMin")) || 4,
			playerMax: formData.get("playerMax") ? Number(formData.get("playerMax")) : undefined,
			isRecurring: formData.get("isRecurring") === "on",
			recurrenceDay: (formData.get("recurrenceDay") as string) || undefined,
		});
		return redirect("/sessions");
	}

	if (intent === "join" || intent === "leave") {
		if (!user) return redirect("/home?login=1");
		const sessionId = formData.get("sessionId") as string;
		if (!sessionId) return { error: "Session required" };
		if (intent === "join") await joinPlaySession(db, sessionId, user.id);
		else await leavePlaySession(db, sessionId, user.id);
		return redirect(request.url);
	}
	if (intent === "joinWaitlist" || intent === "leaveWaitlist") {
		if (!user) return redirect("/home?login=1");
		const sessionId = formData.get("sessionId") as string;
		if (!sessionId) return { error: "Session required" };
		if (intent === "joinWaitlist") await joinSessionWaitlist(db, sessionId, user.id);
		else await leaveSessionWaitlist(db, sessionId, user.id);
		return redirect(request.url);
	}

	if (intent === "addNote") {
		if (!user) return redirect("/home?login=1");
		const sessionId = formData.get("sessionId") as string;
		const content = (formData.get("content") as string)?.trim();
		if (!sessionId || !content) return { error: "Session and note required" };
		await addSessionNote(db, sessionId, user.id, content);
		return redirect(request.url);
	}

	return { error: "Unknown action" };
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Sessions() {
	const {
		regions,
		courts,
		sessions,
		user,
		startDate,
		endDate,
		signups,
		notes,
		waitlist,
		selectedId,
	} = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();
	const [_searchParams, setSearchParams] = useSearchParams();
	const [view, setView] = useState<"calendar" | "list">("calendar");
	const [showAddForm, setShowAddForm] = useState(false);

	const selectedSession = selectedId ? sessions.find((s) => s.id === selectedId) : null;
	const weekStart = new Date(startDate);
	const weekDays = Array.from({ length: 7 }, (_, i) => {
		const d = new Date(weekStart);
		d.setDate(weekStart.getDate() + i);
		return d.toISOString().slice(0, 10);
	});

	const sessionsByDay = weekDays.reduce<Record<string, PlaySession[]>>((acc, day) => {
		acc[day] = sessions.filter((s) => s.sessionDate === day);
		return acc;
	}, {});

	return (
		<AppShell user={user}>
			<div className="mx-auto max-w-4xl">
				<div className="flex flex-wrap items-center justify-between gap-4 mb-6">
					<div>
						<h1 className="text-2xl font-bold text-gray-900 dark:text-white">Play sessions</h1>
						<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
							Arrange play with others — not court reservation. Add your name so you always have
							enough players.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => setView(view === "calendar" ? "list" : "calendar")}
							className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
						>
							{view === "calendar" ? "List view" : "Calendar view"}
						</button>
						{user && (
							<button
								type="button"
								onClick={() => setShowAddForm(true)}
								className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500"
							>
								Add session
							</button>
						)}
					</div>
				</div>

				{actionData?.error && (
					<div className="mb-4 px-4 py-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
						{actionData.error}
					</div>
				)}

				{!user && (
					<div className="mb-4 px-4 py-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-sm">
						<Link to="/demo" className="font-medium underline">
							Try demo
						</Link>{" "}
						or log in to add a session or add your name to one.
					</div>
				)}

				{/* Week nav */}
				<div className="flex items-center gap-2 mb-4">
					<button
						type="button"
						onClick={() =>
							setSearchParams((p) => ({ ...p, week: String(Number(p.get("week") ?? 0) - 1) }))
						}
						className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
					>
						← Previous
					</button>
					<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
						{new Date(startDate).toLocaleDateString("en-US", {
							month: "short",
							day: "numeric",
							year: "numeric",
						})}{" "}
						–{" "}
						{new Date(endDate).toLocaleDateString("en-US", {
							month: "short",
							day: "numeric",
							year: "numeric",
						})}
					</span>
					<button
						type="button"
						onClick={() =>
							setSearchParams((p) => ({ ...p, week: String(Number(p.get("week") ?? 0) + 1) }))
						}
						className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
					>
						Next →
					</button>
				</div>

				{view === "calendar" && (
					<div className="grid grid-cols-7 gap-2 mb-6">
						{weekDays.map((day) => (
							<div
								key={day}
								className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-2 min-h-[120px]"
							>
								<div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
									{DAY_LABELS[new Date(day).getDay()]} {day.slice(5)}
								</div>
								<div className="space-y-1.5">
									{(sessionsByDay[day] ?? []).map((s) => (
										<button
											key={s.id}
											type="button"
											onClick={() => setSearchParams((p) => ({ ...p, session: s.id }))}
											className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium truncate block border transition-colors ${
												selectedId === s.id
													? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
													: "border-gray-200 dark:border-gray-600 hover:border-emerald-400 bg-white dark:bg-gray-800"
											}`}
											style={
												s.regionColor
													? { borderLeftColor: s.regionColor, borderLeftWidth: "3px" }
													: undefined
											}
											title={`${s.venue} · ${s.sessionTime} · ${s.signupCount}/${s.playerMin}${s.playerMax ? `–${s.playerMax}` : "+"} · ${s.creatorName}`}
										>
											<span className="font-medium">{s.sessionTime}</span>
											<span className="block truncate text-gray-600 dark:text-gray-400">
												{s.venue}
											</span>
											{s.isRecurring && s.recurrenceDay && (
												<span className="block text-xs text-gray-500 dark:text-gray-500">
													Every {s.recurrenceDay}
												</span>
											)}
											<span className="text-gray-500 dark:text-gray-500">
												{s.signupCount}/{s.playerMin}
												{s.gameOn && " ✓"}
											</span>
										</button>
									))}
								</div>
							</div>
						))}
					</div>
				)}

				{view === "list" && (
					<ul className="space-y-3 mb-6">
						{sessions.length === 0 ? (
							<li className="text-gray-500 dark:text-gray-400 py-8 text-center">
								No sessions this week. Add one above.
							</li>
						) : (
							sessions.map((s) => (
								<li key={s.id}>
									<button
										type="button"
										onClick={() => setSearchParams((p) => ({ ...p, session: s.id }))}
										className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
											selectedId === s.id
												? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-500"
												: "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-emerald-300"
										}`}
									>
										<div className="flex items-center justify-between gap-2">
											<div>
												<span className="font-semibold text-gray-900 dark:text-white">
													{s.venue}
												</span>
												<span className="text-gray-500 dark:text-gray-400 ml-2">
													{s.sessionDate} · {s.sessionTime}
												</span>
											</div>
											<span className="text-sm text-gray-600 dark:text-gray-400">
												{s.signupCount}/{s.playerMin} players
												{s.gameOn && " · Game on!"}
											</span>
										</div>
										{s.eventName && (
											<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{s.eventName}</p>
										)}
										{s.skillLevel && (
											<p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
												Skill: {s.skillLevel}
											</p>
										)}
										{s.isRecurring && s.recurrenceDay && (
											<p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
												Every {s.recurrenceDay}
											</p>
										)}
									</button>
								</li>
							))
						)}
					</ul>
				)}

				{/* Session detail panel */}
				{selectedSession && (
					<div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
						<div className="flex items-start justify-between gap-4 mb-4">
							<div>
								<h2 className="text-xl font-bold text-gray-900 dark:text-white">
									{selectedSession.venue}
								</h2>
								<p className="text-gray-500 dark:text-gray-400">
									{selectedSession.isRecurring && selectedSession.recurrenceDay
										? `Every ${selectedSession.recurrenceDay} · ${selectedSession.sessionTime}`
										: `${selectedSession.sessionDate} · ${selectedSession.sessionTime}`}
									{selectedSession.regionName && ` · ${selectedSession.regionName}`}
								</p>
								{selectedSession.eventName && (
									<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
										{selectedSession.eventName}
									</p>
								)}
								{selectedSession.skillLevel && (
									<p className="text-xs text-gray-500 dark:text-gray-500">
										Skill: {selectedSession.skillLevel}
									</p>
								)}
								<p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
									Created by {selectedSession.creatorName} · {selectedSession.signupCount}/
									{selectedSession.playerMin}
									{selectedSession.playerMax ? `–${selectedSession.playerMax}` : "+"} players
									{selectedSession.gameOn && (
										<span className="ml-2 font-medium text-emerald-600 dark:text-emerald-400">
											Game on!
										</span>
									)}
								</p>
							</div>
							<button
								type="button"
								onClick={() =>
									setSearchParams((p) => {
										const next = new URLSearchParams(p);
										next.delete("session");
										return next;
									})
								}
								className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
							>
								Close
							</button>
						</div>

						<div className="border-t border-gray-200 dark:border-gray-700 pt-4">
							<h3 className="font-semibold text-gray-900 dark:text-white mb-2">
								Players signed up
							</h3>
							{signups.length === 0 ? (
								<p className="text-sm text-gray-500 dark:text-gray-400">
									No one yet. Add your name!
								</p>
							) : (
								<ul className="flex flex-wrap gap-2 mb-4">
									{signups.map((s) => (
										<li
											key={s.userId}
											className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-medium text-gray-800 dark:text-gray-200"
										>
											{s.userName}
										</li>
									))}
								</ul>
							)}
							{user && (
								<div className="mb-4">
									{selectedSession.mySignup ? (
										<form method="post">
											<input type="hidden" name="intent" value="leave" />
											<input type="hidden" name="sessionId" value={selectedSession.id} />
											<button
												type="submit"
												className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
											>
												Remove my name
											</button>
										</form>
									) : (
										<form method="post">
											<input type="hidden" name="intent" value="join" />
											<input type="hidden" name="sessionId" value={selectedSession.id} />
											<button
												type="submit"
												className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500"
											>
												Add my name
											</button>
										</form>
									)}
								</div>
							)}
							{selectedSession.isFull && user && !selectedSession.mySignup && (
								<div className="mt-4">
									<h3 className="font-semibold text-gray-900 dark:text-white mb-2">Waitlist</h3>
									{waitlist.length > 0 && (
										<ul className="flex flex-wrap gap-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
											{waitlist.map((w) => (
												<li key={w.userId}>{w.userName}</li>
											))}
										</ul>
									)}
									{selectedSession.myWaitlist ? (
										<form method="post">
											<input type="hidden" name="intent" value="leaveWaitlist" />
											<input type="hidden" name="sessionId" value={selectedSession.id} />
											<button
												type="submit"
												className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
											>
												Leave waitlist
											</button>
										</form>
									) : (
										<form method="post">
											<input type="hidden" name="intent" value="joinWaitlist" />
											<input type="hidden" name="sessionId" value={selectedSession.id} />
											<button
												type="submit"
												className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-500"
											>
												Join waitlist
											</button>
										</form>
									)}
								</div>
							)}
						</div>

						<div className="border-t border-gray-200 dark:border-gray-700 pt-4">
							<h3 className="font-semibold text-gray-900 dark:text-white mb-2">Notes</h3>
							<p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
								e.g. &quot;I might be a little late&quot; or &quot;Does anyone have an extra
								paddle?&quot;
							</p>
							{notes.length > 0 && (
								<ul className="space-y-2 mb-4">
									{notes.map((n) => (
										<li key={n.id} className="text-sm">
											<span className="font-medium text-gray-800 dark:text-gray-200">
												{n.userName}:
											</span>{" "}
											<span className="text-gray-700 dark:text-gray-300">{n.content}</span>
										</li>
									))}
								</ul>
							)}
							{user && (
								<form method="post" className="flex gap-2">
									<input type="hidden" name="intent" value="addNote" />
									<input type="hidden" name="sessionId" value={selectedSession.id} />
									<input
										type="text"
										name="content"
										placeholder="Add a note..."
										className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
									/>
									<button
										type="submit"
										className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
									>
										Post
									</button>
								</form>
							)}
						</div>
					</div>
				)}

				{/* Add session modal/form */}
				{showAddForm && user && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
						<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
							<h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add session</h2>
							<form method="post" className="space-y-4">
								<input type="hidden" name="intent" value="create" />
								<div>
									<label
										htmlFor="session-venue"
										className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
									>
										Venue / location *
									</label>
									<input
										id="session-venue"
										type="text"
										name="venue"
										required
										placeholder="e.g. Downtown Community Center"
										className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label
											htmlFor="session-date"
											className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
										>
											Date *
										</label>
										<input
											id="session-date"
											type="date"
											name="sessionDate"
											required
											className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
										/>
									</div>
									<div>
										<label
											htmlFor="session-time"
											className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
										>
											Time *
										</label>
										<input
											id="session-time"
											type="text"
											name="sessionTime"
											required
											placeholder="e.g. 10:00 AM"
											className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
										/>
									</div>
								</div>
								<div>
									<label
										htmlFor="session-regionId"
										className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
									>
										Region / area
									</label>
									<select
										id="session-regionId"
										name="regionId"
										className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
									>
										<option value="">—</option>
										{regions.map((r) => (
											<option key={r.id} value={r.id}>
												{r.country} · {r.name}
											</option>
										))}
									</select>
								</div>
								<div>
									<label
										htmlFor="session-skillLevel"
										className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
									>
										Skill level
									</label>
									<input
										id="session-skillLevel"
										type="text"
										name="skillLevel"
										placeholder="e.g. 2.5-3.5, All levels"
										className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
									/>
								</div>
								<div>
									<label
										htmlFor="session-formatType"
										className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
									>
										Format
									</label>
									<select
										id="session-formatType"
										name="formatType"
										className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
									>
										<option value="">—</option>
										<option value="doubles">Doubles</option>
										<option value="singles">Singles</option>
										<option value="mixed">Mixed</option>
									</select>
								</div>
								<div>
									<label
										htmlFor="session-eventName"
										className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
									>
										Event name
									</label>
									<input
										id="session-eventName"
										type="text"
										name="eventName"
										placeholder="e.g. Saturday round-robin"
										className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label
											htmlFor="session-playerMin"
											className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
										>
											Min players
										</label>
										<input
											id="session-playerMin"
											type="number"
											name="playerMin"
											min={1}
											defaultValue={4}
											className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
										/>
									</div>
									<div>
										<label
											htmlFor="session-playerMax"
											className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
										>
											Max players
										</label>
										<input
											id="session-playerMax"
											type="number"
											name="playerMax"
											min={1}
											placeholder="Optional"
											className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
										/>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<input
										type="checkbox"
										name="isRecurring"
										id="isRecurring"
										className="rounded border-gray-300 dark:border-gray-600"
									/>
									<label
										htmlFor="isRecurring"
										className="text-sm font-medium text-gray-700 dark:text-gray-300"
									>
										Repeat weekly
									</label>
								</div>
								<div>
									<label
										htmlFor="session-recurrenceDay"
										className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
									>
										Day of week (if recurring)
									</label>
									<select
										id="session-recurrenceDay"
										name="recurrenceDay"
										className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
									>
										<option value="">—</option>
										{[
											"Monday",
											"Tuesday",
											"Wednesday",
											"Thursday",
											"Friday",
											"Saturday",
											"Sunday",
										].map((d) => (
											<option key={d} value={d}>
												{d}
											</option>
										))}
									</select>
								</div>
								<div>
									<label
										htmlFor="session-courtId"
										className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
									>
										Court (optional)
									</label>
									<select
										id="session-courtId"
										name="courtId"
										className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
									>
										<option value="">—</option>
										{courts.map((c) => (
											<option key={c.id} value={c.id}>
												{c.name}
											</option>
										))}
									</select>
								</div>
								<div className="flex gap-2 pt-2">
									<button
										type="submit"
										className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500"
									>
										Create session
									</button>
									<button
										type="button"
										onClick={() => setShowAddForm(false)}
										className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										Cancel
									</button>
								</div>
							</form>
						</div>
					</div>
				)}
			</div>
		</AppShell>
	);
}
