import { expect, loginAs, test } from "./fixtures";
import { E2E_ADMIN } from "./test-users";

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

	test("mobile layout keeps the help FAB visible without covering the bottom action, and hides it when disabled", async ({
		page,
	}) => {
		await loginAs(page, E2E_ADMIN);
		await setHelpMeEnabled(page, true);

		try {
			await page.goto("/dashboard/profile/security");

			const fab = page.getByRole("link", { name: /open help ticket/i });
			await expect(fab).toBeVisible();

			const updatePasswordButton = page.getByRole("button", { name: /update password/i });
			await updatePasswordButton.scrollIntoViewIfNeeded();
			await expect(updatePasswordButton).toBeVisible();

			const fabBox = await fab.boundingBox();
			const buttonBox = await updatePasswordButton.boundingBox();
			const viewport = page.viewportSize();

			expect(fabBox).not.toBeNull();
			expect(buttonBox).not.toBeNull();
			expect(viewport).not.toBeNull();

			if (!fabBox || !buttonBox || !viewport) {
				throw new Error("Expected FAB, bottom action, and viewport metrics to be available");
			}

			expect(fabBox.x + fabBox.width).toBeGreaterThanOrEqual(viewport.width - 24);
			expect(fabBox.y + fabBox.height).toBeGreaterThanOrEqual(viewport.height - 32);
			expect(buttonBox.y + buttonBox.height).toBeLessThanOrEqual(fabBox.y - 8);

			await setHelpMeEnabled(page, false);
			await page.goto("/dashboard");
			await expect(page.getByRole("link", { name: /open help ticket/i })).toHaveCount(0);
		} finally {
			await setHelpMeEnabled(page, true);
		}
	});
});
