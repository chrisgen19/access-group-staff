import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

vi.mock("@/components/ui/sheet", () => ({
	Sheet: ({ open, children }: { open: boolean; children: React.ReactNode }) => (
		<>{open ? children : null}</>
	),
	SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { DashboardSidebar, MobileSidebarTrigger } from "./dashboard-sidebar";

const mockedUsePathname = vi.mocked(usePathname);
const mockedUseRouter = vi.mocked(useRouter);
const mockedUseSession = vi.mocked(useSession);

function setSession({
	role,
	isPending = false,
}: {
	role?: "STAFF" | "ADMIN" | "SUPERADMIN";
	isPending?: boolean;
}) {
	mockedUseSession.mockReturnValue({
		data: role ? { user: { id: "user-1", role } } : null,
		isPending,
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
		setSession({ role: "STAFF" });

		const { container } = render(<DashboardSidebar helpMeEnabled initialUserRole="STAFF" />);

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
		setSession({ role: "ADMIN" });

		render(<DashboardSidebar helpMeEnabled initialUserRole="ADMIN" />);

		const adminSettingsLink = screen.getByRole("link", { name: "Admin Settings" });
		expect(adminSettingsLink).toHaveAttribute("title", "Admin Settings");

		const icons = adminSettingsLink.querySelectorAll("svg");
		expect(icons[0]).toHaveClass("shrink-0");
		expect(icons[1]).toHaveClass("shrink-0");

		const childLink = screen.getByRole("link", { name: "Activity Logs" });
		expect(childLink).toHaveAttribute("title", "Activity Logs");
	});

	it("uses the server role while the client session is still pending", () => {
		mockedUsePathname.mockReturnValue("/dashboard");
		mockedUseRouter.mockReturnValue({
			push: vi.fn(),
			refresh: vi.fn(),
		} as unknown as ReturnType<typeof useRouter>);
		setSession({ isPending: true });

		render(<DashboardSidebar helpMeEnabled initialUserRole="ADMIN" />);

		expect(screen.getByRole("link", { name: "Staff" })).toBeInTheDocument();
		expect(screen.queryByRole("link", { name: "Super Admin" })).not.toBeInTheDocument();
	});

	it("downgrades to staff links after hydration when the client session has no user", () => {
		mockedUsePathname.mockReturnValue("/dashboard");
		mockedUseRouter.mockReturnValue({
			push: vi.fn(),
			refresh: vi.fn(),
		} as unknown as ReturnType<typeof useRouter>);
		setSession({ isPending: false });

		render(<DashboardSidebar helpMeEnabled initialUserRole="ADMIN" />);

		expect(screen.queryByRole("link", { name: "Staff" })).not.toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
	});

	it("uses the same pending fallback role in the mobile sidebar", () => {
		mockedUsePathname.mockReturnValue("/dashboard");
		mockedUseRouter.mockReturnValue({
			push: vi.fn(),
			refresh: vi.fn(),
		} as unknown as ReturnType<typeof useRouter>);
		setSession({ isPending: true });

		render(<MobileSidebarTrigger helpMeEnabled initialUserRole="ADMIN" />);
		fireEvent.click(screen.getByRole("button"));

		expect(screen.getByRole("link", { name: "Staff" })).toBeInTheDocument();
	});
});
