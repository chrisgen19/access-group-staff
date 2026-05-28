import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/lib/db", () => ({
	prisma: {
		monthlyLeaderboardSnapshot: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
		},
	},
}));

import { prisma } from "@/lib/db";
import { getArchivedRecipients, getMonthLeaderboard, isValidMonthKey } from "./history";

// Asia/Manila 2026-06-15 12:00 → current month key is 2026-06.
const NOW = new Date("2026-06-15T04:00:00Z");

function recipient(rank: number) {
	return {
		userId: `u${rank}`,
		firstName: `First${rank}`,
		lastName: `Last${rank}`,
		avatar: null,
		count: 10 - rank,
		rank,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("isValidMonthKey", () => {
	test("accepts well-formed keys and rejects malformed ones", () => {
		expect(isValidMonthKey("2026-05")).toBe(true);
		expect(isValidMonthKey("2026-13")).toBe(false);
		expect(isValidMonthKey("2026-5")).toBe(false);
		expect(isValidMonthKey("nope")).toBe(false);
	});
});

describe("getMonthLeaderboard", () => {
	test("returns locked for the in-progress current month without hitting the DB", async () => {
		const result = await getMonthLeaderboard("2026-06", NOW);

		expect(result).toEqual({ kind: "locked", monthKey: "2026-06" });
		expect(prisma.monthlyLeaderboardSnapshot.findUnique).not.toHaveBeenCalled();
	});

	test("returns missing when no snapshot exists for a past month", async () => {
		vi.mocked(prisma.monthlyLeaderboardSnapshot.findUnique).mockResolvedValue(null);

		const result = await getMonthLeaderboard("2026-05", NOW);

		expect(result).toEqual({ kind: "missing", monthKey: "2026-05" });
	});

	test("returns archived recipients trimmed to the limit", async () => {
		const snapshotAt = new Date("2026-06-01T00:05:00Z");
		vi.mocked(prisma.monthlyLeaderboardSnapshot.findUnique).mockResolvedValue({
			month: "2026-05",
			recipients: [recipient(1), recipient(2), recipient(3)],
			snapshotAt,
			topLimit: 50,
			id: "snap_1",
		} as never);

		const result = await getMonthLeaderboard("2026-05", NOW, 2);

		expect(result.kind).toBe("archived");
		if (result.kind === "archived") {
			expect(result.recipients).toHaveLength(2);
			expect(result.recipients.map((r) => r.rank)).toEqual([1, 2]);
			expect(result.snapshotAt).toBe(snapshotAt);
		}
	});

	test("returns missing when the stored snapshot JSON is invalid", async () => {
		vi.mocked(prisma.monthlyLeaderboardSnapshot.findUnique).mockResolvedValue({
			month: "2026-05",
			recipients: [{ bogus: true }],
			snapshotAt: new Date(),
			topLimit: 50,
			id: "snap_1",
		} as never);

		const result = await getMonthLeaderboard("2026-05", NOW);

		expect(result).toEqual({ kind: "missing", monthKey: "2026-05" });
	});
});

describe("getArchivedRecipients", () => {
	test("returns null when no snapshot exists", async () => {
		vi.mocked(prisma.monthlyLeaderboardSnapshot.findUnique).mockResolvedValue(null);

		await expect(getArchivedRecipients("2026-05", 10)).resolves.toBeNull();
	});

	test("returns null when the snapshot JSON is invalid", async () => {
		vi.mocked(prisma.monthlyLeaderboardSnapshot.findUnique).mockResolvedValue({
			recipients: [{ bogus: true }],
		} as never);

		await expect(getArchivedRecipients("2026-05", 10)).resolves.toBeNull();
	});

	test("returns recipients trimmed to the limit", async () => {
		vi.mocked(prisma.monthlyLeaderboardSnapshot.findUnique).mockResolvedValue({
			recipients: [recipient(1), recipient(2), recipient(3)],
		} as never);

		const result = await getArchivedRecipients("2026-05", 2);

		expect(result).toHaveLength(2);
		expect(result?.map((r) => r.rank)).toEqual([1, 2]);
	});
});
