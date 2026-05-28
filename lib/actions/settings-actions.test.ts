import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/env", () => ({
	env: {},
}));

vi.mock("@/lib/auth-utils", () => ({
	requireRole: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
	prisma: {
		appSetting: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
			upsert: vi.fn(),
		},
		$transaction: vi.fn(),
	},
}));

// Bypass the shared cache so tests don't leak state across cases. We only care
// that the fetcher and the prisma writes run as expected.
vi.mock("@/lib/cache/settings-cache", () => ({
	getOrCreateGlobalEntry: () => ({ data: null, expiry: 0, generation: 0 }),
	invalidateEntry: vi.fn(),
	readThroughCache: async <T>(_entry: unknown, _ttl: number, fetcher: () => Promise<T>) =>
		fetcher(),
}));

import { requireRole } from "@/lib/auth-utils";
import { invalidateEntry } from "@/lib/cache/settings-cache";
import { prisma } from "@/lib/db";
import {
	getHelpMeEnabled,
	getLeaderboardVisibilitySettings,
	updateHelpMeEnabled,
	updateLeaderboardVisibilitySettings,
} from "./settings-actions";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("getHelpMeEnabled", () => {
	test("defaults to enabled when no row exists", async () => {
		vi.mocked(prisma.appSetting.findUnique).mockResolvedValue(null);

		await expect(getHelpMeEnabled()).resolves.toBe(true);
		expect(prisma.appSetting.findUnique).toHaveBeenCalledWith({
			where: { key: "helpme_module_enabled" },
		});
	});

	test("returns false only when the row explicitly stores 'false'", async () => {
		vi.mocked(prisma.appSetting.findUnique).mockResolvedValueOnce({
			key: "helpme_module_enabled",
			value: "false",
			updatedAt: new Date(),
		} as Awaited<ReturnType<typeof prisma.appSetting.findUnique>>);

		await expect(getHelpMeEnabled()).resolves.toBe(false);
	});

	test("returns true when the row stores 'true'", async () => {
		vi.mocked(prisma.appSetting.findUnique).mockResolvedValueOnce({
			key: "helpme_module_enabled",
			value: "true",
			updatedAt: new Date(),
		} as Awaited<ReturnType<typeof prisma.appSetting.findUnique>>);

		await expect(getHelpMeEnabled()).resolves.toBe(true);
	});
});

describe("updateHelpMeEnabled", () => {
	test("rejects non-admins and does not write to the database", async () => {
		vi.mocked(requireRole).mockRejectedValueOnce(new Error("Forbidden"));

		const result = await updateHelpMeEnabled(false);

		expect(result).toEqual({ success: false, error: "Unauthorized" });
		expect(prisma.appSetting.upsert).not.toHaveBeenCalled();
		expect(invalidateEntry).not.toHaveBeenCalled();
	});

	test("persists the new value and invalidates the cache for admins", async () => {
		vi.mocked(requireRole).mockResolvedValueOnce({} as Awaited<ReturnType<typeof requireRole>>);
		vi.mocked(prisma.appSetting.upsert).mockResolvedValueOnce(
			{} as Awaited<ReturnType<typeof prisma.appSetting.upsert>>,
		);

		const result = await updateHelpMeEnabled(false);

		expect(result).toEqual({ success: true });
		expect(requireRole).toHaveBeenCalledWith("ADMIN");
		expect(prisma.appSetting.upsert).toHaveBeenCalledWith({
			where: { key: "helpme_module_enabled" },
			update: { value: "false" },
			create: { key: "helpme_module_enabled", value: "false" },
		});
		expect(invalidateEntry).toHaveBeenCalledTimes(1);
	});
});

type SettingRow = Awaited<ReturnType<typeof prisma.appSetting.findMany>>[number];

function rows(map: Record<string, string>): SettingRow[] {
	return Object.entries(map).map(
		([key, value]) => ({ key, value, updatedAt: new Date() }) as SettingRow,
	);
}

describe("getLeaderboardVisibilitySettings", () => {
	test("defaults to days 1-20 when no rows exist", async () => {
		vi.mocked(prisma.appSetting.findMany).mockResolvedValue([]);

		await expect(getLeaderboardVisibilitySettings()).resolves.toEqual({
			revealStartDay: 1,
			revealEndDay: 20,
		});
	});

	test("reads stored start/end days", async () => {
		vi.mocked(prisma.appSetting.findMany).mockResolvedValue(
			rows({ leaderboard_reveal_start_day: "5", leaderboard_reveal_end_day: "15" }),
		);

		await expect(getLeaderboardVisibilitySettings()).resolves.toEqual({
			revealStartDay: 5,
			revealEndDay: 15,
		});
	});

	test("falls back to defaults for out-of-range values", async () => {
		vi.mocked(prisma.appSetting.findMany).mockResolvedValue(
			rows({ leaderboard_reveal_start_day: "40", leaderboard_reveal_end_day: "0" }),
		);

		await expect(getLeaderboardVisibilitySettings()).resolves.toEqual({
			revealStartDay: 1,
			revealEndDay: 20,
		});
	});

	test("clamps the end day to be at least the start day", async () => {
		vi.mocked(prisma.appSetting.findMany).mockResolvedValue(
			rows({ leaderboard_reveal_start_day: "18", leaderboard_reveal_end_day: "5" }),
		);

		await expect(getLeaderboardVisibilitySettings()).resolves.toEqual({
			revealStartDay: 18,
			revealEndDay: 18,
		});
	});
});

describe("updateLeaderboardVisibilitySettings", () => {
	test("rejects non-admins without writing", async () => {
		vi.mocked(requireRole).mockRejectedValueOnce(new Error("Forbidden"));

		const result = await updateLeaderboardVisibilitySettings({
			revealStartDay: 1,
			revealEndDay: 20,
		});

		expect(result).toEqual({ success: false, error: "Unauthorized" });
		expect(prisma.$transaction).not.toHaveBeenCalled();
	});

	test("rejects out-of-range days", async () => {
		vi.mocked(requireRole).mockResolvedValueOnce({} as Awaited<ReturnType<typeof requireRole>>);

		const result = await updateLeaderboardVisibilitySettings({
			revealStartDay: 0,
			revealEndDay: 20,
		});

		expect(result.success).toBe(false);
		expect(prisma.$transaction).not.toHaveBeenCalled();
	});

	test("rejects when start day is after end day", async () => {
		vi.mocked(requireRole).mockResolvedValueOnce({} as Awaited<ReturnType<typeof requireRole>>);

		const result = await updateLeaderboardVisibilitySettings({
			revealStartDay: 15,
			revealEndDay: 5,
		});

		expect(result).toEqual({
			success: false,
			error: "Reveal start day must be on or before the end day",
		});
		expect(prisma.$transaction).not.toHaveBeenCalled();
	});

	test("persists valid days and invalidates the cache", async () => {
		vi.mocked(requireRole).mockResolvedValueOnce({} as Awaited<ReturnType<typeof requireRole>>);
		vi.mocked(prisma.$transaction).mockResolvedValueOnce([] as never);

		const result = await updateLeaderboardVisibilitySettings({
			revealStartDay: 3,
			revealEndDay: 18,
		});

		expect(result).toEqual({ success: true });
		expect(requireRole).toHaveBeenCalledWith("ADMIN");
		expect(prisma.$transaction).toHaveBeenCalledTimes(1);
		expect(invalidateEntry).toHaveBeenCalledTimes(1);
	});
});
