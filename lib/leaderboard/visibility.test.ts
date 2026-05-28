import { describe, expect, test } from "vitest";
import { computeLeaderboardVisibility } from "./visibility";

// Asia/Manila is UTC+8 with no DST, so Manila midnight on day D is UTC (D-1) 16:00.
const WINDOW_1_TO_20 = { revealStartDay: 1, revealEndDay: 20 };

describe("computeLeaderboardVisibility", () => {
	test("is visible inside the window and points at the previous month", () => {
		// 2026-06-05 12:00 Manila
		const now = new Date("2026-06-05T04:00:00Z");
		const state = computeLeaderboardVisibility(WINDOW_1_TO_20, now);

		expect(state.visible).toBe(true);
		expect(state.sourceMonthKey).toBe("2026-05");
		// Window start = 2026-06-01 Manila, end exclusive = 2026-06-21 Manila.
		expect(state.revealStart.toISOString()).toBe("2026-05-31T16:00:00.000Z");
		expect(state.revealEnd.toISOString()).toBe("2026-06-20T16:00:00.000Z");
	});

	test("is locked before the window opens; next opening is this month", () => {
		// 2026-06-03 12:00 Manila, window opens day 5
		const now = new Date("2026-06-03T04:00:00Z");
		const state = computeLeaderboardVisibility({ revealStartDay: 5, revealEndDay: 20 }, now);

		expect(state.visible).toBe(false);
		// 2026-06-05 Manila
		expect(state.nextRevealStart.toISOString()).toBe("2026-06-04T16:00:00.000Z");
		expect(state.nextRevealStart.getTime()).toBe(state.revealStart.getTime());
	});

	test("is locked after the window closes; next opening rolls to next month", () => {
		// 2026-06-25 12:00 Manila, window already closed (ended day 20)
		const now = new Date("2026-06-25T04:00:00Z");
		const state = computeLeaderboardVisibility(WINDOW_1_TO_20, now);

		expect(state.visible).toBe(false);
		// 2026-07-01 Manila
		expect(state.nextRevealStart.toISOString()).toBe("2026-06-30T16:00:00.000Z");
	});

	test("rolls the year over when locked in December", () => {
		// 2026-12-25 12:00 Manila
		const now = new Date("2026-12-25T04:00:00Z");
		const state = computeLeaderboardVisibility(WINDOW_1_TO_20, now);

		expect(state.visible).toBe(false);
		expect(state.sourceMonthKey).toBe("2026-11");
		// 2027-01-01 Manila
		expect(state.nextRevealStart.toISOString()).toBe("2026-12-31T16:00:00.000Z");
	});

	test("clamps out-of-range days into 1..28 and keeps start <= end", () => {
		const now = new Date("2026-06-05T04:00:00Z");
		const state = computeLeaderboardVisibility({ revealStartDay: 40, revealEndDay: 0 }, now);

		// start clamps to 28, end = max(28, clamp(0->1)) = 28 → window is day 28 only.
		expect(state.revealStart.toISOString()).toBe("2026-06-27T16:00:00.000Z");
		expect(state.revealEnd.toISOString()).toBe("2026-06-28T16:00:00.000Z");
	});
});
