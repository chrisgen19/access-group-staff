import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

vi.mock("next/headers", () => ({
	headers: vi.fn(async () => new Headers()),
}));

vi.mock("@/lib/auth", () => ({
	auth: { api: { signUpEmail: vi.fn() } },
}));

vi.mock("@/lib/auth-utils", () => ({
	requireRole: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
	prisma: {
		account: {
			findFirst: vi.fn(),
			update: vi.fn(),
			create: vi.fn(),
		},
		session: {
			deleteMany: vi.fn(),
		},
		user: {
			findUnique: vi.fn(),
		},
		$transaction: vi.fn(),
	},
}));

vi.mock("@/lib/activity-log", () => ({
	logActivity: vi.fn(),
	extractRequestMeta: vi.fn(() => ({ ipAddress: "1.1.1.1", userAgent: "vitest" })),
}));

vi.mock("better-auth/crypto", () => ({
	hashPassword: vi.fn(async (pw: string) => `hashed:${pw}`),
}));

import { hashPassword } from "better-auth/crypto";
import { Prisma } from "@/app/generated/prisma/client";
import { logActivity } from "@/lib/activity-log";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { adminResetPasswordAction } from "./user-actions";

const ADMIN_ID = "admin_1";
const TARGET_ID = "user_1";

const mockAdminSession = () => ({
	user: { id: ADMIN_ID, name: "Admin", role: "ADMIN" as const },
	session: { id: "sess_admin", createdAt: new Date() },
});

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(requireRole).mockResolvedValue(
		mockAdminSession() as unknown as Awaited<ReturnType<typeof requireRole>>,
	);
	vi.mocked(prisma.user.findUnique).mockResolvedValue({
		role: "STAFF",
		deletedAt: null,
	} as never);
	vi.mocked(prisma.$transaction).mockResolvedValue([] as never);
});

describe("adminResetPasswordAction", () => {
	test("updates an existing credential account and revokes sessions", async () => {
		vi.mocked(prisma.account.findFirst).mockResolvedValue({ id: "acct_1" } as never);

		const result = await adminResetPasswordAction(TARGET_ID, {
			newPassword: "supersecret",
			confirmPassword: "supersecret",
		});

		expect(result).toEqual({ success: true, data: null });
		expect(hashPassword).toHaveBeenCalledWith("supersecret");
		expect(prisma.account.update).toHaveBeenCalledWith({
			where: { id: "acct_1" },
			data: { password: "hashed:supersecret" },
		});
		expect(prisma.session.deleteMany).toHaveBeenCalledWith({ where: { userId: TARGET_ID } });
		expect(prisma.account.create).not.toHaveBeenCalled();
		expect(logActivity).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "PASSWORD_RESET",
				actorId: ADMIN_ID,
				targetType: "user",
				targetId: TARGET_ID,
			}),
		);
	});

	test("creates a credential account for an OAuth-only user and logs PASSWORD_SET", async () => {
		vi.mocked(prisma.account.findFirst).mockResolvedValue(null);
		vi.mocked(prisma.account.create).mockResolvedValue({} as never);

		const result = await adminResetPasswordAction(TARGET_ID, {
			newPassword: "supersecret",
			confirmPassword: "supersecret",
		});

		expect(result).toEqual({ success: true, data: null });
		expect(prisma.account.create).toHaveBeenCalledWith({
			data: {
				userId: TARGET_ID,
				accountId: TARGET_ID,
				providerId: "credential",
				password: "hashed:supersecret",
			},
		});
		expect(prisma.account.update).not.toHaveBeenCalled();
		expect(prisma.session.deleteMany).not.toHaveBeenCalled();
		expect(logActivity).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "PASSWORD_SET",
				actorId: ADMIN_ID,
				targetType: "user",
				targetId: TARGET_ID,
			}),
		);
	});

	test("handles concurrent-create race (P2002) with a clean error", async () => {
		vi.mocked(prisma.account.findFirst).mockResolvedValue(null);
		vi.mocked(prisma.account.create).mockRejectedValue(
			new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
				code: "P2002",
				clientVersion: "test",
			}),
		);

		const result = await adminResetPasswordAction(TARGET_ID, {
			newPassword: "supersecret",
			confirmPassword: "supersecret",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toMatch(/just set|reload/i);
		}
		expect(logActivity).not.toHaveBeenCalled();
	});

	test("rejects when the target user does not exist", async () => {
		vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

		const result = await adminResetPasswordAction(TARGET_ID, {
			newPassword: "supersecret",
			confirmPassword: "supersecret",
		});

		expect(result.success).toBe(false);
		expect(prisma.account.findFirst).not.toHaveBeenCalled();
		expect(logActivity).not.toHaveBeenCalled();
	});

	test("rejects when the target user is soft-deleted", async () => {
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			role: "STAFF",
			deletedAt: new Date(),
		} as never);

		const result = await adminResetPasswordAction(TARGET_ID, {
			newPassword: "supersecret",
			confirmPassword: "supersecret",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toMatch(/deleted/i);
		}
		expect(prisma.account.findFirst).not.toHaveBeenCalled();
		expect(logActivity).not.toHaveBeenCalled();
	});

	test("rejects when admin lacks permission to assign target's role", async () => {
		// Admin trying to reset a SUPERADMIN's password — canAssignRole returns false.
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			role: "SUPERADMIN",
			deletedAt: null,
		} as never);

		const result = await adminResetPasswordAction(TARGET_ID, {
			newPassword: "supersecret",
			confirmPassword: "supersecret",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toMatch(/permission/i);
		}
		expect(prisma.account.findFirst).not.toHaveBeenCalled();
		expect(logActivity).not.toHaveBeenCalled();
	});

	test("rejects mismatched passwords without touching the database", async () => {
		const result = await adminResetPasswordAction(TARGET_ID, {
			newPassword: "supersecret",
			confirmPassword: "different1",
		});

		expect(result.success).toBe(false);
		expect(prisma.user.findUnique).not.toHaveBeenCalled();
		expect(prisma.account.findFirst).not.toHaveBeenCalled();
	});

	test("returns success even when post-persist logging fails", async () => {
		vi.mocked(prisma.account.findFirst).mockResolvedValue(null);
		vi.mocked(prisma.account.create).mockResolvedValue({} as never);
		vi.mocked(logActivity).mockRejectedValueOnce(new Error("activity-log down"));
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		try {
			const result = await adminResetPasswordAction(TARGET_ID, {
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
});
