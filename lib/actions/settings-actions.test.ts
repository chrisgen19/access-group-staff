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
			upsert: vi.fn(),
		},
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
import { getHelpMeEnabled, updateHelpMeEnabled } from "./settings-actions";

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
