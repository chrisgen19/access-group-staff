import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/lib/db", () => ({
	prisma: {
		department: {
			findUnique: vi.fn(),
		},
		user: {
			findFirst: vi.fn(),
			update: vi.fn(),
		},
		appSetting: {
			findUnique: vi.fn(),
			upsert: vi.fn(),
		},
		$transaction: vi.fn(),
		$queryRaw: vi.fn(),
	},
}));

import { prisma } from "@/lib/db";
import { runItStaffUserBackfill, runItStaffUserBackfillOnceOnStartup } from "./it-staff-users";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("runItStaffUserBackfill", () => {
	test("updates matched users in a single transaction and skips missing users", async () => {
		vi.mocked(prisma.department.findUnique).mockResolvedValue({ id: "dept-it" } as never);
		vi.mocked(prisma.user.findFirst).mockImplementation(async ({ where }) => {
			const email = where.email.equals;
			if (
				email === "chrizza.trinidad@accessgroup.net.au" ||
				email === "raymond.ricarte@accessgroup.net.au" ||
				email === "rob.cristobal@accessgroup.net.au"
			) {
				return null;
			}

			return {
				id: `user-${email}`,
				email,
			} as never;
		});
		vi.mocked(prisma.user.update).mockImplementation((args) => args as never);
		vi.mocked(prisma.$transaction).mockResolvedValue([] as never);

		const result = await runItStaffUserBackfill({ apply: true, logger: console });

		expect(result).toEqual({
			updated: 9,
			matched: 9,
			missing: [
				"Chrizza Ann Trinidad <chrizza.trinidad@accessgroup.net.au>",
				"Raymond Ricarte <raymond.ricarte@accessgroup.net.au>",
				"Robin Ray Cristobal <rob.cristobal@accessgroup.net.au>",
			],
		});
		expect(prisma.$transaction).toHaveBeenCalledTimes(1);
		expect(vi.mocked(prisma.$transaction).mock.calls[0][0]).toHaveLength(9);
	});

	test("throws when no listed users exist during apply", async () => {
		vi.mocked(prisma.department.findUnique).mockResolvedValue({ id: "dept-it" } as never);
		vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

		await expect(runItStaffUserBackfill({ apply: true, logger: console })).rejects.toThrow(
			"Aborting apply because none of the backfill users were found.",
		);
		expect(prisma.$transaction).not.toHaveBeenCalled();
	});
});

describe("runItStaffUserBackfillOnceOnStartup", () => {
	test("skips when the completion marker already exists", async () => {
		vi.mocked(prisma.appSetting.findUnique).mockResolvedValueOnce({
			key: "backfill.it_staff_users.completed_at",
			value: new Date().toISOString(),
		} as never);

		const result = await runItStaffUserBackfillOnceOnStartup(console);

		expect(result).toEqual({ skipped: true, reason: "already_completed" });
		expect(prisma.$queryRaw).not.toHaveBeenCalled();
	});

	test("skips when the advisory lock is unavailable", async () => {
		vi.mocked(prisma.appSetting.findUnique).mockResolvedValueOnce(null);
		vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ locked: false }] as never);

		const result = await runItStaffUserBackfillOnceOnStartup(console);

		expect(result).toEqual({ skipped: true, reason: "lock_unavailable" });
		expect(prisma.appSetting.upsert).not.toHaveBeenCalled();
	});

	test("writes the completion marker after a successful startup apply", async () => {
		vi.mocked(prisma.appSetting.findUnique).mockResolvedValueOnce(null).mockResolvedValueOnce(null);
		vi.mocked(prisma.$queryRaw)
			.mockResolvedValueOnce([{ locked: true }] as never)
			.mockResolvedValueOnce([] as never);
		vi.mocked(prisma.department.findUnique).mockResolvedValue({ id: "dept-it" } as never);
		vi.mocked(prisma.user.findFirst).mockResolvedValue({
			id: "user-1",
			email: "abdul.solaiman@accessgroup.net.au",
		} as never);
		vi.mocked(prisma.user.update).mockImplementation((args) => args as never);
		vi.mocked(prisma.$transaction).mockResolvedValue([] as never);
		vi.mocked(prisma.appSetting.upsert).mockResolvedValue({} as never);

		const result = await runItStaffUserBackfillOnceOnStartup(console);

		expect(result).toMatchObject({ skipped: false, updated: 12, matched: 12 });
		expect(prisma.appSetting.upsert).toHaveBeenCalledTimes(1);
	});

	test("unlocks and does not write a marker when apply fails", async () => {
		vi.mocked(prisma.appSetting.findUnique).mockResolvedValueOnce(null).mockResolvedValueOnce(null);
		vi.mocked(prisma.$queryRaw)
			.mockResolvedValueOnce([{ locked: true }] as never)
			.mockResolvedValueOnce([] as never);
		vi.mocked(prisma.department.findUnique).mockResolvedValue(null);

		await expect(runItStaffUserBackfillOnceOnStartup(console)).rejects.toThrow(
			"IT department not found. Seed or reconcile departments first.",
		);
		expect(prisma.appSetting.upsert).not.toHaveBeenCalled();
		expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
	});
});
