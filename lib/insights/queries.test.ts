import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/lib/db", () => ({
	prisma: {
		activityLog: { findMany: vi.fn() },
	},
}));

import { prisma } from "@/lib/db";
import { getCardCadence, getTopValues } from "./queries";

// 2026-04-25 12:00:00 UTC == 2026-04-25 20:00 Manila — comfortably mid-day so
// boundary maths around midnight don't shift the "today" key in either TZ.
const FROZEN_NOW = new Date("2026-04-25T12:00:00.000Z");

beforeEach(() => {
	vi.clearAllMocks();
	vi.useFakeTimers();
	vi.setSystemTime(FROZEN_NOW);
});

afterEach(() => {
	vi.useRealTimers();
});

describe("getCardCadence", () => {
	test("returns one bucket per day, oldest first, with zero-fill for empty days", async () => {
		vi.mocked(prisma.activityLog.findMany).mockResolvedValue([
			// 2026-04-25 12:00 UTC = 2026-04-25 20:00 Manila → key 2026-04-25
			{ createdAt: new Date("2026-04-25T12:00:00.000Z") },
			{ createdAt: new Date("2026-04-25T13:00:00.000Z") },
			// 2026-04-23 02:00 UTC = 2026-04-23 10:00 Manila → key 2026-04-23
			{ createdAt: new Date("2026-04-23T02:00:00.000Z") },
		] as never);

		const result = await getCardCadence(5);

		expect(result).toEqual([
			{ day: "2026-04-21", count: 0 },
			{ day: "2026-04-22", count: 0 },
			{ day: "2026-04-23", count: 1 },
			{ day: "2026-04-24", count: 0 },
			{ day: "2026-04-25", count: 2 },
		]);
	});

	test("buckets late-evening Manila events on the correct Manila day, not UTC day", async () => {
		// 2026-04-24 16:30 UTC = 2026-04-25 00:30 Manila → key 2026-04-25
		// (Important: by UTC date this is the 24th; by Manila date it's the 25th.)
		vi.mocked(prisma.activityLog.findMany).mockResolvedValue([
			{ createdAt: new Date("2026-04-24T16:30:00.000Z") },
		] as never);

		const result = await getCardCadence(2);

		expect(result).toEqual([
			{ day: "2026-04-24", count: 0 },
			{ day: "2026-04-25", count: 1 },
		]);
	});

	test("filters by action=CARD_CREATED and uses a lower bound that includes the earliest day", async () => {
		vi.mocked(prisma.activityLog.findMany).mockResolvedValue([] as never);

		await getCardCadence(7);

		const arg = vi.mocked(prisma.activityLog.findMany).mock.calls[0]?.[0];
		expect(arg?.where?.action).toBe("CARD_CREATED");
		// Lower bound = start of (today - 6) in Manila = 2026-04-19 00:00 +08:00
		// = 2026-04-18 16:00 UTC.
		expect((arg?.where?.createdAt as { gte?: Date })?.gte?.toISOString()).toBe(
			"2026-04-18T16:00:00.000Z",
		);
	});

	test("returns empty array when daysBack <= 0", async () => {
		const result = await getCardCadence(0);
		expect(result).toEqual([]);
		expect(prisma.activityLog.findMany).not.toHaveBeenCalled();
	});
});

describe("getTopValues", () => {
	test("counts valuesPicked entries across rows and sorts by count desc", async () => {
		vi.mocked(prisma.activityLog.findMany).mockResolvedValue([
			{ metadata: { valuesPicked: ["PEOPLE", "RESPECT"] } },
			{ metadata: { valuesPicked: ["PEOPLE"] } },
			{ metadata: { valuesPicked: ["PEOPLE", "COMMUNICATION"] } },
			{ metadata: { valuesPicked: ["RESPECT"] } },
		] as never);

		const result = await getTopValues(30);

		expect(result).toEqual([
			{ value: "PEOPLE", count: 3 },
			{ value: "RESPECT", count: 2 },
			{ value: "COMMUNICATION", count: 1 },
		]);
	});

	test("breaks count ties alphabetically so ordering is stable", async () => {
		vi.mocked(prisma.activityLog.findMany).mockResolvedValue([
			{ metadata: { valuesPicked: ["SAFETY"] } },
			{ metadata: { valuesPicked: ["PEOPLE"] } },
			{ metadata: { valuesPicked: ["RESPECT"] } },
		] as never);

		const result = await getTopValues(30);

		expect(result.map((r) => r.value)).toEqual(["PEOPLE", "RESPECT", "SAFETY"]);
	});

	test("ignores rows whose metadata is missing, null, or malformed", async () => {
		vi.mocked(prisma.activityLog.findMany).mockResolvedValue([
			{ metadata: null },
			{ metadata: {} },
			{ metadata: { valuesPicked: "PEOPLE" } }, // not an array
			{ metadata: { valuesPicked: [42, true, null, "PEOPLE"] } }, // mixed types
		] as never);

		const result = await getTopValues(30);

		// Only the one valid string slipped through.
		expect(result).toEqual([{ value: "PEOPLE", count: 1 }]);
	});

	test("returns empty array when daysBack <= 0", async () => {
		const result = await getTopValues(0);
		expect(result).toEqual([]);
		expect(prisma.activityLog.findMany).not.toHaveBeenCalled();
	});
});
