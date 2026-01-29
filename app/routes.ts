import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/landing.tsx"),
	route("home", "routes/home.tsx"),
	route("auth/oauth/google", "routes/auth.oauth.google.tsx"),
	route("auth/oauth/google/callback", "routes/auth.oauth.google.callback.tsx"),
	route("auth/oauth/github", "routes/auth.oauth.github.tsx"),
	route("auth/oauth/github/callback", "routes/auth.oauth.github.callback.tsx"),
	route("auth/logout", "routes/auth.logout.tsx"),
] satisfies RouteConfig;
