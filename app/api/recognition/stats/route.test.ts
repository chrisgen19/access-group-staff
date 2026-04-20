import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/lib/auth-utils", () => ({
	requireSession: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
	prisma: {
		recognitionCard: { count: vi.fn(), groupBy: vi.fn() },
		user: { findMany: vi.fn() },
	},
}));

vi.mock("@/lib/actions/settings-actions", () => ({
	getLeaderboardVisibilitySettings: vi.fn(),
	getTopRecognizedLimit: vi.fn(),
}));

vi.mock("@/lib/leaderboard/snapshot", () => ({
	maybeSnapshotPreviousMonth: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/leaderboard/visibility", () => ({
	computeLeaderboardVisibility: vi.fn(),
}));

vi.mock("@/lib/leaderboard/month", () => ({
	getCurrentMonthBoundaries: vi.fn(),
}));

import {
	getLeaderboardVisibilitySettings,
	getTopRecognizedLimit,
} from "@/lib/actions/settings-actions";
import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { getCurrentMonthBoundaries } from "@/lib/leaderboard/month";
import { computeLeaderboardVisibility } from "@/lib/leaderboard/visibility";
import { GET } from "./route";

const USER_ID = "user_123";
const START = new Date("2026-04-01T00:00:00Z");
const END = new Date("2026-05-01T00:00:00Z");

function mockVisible(visible: boolean) {
	vi.mocked(computeLeaderboardVisibility).mockReturnValue({
		visible,
		mode: "always",
		revealStart: null,
		revealEnd: null,
	});
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(requireSession).mockResolvedValue({
		user: { id: USER_ID },
		session: { id: "sess_1" },
	} as unknown as Awaited<ReturnType<typeof requireSession>>);
	vi.mocked(getCurrentMonthBoundaries).mockReturnValue({
		start: START,
		end: END,
		year: 2026,
		month: 3,
		daysInMonth: 30,
	});
	vi.mocked(getLeaderboardVisibilitySettings).mockResolvedValue({
		mode: "always",
		revealDays: 3,
		customStart: null,
		customEnd: null,
	});
	vi.mocked(getTopRecognizedLimit).mockResolvedValue(5);
	vi.mocked(prisma.recognitionCard.count).mockResolvedValue(0);
	vi.mocked(prisma.recognitionCard.groupBy).mockResolvedValue([] as never);
	vi.mocked(prisma.user.findMany).mockResolvedValue([]);
});

describe("GET /api/recognition/stats", () => {
	test("returns 401 when unauthenticated", async () => {
		vi.mocked(requireSession).mockRejectedValueOnce(new Error("unauthorized"));

		const res = await GET();

		expect(res.status).toBe(401);
		const body = await res.json();
		expect(body).toEqual({ success: false, error: "Unauthorized" });
	});

	test("scopes sent, received, and monthlyTotal to the current month", async () => {
		mockVisible(true);
		vi.mocked(prisma.recognitionCard.count)
			.mockResolvedValueOnce(7) // sent
			.mockResolvedValueOnce(4) // received
			.mockResolvedValueOnce(42); // monthlyTotal

		const res = await GET();
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.success).toBe(true);
		expect(body.data.sent).toBe(7);
		expect(body.data.received).toBe(4);
		expect(body.data.monthlyTotal).toBe(42);

		const calls = vi.mocked(prisma.recognitionCard.count).mock.calls;
		expect(calls[0]?.[0]).toEqual({
			where: { senderId: USER_ID, createdAt: { gte: START, lt: END } },
		});
		expect(calls[1]?.[0]).toEqual({
			where: { recipientId: USER_ID, createdAt: { gte: START, lt: END } },
		});
		expect(calls[2]?.[0]).toEqual({
			where: { createdAt: { gte: START, lt: END } },
		});
	});

	test("populates topRecipients when the leaderboard is visible", async () => {
		mockVisible(true);
		vi.mocked(prisma.recognitionCard.groupBy).mockResolvedValue([
			{ recipientId: "u1", _count: { recipientId: 5 } },
			{ recipientId: "u2", _count: { recipientId: 3 } },
		] as never);
		vi.mocked(prisma.user.findMany).mockResolvedValue([
			{ id: "u1", firstName: "Ada", lastName: "Lovelace", avatar: null },
			{ id: "u2", firstName: "Alan", lastName: "Turing", avatar: "avatar.png" },
		] as never);

		const res = await GET();
		const body = await res.json();

		expect(body.data.topRecipients).toEqual([
			{ firstName: "Ada", lastName: "Lovelace", avatar: null, count: 5 },
			{ firstName: "Alan", lastName: "Turing", avatar: "avatar.png", count: 3 },
		]);
		expect(body.data.leaderboardVisibility.visible).toBe(true);
	});

	test("omits topRecipients when the leaderboard is hidden", async () => {
		mockVisible(false);

		const res = await GET();
		const body = await res.json();

		expect(body.data.topRecipients).toEqual([]);
		expect(body.data.leaderboardVisibility.visible).toBe(false);
		expect(prisma.recognitionCard.groupBy).not.toHaveBeenCalled();
	});
});
