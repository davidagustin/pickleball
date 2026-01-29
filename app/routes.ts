import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/landing.tsx"),
	route("demo", "routes/demo.tsx"),
	route("home", "routes/home.tsx"),
	route("tournaments", "routes/tournaments.tsx"),
	route("tournaments/:tournamentId", "routes/tournaments.$tournamentId.tsx"),
	route("join/:code", "routes/join.$code.tsx"),
	route("profile/:userId", "routes/profile.$userId.tsx"),
	route("friends", "routes/friends.tsx"),
	route("messages", "routes/messages.tsx"),
	route("messages/:otherId", "routes/messages.$otherId.tsx"),
	route("auth/oauth/google", "routes/auth.oauth.google.tsx"),
	route("auth/oauth/google/callback", "routes/auth.oauth.google.callback.tsx"),
	route("auth/oauth/github", "routes/auth.oauth.github.tsx"),
	route("auth/oauth/github/callback", "routes/auth.oauth.github.callback.tsx"),
	route("auth/logout", "routes/auth.logout.tsx"),
] satisfies RouteConfig;
