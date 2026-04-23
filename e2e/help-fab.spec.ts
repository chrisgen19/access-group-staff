import { expect, loginAs, test } from "./fixtures";
import { E2E_ADMIN } from "./test-users";

test.describe.configure({ mode: "serial" });

test.describe("/dashboard Help FAB", () => {
	test.use({ viewport: { width: 390, height: 844 } });

	async function setHelpMeEnabled(
		page: Parameters<typeof loginAs>[0],
		enabled: boolean,
	): Promise<void> {
		await page.goto("/dashboard/admin-settings");

		const toggle = page.getByRole("switch", { name: /toggle help me module/i });
		await expect(toggle).toBeVisible();

		const current = (await toggle.getAttribute("aria-checked")) === "true";
		if (current === enabled) return;

		await toggle.click();
		await expect(toggle).toHaveAttribute("aria-checked", enabled ? "true" : "false");
	}

	test.beforeEach(async ({ page }) => {
		await loginAs(page, E2E_ADMIN);
	});

	test.afterEach(async ({ page }) => {
		// The seed owns the default (enabled); only restore if a test flipped it off.
		await setHelpMeEnabled(page, true);
	});

	test("mobile layout keeps the help FAB visible without covering the bottom action, and hides it when disabled", async ({
		page,
	}) => {
		await page.goto("/dashboard");

		const fab = page.getByRole("link", { name: /open help ticket/i });
		await expect(fab).toBeVisible();

		const fabBox = await fab.boundingBox();
		const viewport = page.viewportSize();
		const mainPaddingBottom = await page.getByRole("main").evaluate((element) => {
			return Number.parseFloat(window.getComputedStyle(element).paddingBottom);
		});

		expect(fabBox).not.toBeNull();
		expect(viewport).not.toBeNull();

		if (!fabBox || !viewport) {
			throw new Error("Expected FAB and viewport metrics to be available");
		}

		expect(fabBox.x + fabBox.width).toBeGreaterThanOrEqual(viewport.width - 24);
		expect(fabBox.y + fabBox.height).toBeGreaterThanOrEqual(viewport.height - 32);
		expect(mainPaddingBottom).toBeGreaterThanOrEqual(fabBox.height + 40);

		await setHelpMeEnabled(page, false);
		await page.goto("/dashboard");
		await expect(page.getByRole("link", { name: /open help ticket/i })).toHaveCount(0);
	});
});
