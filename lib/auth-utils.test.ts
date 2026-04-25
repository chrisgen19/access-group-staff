import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("next/headers", () => ({
	headers: vi.fn(async () => new Headers()),
}));

vi.mock("next/navigation", () => ({
	redirect: vi.fn((url: string) => {
		throw new Error(`__redirect__:${url}`);
	}),
}));

vi.mock("@/lib/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@/lib/db", () => ({
	prisma: {
		user: { findUnique: vi.fn() },
	},
}));

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AuthError, requireRoleOrRedirect } from "./auth-utils";

const adminSession = {
	user: { id: "u1", role: "ADMIN" as const },
	session: { id: "s1" },
};

const superadminSession = {
	user: { id: "u2", role: "SUPERADMIN" as const },
	session: { id: "s2" },
};

const staffSession = {
	user: { id: "u3", role: "STAFF" as const },
	session: { id: "s3" },
};

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(prisma.user.findUnique).mockResolvedValue({ deletedAt: null } as never);
});

describe("requireRoleOrRedirect", () => {
	test("returns the session when role is satisfied", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue(adminSession as never);

		const result = await requireRoleOrRedirect("ADMIN");

		expect(result).toEqual(adminSession);
		expect(redirect).not.toHaveBeenCalled();
	});

	test("redirects when there is no active session", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue(null);

		await expect(requireRoleOrRedirect("ADMIN")).rejects.toThrow(/__redirect__:\/dashboard/);
		expect(redirect).toHaveBeenCalledWith("/dashboard");
	});

	test("redirects when the user role is below the minimum", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue(staffSession as never);

		await expect(requireRoleOrRedirect("ADMIN")).rejects.toThrow(/__redirect__:\/dashboard/);
		expect(redirect).toHaveBeenCalledWith("/dashboard");
	});

	test("redirects when the user has been soft-deleted since their session was issued", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue(adminSession as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({ deletedAt: new Date() } as never);

		await expect(requireRoleOrRedirect("ADMIN")).rejects.toThrow(/__redirect__:\/dashboard/);
		expect(redirect).toHaveBeenCalledWith("/dashboard");
	});

	test("honours a custom redirect target", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue(null);

		await expect(requireRoleOrRedirect("ADMIN", "/login")).rejects.toThrow(/__redirect__:\/login/);
		expect(redirect).toHaveBeenCalledWith("/login");
	});

	test("SUPERADMIN satisfies ADMIN minimum", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue(superadminSession as never);

		const result = await requireRoleOrRedirect("ADMIN");

		expect(result).toEqual(superadminSession);
		expect(redirect).not.toHaveBeenCalled();
	});

	test("re-throws non-AuthError exceptions instead of redirecting", async () => {
		// Simulate an infrastructure failure inside requireSession's user lookup —
		// the kind of error that previously got silently swallowed by the bare
		// catch + redirect pattern. Should now surface to the route's error.tsx.
		vi.mocked(auth.api.getSession).mockResolvedValue(adminSession as never);
		vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("db connection lost"));

		await expect(requireRoleOrRedirect("ADMIN")).rejects.toThrow("db connection lost");
		expect(redirect).not.toHaveBeenCalled();
	});

	test("AuthError is the only signal that triggers a redirect", async () => {
		// Sanity check on the exception-narrowing: an AuthError thrown from
		// elsewhere in the call chain should still redirect, but anything else
		// (TypeError, generic Error, etc.) shouldn't.
		vi.mocked(auth.api.getSession).mockRejectedValue(new AuthError("Unauthorized", 401));

		await expect(requireRoleOrRedirect("ADMIN")).rejects.toThrow(/__redirect__:\/dashboard/);
		expect(redirect).toHaveBeenCalledWith("/dashboard");
	});
});
