import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

vi.mock("next/headers", () => ({
	headers: vi.fn(async () => new Headers()),
}));

vi.mock("@/lib/auth-utils", () => ({
	requireSession: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
	prisma: {
		account: {
			findFirst: vi.fn(),
			create: vi.fn(),
		},
		user: {
			findUnique: vi.fn(),
			update: vi.fn(),
		},
	},
}));

vi.mock("@/lib/activity-log", () => ({
	logActivity: vi.fn(),
	extractRequestMeta: vi.fn(() => ({ ipAddress: "1.1.1.1", userAgent: "vitest" })),
}));

vi.mock("@/lib/r2", () => ({
	deleteFromR2: vi.fn(),
	extractKeyFromUrl: vi.fn(),
}));

vi.mock("better-auth/crypto", () => ({
	hashPassword: vi.fn(async (pw: string) => `hashed:${pw}`),
}));

import { hashPassword } from "better-auth/crypto";
import { Prisma } from "@/app/generated/prisma/client";
import { logActivity } from "@/lib/activity-log";
import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { setInitialPasswordAction } from "./profile-actions";

const USER_ID = "user_1";

const mockSession = (sessionAgeMs = 60 * 1000) => ({
	user: { id: USER_ID, name: "Tester", role: "STAFF" as const },
	session: { id: "sess_1", createdAt: new Date(Date.now() - sessionAgeMs) },
});

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(requireSession).mockResolvedValue(
		mockSession() as unknown as Awaited<ReturnType<typeof requireSession>>,
	);
});

describe("setInitialPasswordAction", () => {
	test("creates a credential account when none exists and logs PASSWORD_SET", async () => {
		vi.mocked(prisma.account.findFirst).mockResolvedValue(null);
		vi.mocked(prisma.account.create).mockResolvedValue({} as never);

		const result = await setInitialPasswordAction({
			newPassword: "supersecret",
			confirmPassword: "supersecret",
		});

		expect(result).toEqual({ success: true, data: null });
		expect(hashPassword).toHaveBeenCalledWith("supersecret");
		expect(prisma.account.create).toHaveBeenCalledWith({
			data: {
				userId: USER_ID,
				accountId: USER_ID,
				providerId: "credential",
				password: "hashed:supersecret",
			},
		});
		expect(logActivity).toHaveBeenCalledWith(
			expect.objectContaining({ action: "PASSWORD_SET", actorId: USER_ID }),
		);
	});

	test("rejects when a credential account already exists", async () => {
		vi.mocked(prisma.account.findFirst).mockResolvedValue({ id: "acct_1" } as never);

		const result = await setInitialPasswordAction({
			newPassword: "supersecret",
			confirmPassword: "supersecret",
		});

		expect(result.success).toBe(false);
		expect(prisma.account.create).not.toHaveBeenCalled();
		expect(hashPassword).not.toHaveBeenCalled();
	});

	test("rejects mismatched passwords without touching the database", async () => {
		const result = await setInitialPasswordAction({
			newPassword: "supersecret",
			confirmPassword: "different1",
		});

		expect(result.success).toBe(false);
		expect(prisma.account.findFirst).not.toHaveBeenCalled();
		expect(prisma.account.create).not.toHaveBeenCalled();
	});

	test("rejects passwords shorter than 8 characters", async () => {
		const result = await setInitialPasswordAction({
			newPassword: "short",
			confirmPassword: "short",
		});

		expect(result.success).toBe(false);
		expect(prisma.account.findFirst).not.toHaveBeenCalled();
	});

	test("fails closed when session.createdAt is missing/malformed", async () => {
		vi.mocked(requireSession).mockResolvedValue({
			user: { id: USER_ID, name: "Tester", role: "STAFF" as const },
			// createdAt deliberately invalid — adapter inconsistency or unexpected shape.
			session: { id: "sess_1", createdAt: undefined },
		} as unknown as Awaited<ReturnType<typeof requireSession>>);

		const result = await setInitialPasswordAction({
			newPassword: "supersecret",
			confirmPassword: "supersecret",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toMatch(/sign out and sign back in/i);
		}
		expect(prisma.account.findFirst).not.toHaveBeenCalled();
		expect(prisma.account.create).not.toHaveBeenCalled();
	});

	test("rejects when the session is older than the freshness window", async () => {
		// 16 minutes — outside the 15-minute fresh-auth gate.
		vi.mocked(requireSession).mockResolvedValue(
			mockSession(16 * 60 * 1000) as unknown as Awaited<ReturnType<typeof requireSession>>,
		);

		const result = await setInitialPasswordAction({
			newPassword: "supersecret",
			confirmPassword: "supersecret",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toMatch(/sign out and sign back in/i);
		}
		expect(prisma.account.findFirst).not.toHaveBeenCalled();
		expect(prisma.account.create).not.toHaveBeenCalled();
	});

	test("returns success even when post-persist logging fails", async () => {
		vi.mocked(prisma.account.findFirst).mockResolvedValue(null);
		vi.mocked(prisma.account.create).mockResolvedValue({} as never);
		vi.mocked(logActivity).mockRejectedValueOnce(new Error("activity-log down"));
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		try {
			const result = await setInitialPasswordAction({
				newPassword: "supersecret",
				confirmPassword: "supersecret",
			});

			expect(result).toEqual({ success: true, data: null });
			expect(prisma.account.create).toHaveBeenCalled();
			expect(consoleErrorSpy).toHaveBeenCalled();
		} finally {
			consoleErrorSpy.mockRestore();
		}
	});

	test("handles concurrent-create race (P2002) as already-set", async () => {
		vi.mocked(prisma.account.findFirst).mockResolvedValue(null);
		vi.mocked(prisma.account.create).mockRejectedValue(
			new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
				code: "P2002",
				clientVersion: "test",
			}),
		);

		const result = await setInitialPasswordAction({
			newPassword: "supersecret",
			confirmPassword: "supersecret",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toMatch(/already set/i);
		}
		expect(logActivity).not.toHaveBeenCalled();
	});
});
