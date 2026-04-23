import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
	usePathname: vi.fn(),
}));

vi.mock("@/components/shared/access-logos", () => ({
	AccessGroupLogo: (props: React.ComponentProps<"svg">) => (
		<svg aria-label="Access Group" {...props} />
	),
}));

vi.mock("@/components/shared/dashboard-sidebar", () => ({
	MobileSidebarTrigger: () => <button type="button">Menu</button>,
}));

vi.mock("@/components/shared/dashboard-account-controls", () => ({
	DashboardAccountControls: ({ className = "" }: { className?: string }) => (
		<div data-testid="account-controls" className={className} />
	),
}));

import { usePathname } from "next/navigation";
import { DashboardHeader } from "./dashboard-header";

const mockedUsePathname = vi.mocked(usePathname);

describe("DashboardHeader", () => {
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it.each([
		["/dashboard", "Dashboard"],
		["/dashboard/recognition/create", "Recognition"],
		["/dashboard/leaderboard", "Leaderboard"],
		["/dashboard/users/new", "Staff"],
		["/dashboard/departments", "Departments"],
		["/dashboard/profile/security", "Profile"],
		["/dashboard/helpme/new", "Help Me"],
		["/dashboard/admin-settings/activity-logs", "Admin Settings"],
		["/dashboard/super-admin", "Super Admin"],
	])("shows the correct mobile section label for %s", (pathname, label) => {
		mockedUsePathname.mockReturnValue(pathname);

		render(<DashboardHeader helpMeEnabled initialUserRole="ADMIN" />);

		expect(screen.getByText(label)).toBeInTheDocument();
	});

	it("renders the account controls inside the mobile-only sticky header", () => {
		mockedUsePathname.mockReturnValue("/dashboard");

		const { container } = render(<DashboardHeader helpMeEnabled initialUserRole="STAFF" />);

		expect(screen.getByTestId("account-controls")).toBeInTheDocument();
		expect(container.querySelector("header")).toHaveClass("md:hidden");
	});
});
