import { test as base, expect, type Page } from "@playwright/test";
import { E2E_SENDER } from "./test-users";

type Fixtures = {
	loggedInPage: Page;
};

export async function loginAs(
	page: Page,
	user: { email: string; password: string },
): Promise<void> {
	const response = await page.request.post("/api/auth/sign-in/email", {
		data: { email: user.email, password: user.password },
	});
	if (!response.ok()) {
		throw new Error(
			`Login failed for ${user.email}: ${response.status()} ${await response.text()}`,
		);
	}
}

export const test = base.extend<Fixtures>({
	loggedInPage: async ({ page }, use) => {
		await loginAs(page, E2E_SENDER);
		await use(page);
	},
});

export { expect };
