import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		environment: "jsdom",
		globals: true,
		include: ["app/**/*.test.{ts,tsx}", "app/**/__tests__/**/*.{ts,tsx}"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "lcov"],
			include: ["app/**/*.{ts,tsx}"],
			exclude: ["app/**/*.test.{ts,tsx}", "app/**/__tests__/**", "app/entry.{client,server}.tsx"],
		},
		setupFiles: ["./vitest.setup.ts"],
	},
});
