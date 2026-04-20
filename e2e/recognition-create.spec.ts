import { expect, test } from "./fixtures";
import { E2E_RECIPIENT, E2E_SENDER } from "./test-users";

test.describe("/dashboard/recognition/create", () => {
	test("happy path: fill form, review, submit → share dialog appears", async ({
		loggedInPage: page,
	}) => {
		await page.goto("/dashboard/recognition/create");

		const combobox = page.getByRole("combobox");
		await combobox.click();
		await page.getByPlaceholder("Search for a colleague...").fill(E2E_RECIPIENT.firstName);

		const option = page.getByRole("button", {
			name: new RegExp(`${E2E_RECIPIENT.firstName}\\s+${E2E_RECIPIENT.lastName}`, "i"),
		});
		await option.first().click();

		await page
			.getByPlaceholder("Describe what this team member did...")
			.fill("Excellent work on the release");

		await page.getByText("People", { exact: true }).first().click();

		await page.getByRole("button", { name: /Review Before Submit/i }).click();

		await expect(page.getByRole("button", { name: /Send Recognition/i })).toBeVisible();

		await page.getByRole("button", { name: /Send Recognition/i }).click();

		await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15_000 });
	});

	test("validation errors: submitting empty form shows inline errors", async ({
		loggedInPage: page,
	}) => {
		await page.goto("/dashboard/recognition/create");

		await page.getByRole("button", { name: /Review Before Submit/i }).click();

		await expect(page.getByText("Recipient is required")).toBeVisible();
		await expect(page.getByText("Message is required")).toBeVisible();
		await expect(page.getByText(/At least one company value/i)).toBeVisible();
	});

	test("self-recognition guard: sender is not in recipient combobox", async ({
		loggedInPage: page,
	}) => {
		await page.goto("/dashboard/recognition/create");

		await page.waitForFunction(
			async () => {
				const res = await fetch("/api/auth/get-session");
				const data = (await res.json().catch(() => null)) as { user?: { id?: string } } | null;
				return Boolean(data?.user?.id);
			},
			null,
			{ timeout: 15_000 },
		);

		const input = page.getByPlaceholder("Search for a colleague...");
		await input.click();
		await input.fill(E2E_SENDER.firstName);

		const listbox = page.getByRole("listbox");
		await expect(listbox).toBeVisible();

		const selfOption = listbox.getByText(`${E2E_SENDER.firstName} ${E2E_SENDER.lastName}`, {
			exact: false,
		});
		await expect(selfOption).toHaveCount(0);
	});
});
