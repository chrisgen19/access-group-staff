import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
	usePathname: vi.fn(),
	useRouter: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
	signOut: vi.fn(),
	useSession: vi.fn(),
}));

vi.mock("@/components/shared/access-logos", () => ({
	AccessGroupLogo: (props: React.ComponentProps<"svg">) => (
		<svg aria-label="Access Group" {...props} />
	),
}));

vi.mock("@/components/shared/notification-badge", () => ({
	NotificationBadge: () => <span data-testid="notification-badge">3</span>,
}));

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { DashboardSidebar } from "./dashboard-sidebar";

const mockedUsePathname = vi.mocked(usePathname);
const mockedUseRouter = vi.mocked(useRouter);
const mockedUseSession = vi.mocked(useSession);

function setRole(role: "STAFF" | "ADMIN" | "SUPERADMIN") {
	mockedUseSession.mockReturnValue({
		data: { user: { id: "user-1", role } },
		isPending: false,
		error: null,
		refetch: vi.fn(),
	} as unknown as ReturnType<typeof useSession>);
}

describe("DashboardSidebar", () => {
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("keeps the desktop rail width and exposes full nav labels via title", () => {
		mockedUsePathname.mockReturnValue("/dashboard");
		mockedUseRouter.mockReturnValue({
			push: vi.fn(),
			refresh: vi.fn(),
		} as unknown as ReturnType<typeof useRouter>);
		setRole("STAFF");

		const { container } = render(<DashboardSidebar helpMeEnabled />);

		const aside = container.querySelector("aside");
		expect(aside).toHaveClass("w-[13.5rem]");

		const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
		expect(dashboardLink).toHaveAttribute("title", "Dashboard");
		expect(dashboardLink.querySelector("svg")).toHaveClass("shrink-0");
	});

	it("keeps admin nav affordances from shrinking and titles truncated child labels", () => {
		mockedUsePathname.mockReturnValue("/dashboard/admin-settings");
		mockedUseRouter.mockReturnValue({
			push: vi.fn(),
			refresh: vi.fn(),
		} as unknown as ReturnType<typeof useRouter>);
		setRole("ADMIN");

		render(<DashboardSidebar helpMeEnabled />);

		const adminSettingsLink = screen.getByRole("link", { name: "Admin Settings" });
		expect(adminSettingsLink).toHaveAttribute("title", "Admin Settings");

		const icons = adminSettingsLink.querySelectorAll("svg");
		expect(icons[0]).toHaveClass("shrink-0");
		expect(icons[1]).toHaveClass("shrink-0");

		const childLink = screen.getByRole("link", { name: "Activity Logs" });
		expect(childLink).toHaveAttribute("title", "Activity Logs");
	});
});
