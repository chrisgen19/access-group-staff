import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
	redirect: vi.fn(),
}));

vi.mock("@/components/shared/dashboard-header", () => ({
	DashboardHeader: () => <div data-testid="dashboard-header" />,
}));

vi.mock("@/components/shared/dashboard-sidebar", () => ({
	DashboardSidebar: () => <div data-testid="dashboard-sidebar" />,
}));

vi.mock("@/components/shared/help-fab", () => ({
	HelpFab: () => <div data-testid="help-fab" />,
}));

vi.mock("@/lib/actions/settings-actions", () => ({
	getHelpMeEnabled: vi.fn(async () => true),
}));

vi.mock("@/lib/auth-utils", () => ({
	getServerSession: vi.fn(async () => ({
		user: { role: "ADMIN" },
	})),
}));

import { getHelpMeEnabled } from "@/lib/actions/settings-actions";
import DashboardLayout from "./layout";

const mockedGetHelpMeEnabled = vi.mocked(getHelpMeEnabled);

describe("DashboardLayout", () => {
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("reserves FAB-safe bottom padding via inline style when Help Me is enabled", async () => {
		mockedGetHelpMeEnabled.mockResolvedValue(true);

		const { container } = render(await DashboardLayout({ children: <div>Dashboard content</div> }));
		const main = screen.getByRole("main");

		expect(main).toHaveClass("pb-8");
		const styleAttr = main.getAttribute("style") ?? "";
		expect(styleAttr).toMatch(/padding-bottom:\s*calc\(/);
		expect(styleAttr).toContain("6.5rem");
		expect(styleAttr).toContain("safe-area-inset-bottom");
		expect(container.firstChild).toHaveClass("bg-background");
	});

	it("falls back to the Tailwind pb-8 utility when Help Me is disabled", async () => {
		mockedGetHelpMeEnabled.mockResolvedValue(false);

		render(await DashboardLayout({ children: <div>Dashboard content</div> }));
		const main = screen.getByRole("main");

		expect(main).toHaveClass("pb-8");
		expect(main.getAttribute("style")).toBeNull();
	});
});
