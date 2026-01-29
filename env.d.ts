/// <reference path="./worker-configuration.d.ts" />
declare namespace Cloudflare {
	interface Env {
		DB: D1Database;
		PICKLEBALL_BUCKET: R2Bucket;
		GOOGLE_CLIENT_ID?: string;
		GOOGLE_CLIENT_SECRET?: string;
		GITHUB_CLIENT_ID?: string;
		GITHUB_CLIENT_SECRET?: string;
	}
}
