import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
	usePathname: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
	useSession: vi.fn(),
}));

import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { HelpFab } from "./help-fab";

const mockedUsePathname = vi.mocked(usePathname);
const mockedUseSession = vi.mocked(useSession);

function setSession({ user, isPending }: { user: boolean; isPending: boolean }) {
	mockedUseSession.mockReturnValue({
		data: user ? { user: { id: "u1" } } : null,
		isPending,
		error: null,
		refetch: vi.fn(),
	} as unknown as ReturnType<typeof useSession>);
}

describe("HelpFab", () => {
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("renders on dashboard pages for an authenticated user, linking to the new ticket form", () => {
		mockedUsePathname.mockReturnValue("/dashboard");
		setSession({ user: true, isPending: false });

		render(<HelpFab />);

		const link = screen.getByRole("link", { name: /open help ticket/i });
		expect(link).toHaveAttribute("href", "/dashboard/helpme/new");
	});

	it("is hidden on /dashboard/helpme and its children", () => {
		mockedUsePathname.mockReturnValue("/dashboard/helpme");
		setSession({ user: true, isPending: false });

		const { container: root } = render(<HelpFab />);
		expect(root).toBeEmptyDOMElement();

		mockedUsePathname.mockReturnValue("/dashboard/helpme/abc123");
		const { container: detail } = render(<HelpFab />);
		expect(detail).toBeEmptyDOMElement();

		mockedUsePathname.mockReturnValue("/dashboard/helpme/new");
		const { container: create } = render(<HelpFab />);
		expect(create).toBeEmptyDOMElement();
	});

	it("still renders on lookalike siblings like /dashboard/helpmeout", () => {
		mockedUsePathname.mockReturnValue("/dashboard/helpmeout");
		setSession({ user: true, isPending: false });

		render(<HelpFab />);

		expect(screen.getByRole("link", { name: /open help ticket/i })).toHaveAttribute(
			"href",
			"/dashboard/helpme/new",
		);
	});

	it("does not render outside /dashboard (e.g. /login, /)", () => {
		setSession({ user: false, isPending: false });

		mockedUsePathname.mockReturnValue("/login");
		const { container: login } = render(<HelpFab />);
		expect(login).toBeEmptyDOMElement();

		mockedUsePathname.mockReturnValue("/");
		const { container: root } = render(<HelpFab />);
		expect(root).toBeEmptyDOMElement();
	});

	it("points unauthenticated dashboard visitors at /login with a callbackUrl", () => {
		mockedUsePathname.mockReturnValue("/dashboard");
		setSession({ user: false, isPending: false });

		render(<HelpFab />);

		const link = screen.getByRole("link", { name: /open help ticket/i });
		expect(link).toHaveAttribute(
			"href",
			`/login?callbackUrl=${encodeURIComponent("/dashboard/helpme/new")}`,
		);
	});

	it("links to the ticket form while the session is still loading (proxy handles redirect)", () => {
		mockedUsePathname.mockReturnValue("/dashboard");
		setSession({ user: false, isPending: true });

		render(<HelpFab />);

		const link = screen.getByRole("link", { name: /open help ticket/i });
		expect(link).toHaveAttribute("href", "/dashboard/helpme/new");
	});
});
