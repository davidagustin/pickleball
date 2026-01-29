import { expect, test } from "@playwright/test";

test("home page loads", async ({ page }) => {
	await page.goto("/");
	await expect(page).toHaveTitle(/pickleball/i);
});

test("home has feed and courts tabs", async ({ page }) => {
	await page.goto("/home");
	await expect(page.getByRole("button", { name: /feed/i })).toBeVisible();
	await expect(page.getByRole("button", { name: /courts/i })).toBeVisible();
});

test("courts page loads", async ({ page }) => {
	await page.goto("/courts");
	await expect(page).toHaveTitle(/court/i);
});

test("sessions page loads", async ({ page }) => {
	await page.goto("/sessions");
	await expect(page).toHaveTitle(/play sessions/i);
});
