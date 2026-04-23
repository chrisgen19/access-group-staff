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

	it("keeps FAB-safe bottom padding until the desktop breakpoint when Help Me is enabled", async () => {
		mockedGetHelpMeEnabled.mockResolvedValue(true);

		render(await DashboardLayout({ children: <div>Dashboard content</div> }));

		expect(screen.getByRole("main")).toHaveClass(
			"pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))]",
			"md:pb-8",
		);
		expect(screen.getByRole("main")).not.toHaveClass("sm:pb-8");
	});

	it("does not reserve FAB space when Help Me is disabled", async () => {
		mockedGetHelpMeEnabled.mockResolvedValue(false);

		render(await DashboardLayout({ children: <div>Dashboard content</div> }));

		expect(screen.getByRole("main")).toHaveClass("pb-8");
		expect(screen.getByRole("main")).not.toHaveClass(
			"pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))]",
		);
	});
});
