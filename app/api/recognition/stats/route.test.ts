import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/lib/auth-utils", () => ({
	requireSession: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
	prisma: {
		recognitionCard: { count: vi.fn() },
	},
}));

vi.mock("@/lib/actions/settings-actions", () => ({
	getLeaderboardVisibilitySettings: vi.fn(),
	getTopRecognizedLimit: vi.fn(),
}));

vi.mock("@/lib/leaderboard/snapshot", () => ({
	maybeSnapshotPreviousMonth: vi.fn().mockResolvedValue(undefined),
	computeMonthRecipients: vi.fn(),
}));

vi.mock("@/lib/leaderboard/history", () => ({
	getArchivedRecipients: vi.fn(),
	formatMonthLabel: vi.fn(() => "April 2026"),
}));

vi.mock("@/lib/leaderboard/visibility", () => ({
	computeLeaderboardVisibility: vi.fn(),
}));

vi.mock("@/lib/leaderboard/month", () => ({
	getCurrentMonthBoundaries: vi.fn(),
	manilaDateStringToUtc: vi.fn(),
}));

import {
	getLeaderboardVisibilitySettings,
	getTopRecognizedLimit,
} from "@/lib/actions/settings-actions";
import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { getArchivedRecipients } from "@/lib/leaderboard/history";
import { getCurrentMonthBoundaries, manilaDateStringToUtc } from "@/lib/leaderboard/month";
import { computeMonthRecipients, maybeSnapshotPreviousMonth } from "@/lib/leaderboard/snapshot";
import { computeLeaderboardVisibility } from "@/lib/leaderboard/visibility";
import { GET } from "./route";

// "2026-06-01" parsed as Asia/Manila midnight.
const PREVIEW_MANILA = new Date("2026-05-31T16:00:00.000Z");

const USER_ID = "user_123";
const START = new Date("2026-05-01T00:00:00Z");
const END = new Date("2026-06-01T00:00:00Z");
const REVEAL_START = new Date("2026-05-01T00:00:00Z");
const REVEAL_END = new Date("2026-05-21T00:00:00Z");
const NEXT_REVEAL_START = new Date("2026-06-01T00:00:00Z");
const SOURCE_MONTH_KEY = "2026-04";
const REQUEST = new Request("http://localhost/api/recognition/stats");

function mockVisible(visible: boolean) {
	vi.mocked(computeLeaderboardVisibility).mockReturnValue({
		visible,
		revealStart: REVEAL_START,
		revealEnd: REVEAL_END,
		nextRevealStart: NEXT_REVEAL_START,
		sourceMonthKey: SOURCE_MONTH_KEY,
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
		monthKey: "2026-05",
		year: 2026,
		month: 4,
		daysInMonth: 31,
	});
	vi.mocked(getLeaderboardVisibilitySettings).mockResolvedValue({
		revealStartDay: 1,
		revealEndDay: 20,
	});
	vi.mocked(getTopRecognizedLimit).mockResolvedValue(5);
	vi.mocked(prisma.recognitionCard.count).mockResolvedValue(0);
	vi.mocked(getArchivedRecipients).mockResolvedValue([]);
	vi.mocked(computeMonthRecipients).mockResolvedValue([]);
});

describe("GET /api/recognition/stats", () => {
	test("returns 401 when unauthenticated", async () => {
		vi.mocked(requireSession).mockRejectedValueOnce(new Error("unauthorized"));

		const res = await GET(REQUEST);

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

		const res = await GET(REQUEST);
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.success).toBe(true);
		expect(body.data.sent).toBe(7);
		expect(body.data.received).toBe(4);
		expect(body.data.monthlyTotal).toBe(42);

		const calls = vi.mocked(prisma.recognitionCard.count).mock.calls;
		expect(calls[0]?.[0]).toEqual({
			where: {
				senderId: USER_ID,
				externalSenderName: null,
				createdAt: { gte: START, lt: END },
			},
		});
		expect(calls[1]?.[0]).toEqual({
			where: { recipientId: USER_ID, createdAt: { gte: START, lt: END } },
		});
		expect(calls[2]?.[0]).toEqual({
			where: { createdAt: { gte: START, lt: END } },
		});
	});

	test("reveals the previous month's archived winners when visible", async () => {
		mockVisible(true);
		vi.mocked(getArchivedRecipients).mockResolvedValue([
			{ userId: "u1", firstName: "Ada", lastName: "Lovelace", avatar: null, count: 5, rank: 1 },
			{
				userId: "u2",
				firstName: "Alan",
				lastName: "Turing",
				avatar: "avatar.png",
				count: 3,
				rank: 2,
			},
		]);

		const res = await GET(REQUEST);
		const body = await res.json();

		expect(getArchivedRecipients).toHaveBeenCalledWith(SOURCE_MONTH_KEY, 5);
		expect(body.data.topRecipients).toEqual([
			{ firstName: "Ada", lastName: "Lovelace", avatar: null, count: 5 },
			{ firstName: "Alan", lastName: "Turing", avatar: "avatar.png", count: 3 },
		]);
		expect(body.data.leaderboardVisibility.visible).toBe(true);
		expect(body.data.leaderboardVisibility.sourceMonthKey).toBe(SOURCE_MONTH_KEY);
	});

	test("omits topRecipients when the leaderboard is hidden", async () => {
		mockVisible(false);

		const res = await GET(REQUEST);
		const body = await res.json();

		expect(body.data.topRecipients).toEqual([]);
		expect(body.data.leaderboardVisibility.visible).toBe(false);
		expect(getArchivedRecipients).not.toHaveBeenCalled();
	});

	test("honors ?previewNow for a super admin but still snapshots with the real clock", async () => {
		mockVisible(true);
		vi.mocked(requireSession).mockResolvedValue({
			user: { id: USER_ID, role: "SUPERADMIN" },
			session: { id: "sess_1" },
		} as unknown as Awaited<ReturnType<typeof requireSession>>);
		vi.mocked(manilaDateStringToUtc).mockReturnValue(PREVIEW_MANILA);

		const before = Date.now();
		await GET(new Request("http://localhost/api/recognition/stats?previewNow=2026-06-01"));

		// Display/visibility use the preview clock (parsed as Manila midnight)…
		const passedNow = vi.mocked(computeLeaderboardVisibility).mock.calls[0]?.[1];
		expect(passedNow?.toISOString()).toBe(PREVIEW_MANILA.toISOString());

		// …but snapshotting must use the real clock, never the simulated date,
		// or a partial month could be frozen permanently.
		const snapshotNow = vi.mocked(maybeSnapshotPreviousMonth).mock.calls[0]?.[0];
		expect(snapshotNow?.getTime()).toBeGreaterThanOrEqual(before);
		expect(snapshotNow?.toISOString()).not.toBe(PREVIEW_MANILA.toISOString());
	});

	test("falls back to a live computation when the archive is missing for a regular user", async () => {
		mockVisible(true);
		// Default beforeEach session has no super-admin role and there is no
		// previewNow — this is the plain production path.
		vi.mocked(getArchivedRecipients).mockResolvedValue(null);
		vi.mocked(computeMonthRecipients).mockResolvedValue([
			{ userId: "u1", firstName: "Grace", lastName: "Hopper", avatar: null, count: 9, rank: 1 },
		]);

		const res = await GET(REQUEST);
		const body = await res.json();

		expect(computeMonthRecipients).toHaveBeenCalledWith(SOURCE_MONTH_KEY, 5);
		expect(body.data.topRecipients).toEqual([
			{ firstName: "Grace", lastName: "Hopper", avatar: null, count: 9 },
		]);
	});

	test("prefers the archived snapshot over the live fallback", async () => {
		mockVisible(true);
		vi.mocked(getArchivedRecipients).mockResolvedValue([
			{ userId: "u1", firstName: "Ada", lastName: "Lovelace", avatar: null, count: 5, rank: 1 },
		]);

		const res = await GET(REQUEST);
		const body = await res.json();

		expect(computeMonthRecipients).not.toHaveBeenCalled();
		expect(body.data.topRecipients).toEqual([
			{ firstName: "Ada", lastName: "Lovelace", avatar: null, count: 5 },
		]);
	});

	test("ignores ?previewNow for a non-super-admin", async () => {
		mockVisible(true);
		vi.mocked(requireSession).mockResolvedValue({
			user: { id: USER_ID, role: "MEMBER" },
			session: { id: "sess_1" },
		} as unknown as Awaited<ReturnType<typeof requireSession>>);

		const before = Date.now();
		await GET(new Request("http://localhost/api/recognition/stats?previewNow=2026-06-01"));

		const passedNow = vi.mocked(computeLeaderboardVisibility).mock.calls[0]?.[1];
		// Falls back to real "now", not the preview date.
		expect(passedNow?.getTime()).toBeGreaterThanOrEqual(before);
		expect(passedNow?.toISOString()).not.toBe(new Date("2026-06-01").toISOString());
	});
});
