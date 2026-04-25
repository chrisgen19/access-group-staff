import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/lib/db", () => ({
	prisma: {
		activityLog: { findMany: vi.fn(), groupBy: vi.fn() },
		user: { findMany: vi.fn() },
		recognitionCard: { findMany: vi.fn() },
	},
}));

import { prisma } from "@/lib/db";
import {
	getCardCadence,
	getCategoryMix,
	getMostEngagedCards,
	getTopRecognisers,
	getTopValues,
} from "./queries";

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

describe("getTopRecognisers", () => {
	test("merges grouped counts with user details and sorts by count desc", async () => {
		vi.mocked(prisma.activityLog.groupBy).mockResolvedValue([
			{ actorId: "u1", _count: { _all: 5 } },
			{ actorId: "u2", _count: { _all: 12 } },
			{ actorId: "u3", _count: { _all: 7 } },
		] as never);
		vi.mocked(prisma.user.findMany).mockResolvedValue([
			{ id: "u1", firstName: "Ann", lastName: "Lee", avatar: null },
			{ id: "u2", firstName: "Bea", lastName: "Cruz", avatar: "/a.png" },
			{ id: "u3", firstName: "Cal", lastName: "Reyes", avatar: null },
		] as never);

		const result = await getTopRecognisers(30, 10);

		expect(result).toEqual([
			{ userId: "u2", firstName: "Bea", lastName: "Cruz", avatar: "/a.png", count: 12 },
			{ userId: "u3", firstName: "Cal", lastName: "Reyes", avatar: null, count: 7 },
			{ userId: "u1", firstName: "Ann", lastName: "Lee", avatar: null, count: 5 },
		]);
	});

	test("breaks count ties by full name alphabetically", async () => {
		vi.mocked(prisma.activityLog.groupBy).mockResolvedValue([
			{ actorId: "u1", _count: { _all: 5 } },
			{ actorId: "u2", _count: { _all: 5 } },
		] as never);
		vi.mocked(prisma.user.findMany).mockResolvedValue([
			{ id: "u1", firstName: "Bea", lastName: "Cruz", avatar: null },
			{ id: "u2", firstName: "Ann", lastName: "Lee", avatar: null },
		] as never);

		const result = await getTopRecognisers(30, 10);

		expect(result.map((r) => r.firstName)).toEqual(["Ann", "Bea"]);
	});

	test("respects the limit parameter", async () => {
		vi.mocked(prisma.activityLog.groupBy).mockResolvedValue([
			{ actorId: "u1", _count: { _all: 5 } },
			{ actorId: "u2", _count: { _all: 4 } },
			{ actorId: "u3", _count: { _all: 3 } },
		] as never);
		vi.mocked(prisma.user.findMany).mockResolvedValue([
			{ id: "u1", firstName: "A", lastName: "X", avatar: null },
			{ id: "u2", firstName: "B", lastName: "X", avatar: null },
			{ id: "u3", firstName: "C", lastName: "X", avatar: null },
		] as never);

		const result = await getTopRecognisers(30, 2);

		expect(result).toHaveLength(2);
		expect(result.map((r) => r.userId)).toEqual(["u1", "u2"]);
	});

	test("skips actors whose User row is missing (raced soft-delete)", async () => {
		// Group says u1 + u2; user lookup only returns u1.
		vi.mocked(prisma.activityLog.groupBy).mockResolvedValue([
			{ actorId: "u1", _count: { _all: 5 } },
			{ actorId: "u2", _count: { _all: 9 } },
		] as never);
		vi.mocked(prisma.user.findMany).mockResolvedValue([
			{ id: "u1", firstName: "Ann", lastName: "Lee", avatar: null },
		] as never);

		const result = await getTopRecognisers(30, 10);

		expect(result).toHaveLength(1);
		expect(result[0]?.userId).toBe("u1");
	});

	test("excludes soft-deleted users via deletedAt filter on the user lookup", async () => {
		vi.mocked(prisma.activityLog.groupBy).mockResolvedValue([
			{ actorId: "u1", _count: { _all: 5 } },
			{ actorId: "u2", _count: { _all: 9 } },
		] as never);
		// Simulate the DB-level filter: `findMany` with `deletedAt: null` only
		// returns the live user. The deleted user's groupBy row should be
		// dropped from the result.
		vi.mocked(prisma.user.findMany).mockResolvedValue([
			{ id: "u1", firstName: "Live", lastName: "User", avatar: null },
		] as never);

		const result = await getTopRecognisers(30, 10);

		expect(result).toHaveLength(1);
		expect(result[0]?.userId).toBe("u1");
		// Verify the filter was actually requested at the query layer, not
		// just that the mock happened to return one row.
		const arg = vi.mocked(prisma.user.findMany).mock.calls[0]?.[0];
		expect(arg?.where).toEqual({ id: { in: ["u1", "u2"] }, deletedAt: null });
	});

	test("filters out null actorIds in the where clause and short-circuits when group is empty", async () => {
		vi.mocked(prisma.activityLog.groupBy).mockResolvedValue([] as never);

		const result = await getTopRecognisers(30, 10);

		expect(result).toEqual([]);
		expect(prisma.user.findMany).not.toHaveBeenCalled();
		const arg = vi.mocked(prisma.activityLog.groupBy).mock.calls[0]?.[0];
		expect(arg?.where?.action).toBe("CARD_CREATED");
		expect(arg?.where?.actorId).toEqual({ not: null });
	});

	test("returns empty array when daysBack <= 0", async () => {
		const result = await getTopRecognisers(0, 10);
		expect(result).toEqual([]);
		expect(prisma.activityLog.groupBy).not.toHaveBeenCalled();
	});

	test("returns empty array when limit <= 0 without doing any DB work", async () => {
		// Regression guard against `slice(0, -n)` returning all-but-last n
		// silently. Caller asking for "0 results" should get [].
		const result = await getTopRecognisers(30, 0);
		expect(result).toEqual([]);
		expect(prisma.activityLog.groupBy).not.toHaveBeenCalled();
		expect(prisma.user.findMany).not.toHaveBeenCalled();

		const negative = await getTopRecognisers(30, -3);
		expect(negative).toEqual([]);
	});
});

describe("getCategoryMix", () => {
	test("counts categories from TICKET_CREATED metadata, sorted by count desc", async () => {
		vi.mocked(prisma.activityLog.findMany).mockResolvedValue([
			{ metadata: { category: "HR" } },
			{ metadata: { category: "HR" } },
			{ metadata: { category: "PAYROLL" } },
			{ metadata: { category: "HR" } },
			{ metadata: { category: "IT_WEBSITE" } },
		] as never);

		const result = await getCategoryMix(30);

		// First three sorted by count desc; remaining two zero-fill alphabetically.
		expect(result).toEqual([
			{ category: "HR", count: 3 },
			{ category: "IT_WEBSITE", count: 1 },
			{ category: "PAYROLL", count: 1 },
			{ category: "FACILITIES", count: 0 },
			{ category: "OTHER", count: 0 },
		]);
	});

	test("always returns all five categories even when no events match", async () => {
		vi.mocked(prisma.activityLog.findMany).mockResolvedValue([] as never);

		const result = await getCategoryMix(30);

		expect(result.map((r) => r.category).sort()).toEqual([
			"FACILITIES",
			"HR",
			"IT_WEBSITE",
			"OTHER",
			"PAYROLL",
		]);
		expect(result.every((r) => r.count === 0)).toBe(true);
	});

	test("ignores rows whose metadata.category is missing or unknown", async () => {
		vi.mocked(prisma.activityLog.findMany).mockResolvedValue([
			{ metadata: null },
			{ metadata: {} },
			{ metadata: { category: 42 } }, // wrong type
			{ metadata: { category: "BOGUS" } }, // not a real enum
			{ metadata: { category: "HR" } },
		] as never);

		const result = await getCategoryMix(30);

		const hr = result.find((r) => r.category === "HR");
		expect(hr?.count).toBe(1);
		// The garbage rows shouldn't have leaked a "BOGUS" entry into the result.
		expect(result.map((r) => r.category)).not.toContain("BOGUS");
	});

	test("filters by action=TICKET_CREATED with the right time bound", async () => {
		vi.mocked(prisma.activityLog.findMany).mockResolvedValue([] as never);

		await getCategoryMix(7);

		const arg = vi.mocked(prisma.activityLog.findMany).mock.calls[0]?.[0];
		expect(arg?.where?.action).toBe("TICKET_CREATED");
		expect((arg?.where?.createdAt as { gte?: Date })?.gte?.toISOString()).toBe(
			"2026-04-18T16:00:00.000Z",
		);
	});

	test("returns empty array when daysBack <= 0", async () => {
		const result = await getCategoryMix(0);
		expect(result).toEqual([]);
		expect(prisma.activityLog.findMany).not.toHaveBeenCalled();
	});
});

describe("getMostEngagedCards", () => {
	const userA = {
		id: "uA",
		firstName: "Ann",
		lastName: "Lee",
		avatar: null,
		deletedAt: null,
	};
	const userB = {
		id: "uB",
		firstName: "Bea",
		lastName: "Cruz",
		avatar: null,
		deletedAt: null,
	};
	const userDeleted = {
		id: "uD",
		firstName: "Del",
		lastName: "Eted",
		avatar: null,
		deletedAt: new Date("2026-04-01T00:00:00.000Z"),
	};

	test("merges reaction groups + comment metadata, sorts by total desc", async () => {
		vi.mocked(prisma.activityLog.groupBy).mockResolvedValue([
			{ targetId: "card1", _count: { _all: 3 } },
			{ targetId: "card2", _count: { _all: 1 } },
		] as never);
		vi.mocked(prisma.activityLog.findMany).mockResolvedValue([
			{ metadata: { cardId: "card1" } },
			{ metadata: { cardId: "card1" } },
			{ metadata: { cardId: "card2" } },
			{ metadata: { cardId: "card3" } },
		] as never);
		vi.mocked(prisma.recognitionCard.findMany).mockResolvedValue([
			{
				id: "card1",
				message: "Great work",
				createdAt: new Date("2026-04-20T00:00:00.000Z"),
				sender: userA,
				recipient: userB,
			},
			{
				id: "card2",
				message: "Nice job",
				createdAt: new Date("2026-04-21T00:00:00.000Z"),
				sender: userA,
				recipient: userB,
			},
			{
				id: "card3",
				message: "Solo comment",
				createdAt: new Date("2026-04-22T00:00:00.000Z"),
				sender: userA,
				recipient: userB,
			},
		] as never);

		const result = await getMostEngagedCards(30, 10);

		// card1: 3 reactions + 2 comments = 5; card2: 1 + 1 = 2; card3: 0 + 1 = 1
		expect(result.map((r) => ({ id: r.cardId, total: r.total }))).toEqual([
			{ id: "card1", total: 5 },
			{ id: "card2", total: 2 },
			{ id: "card3", total: 1 },
		]);
		expect(result[0]?.reactions).toBe(3);
		expect(result[0]?.comments).toBe(2);
	});

	test("counts comment-only cards even when no reactions exist", async () => {
		vi.mocked(prisma.activityLog.groupBy).mockResolvedValue([] as never);
		vi.mocked(prisma.activityLog.findMany).mockResolvedValue([
			{ metadata: { cardId: "cardX" } },
			{ metadata: { cardId: "cardX" } },
		] as never);
		vi.mocked(prisma.recognitionCard.findMany).mockResolvedValue([
			{
				id: "cardX",
				message: "m",
				createdAt: new Date("2026-04-20T00:00:00.000Z"),
				sender: userA,
				recipient: userB,
			},
		] as never);

		const result = await getMostEngagedCards(30, 5);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ cardId: "cardX", reactions: 0, comments: 2, total: 2 });
	});

	test("ignores comment rows with missing/wrong-type metadata.cardId", async () => {
		vi.mocked(prisma.activityLog.groupBy).mockResolvedValue([] as never);
		vi.mocked(prisma.activityLog.findMany).mockResolvedValue([
			{ metadata: null },
			{ metadata: {} },
			{ metadata: { cardId: 42 } },
			{ metadata: { cardId: "" } },
			{ metadata: { cardId: "good" } },
		] as never);
		vi.mocked(prisma.recognitionCard.findMany).mockResolvedValue([
			{
				id: "good",
				message: "m",
				createdAt: new Date("2026-04-20T00:00:00.000Z"),
				sender: userA,
				recipient: userB,
			},
		] as never);

		const result = await getMostEngagedCards(30, 5);
		expect(result).toHaveLength(1);
		expect(result[0]?.cardId).toBe("good");
	});

	test("respects the limit parameter", async () => {
		vi.mocked(prisma.activityLog.groupBy).mockResolvedValue([
			{ targetId: "c1", _count: { _all: 5 } },
			{ targetId: "c2", _count: { _all: 4 } },
			{ targetId: "c3", _count: { _all: 3 } },
		] as never);
		vi.mocked(prisma.activityLog.findMany).mockResolvedValue([] as never);
		vi.mocked(prisma.recognitionCard.findMany).mockResolvedValue([
			{ id: "c1", message: "", createdAt: new Date(), sender: userA, recipient: userB },
			{ id: "c2", message: "", createdAt: new Date(), sender: userA, recipient: userB },
		] as never);

		const result = await getMostEngagedCards(30, 2);
		expect(result.map((r) => r.cardId)).toEqual(["c1", "c2"]);
	});

	test("skips cards whose row is missing (raced delete)", async () => {
		vi.mocked(prisma.activityLog.groupBy).mockResolvedValue([
			{ targetId: "alive", _count: { _all: 2 } },
			{ targetId: "gone", _count: { _all: 5 } },
		] as never);
		vi.mocked(prisma.activityLog.findMany).mockResolvedValue([] as never);
		vi.mocked(prisma.recognitionCard.findMany).mockResolvedValue([
			{ id: "alive", message: "", createdAt: new Date(), sender: userA, recipient: userB },
		] as never);

		const result = await getMostEngagedCards(30, 5);
		expect(result.map((r) => r.cardId)).toEqual(["alive"]);
	});

	test("backfills from lower-ranked live cards when the top card was deleted", async () => {
		// Regression: previously sliced to limit *before* the card lookup, so a
		// deleted top-ranked card silently shrank (or emptied) the result.
		// limit=1 + top card "gone" missing + lower card "alive" present should
		// still return one row — the live one — not an empty list.
		vi.mocked(prisma.activityLog.groupBy).mockResolvedValue([
			{ targetId: "gone", _count: { _all: 10 } },
			{ targetId: "alive", _count: { _all: 3 } },
		] as never);
		vi.mocked(prisma.activityLog.findMany).mockResolvedValue([] as never);
		vi.mocked(prisma.recognitionCard.findMany).mockResolvedValue([
			{
				id: "alive",
				message: "still here",
				createdAt: new Date(),
				sender: userA,
				recipient: userB,
			},
		] as never);

		const result = await getMostEngagedCards(30, 1);
		expect(result).toHaveLength(1);
		expect(result[0]?.cardId).toBe("alive");
	});

	test("nulls out soft-deleted sender/recipient rather than dropping the card", async () => {
		vi.mocked(prisma.activityLog.groupBy).mockResolvedValue([
			{ targetId: "c1", _count: { _all: 3 } },
		] as never);
		vi.mocked(prisma.activityLog.findMany).mockResolvedValue([] as never);
		vi.mocked(prisma.recognitionCard.findMany).mockResolvedValue([
			{
				id: "c1",
				message: "m",
				createdAt: new Date(),
				sender: userDeleted,
				recipient: userB,
			},
		] as never);

		const result = await getMostEngagedCards(30, 5);
		expect(result).toHaveLength(1);
		expect(result[0]?.sender).toBeNull();
		expect(result[0]?.recipient).toEqual({
			id: "uB",
			firstName: "Bea",
			lastName: "Cruz",
			avatar: null,
		});
	});

	test("returns empty array when daysBack <= 0 or limit <= 0 with no DB work", async () => {
		expect(await getMostEngagedCards(0, 5)).toEqual([]);
		expect(await getMostEngagedCards(30, 0)).toEqual([]);
		expect(prisma.activityLog.groupBy).not.toHaveBeenCalled();
		expect(prisma.activityLog.findMany).not.toHaveBeenCalled();
		expect(prisma.recognitionCard.findMany).not.toHaveBeenCalled();
	});

	test("filters reactions by action=CARD_REACTED only (not CARD_UNREACTED)", async () => {
		// Regression guard: the contract that this card counts attention-adds
		// and not toggle-removes lives only in code comments. If the action
		// filter is broadened, this test fails.
		vi.mocked(prisma.activityLog.groupBy).mockResolvedValue([] as never);
		vi.mocked(prisma.activityLog.findMany).mockResolvedValue([] as never);

		await getMostEngagedCards(30, 5);

		const groupArg = vi.mocked(prisma.activityLog.groupBy).mock.calls[0]?.[0];
		expect(groupArg?.where?.action).toBe("CARD_REACTED");
		expect(groupArg?.where?.targetType).toBe("recognition_card");

		const commentArg = vi.mocked(prisma.activityLog.findMany).mock.calls[0]?.[0];
		expect(commentArg?.where?.action).toBe("COMMENT_CREATED");
	});

	test("breaks total ties by cardId lexicographically", async () => {
		vi.mocked(prisma.activityLog.groupBy).mockResolvedValue([
			{ targetId: "zeta", _count: { _all: 4 } },
			{ targetId: "alpha", _count: { _all: 4 } },
			{ targetId: "mike", _count: { _all: 4 } },
		] as never);
		vi.mocked(prisma.activityLog.findMany).mockResolvedValue([] as never);
		vi.mocked(prisma.recognitionCard.findMany).mockResolvedValue([
			{ id: "alpha", message: "", createdAt: new Date(), sender: userA, recipient: userB },
			{ id: "mike", message: "", createdAt: new Date(), sender: userA, recipient: userB },
			{ id: "zeta", message: "", createdAt: new Date(), sender: userA, recipient: userB },
		] as never);

		const result = await getMostEngagedCards(30, 10);
		expect(result.map((r) => r.cardId)).toEqual(["alpha", "mike", "zeta"]);
	});
});
