import { getCurrentMonthBoundaries, getPreviousMonthKey } from "./month";

export const REVEAL_DAY_MIN = 1;
// Cap at 28 so the reveal window always exists in every month (February-safe).
export const REVEAL_DAY_MAX = 28;
export const REVEAL_START_DAY_DEFAULT = 1;
export const REVEAL_END_DAY_DEFAULT = 20;
export const ALWAYS_VISIBLE_DEFAULT = false;

export interface LeaderboardVisibilitySettings {
	revealStartDay: number;
	revealEndDay: number;
	// Master switch: when on, the reveal window is bypassed entirely and the
	// panel stays unlocked. The days are still stored so turning it back off
	// restores the configured window.
	alwaysVisible: boolean;
}

export interface LeaderboardVisibilityState {
	visible: boolean;
	// Mirrors the setting so clients can skip the lock/unlock countdown, which
	// has no meaning when there is no boundary to reach.
	alwaysVisible: boolean;
	revealStart: Date;
	revealEnd: Date;
	// The next window opening — this month's if we haven't reached it yet,
	// otherwise next month's. Used for the "reveals in…" countdown when locked.
	nextRevealStart: Date;
	// The completed month whose winners the window reveals (previous calendar month).
	sourceMonthKey: string;
}

const TZ_OFFSET_MS = 8 * 60 * 60 * 1000;

function manilaMidnightToUtc(year: number, monthIndex: number, day: number): Date {
	return new Date(Date.UTC(year, monthIndex, day, 0, 0, 0, 0) - TZ_OFFSET_MS);
}

export function clampDay(value: number): number {
	if (!Number.isFinite(value)) return REVEAL_DAY_MIN;
	return Math.min(Math.max(Math.trunc(value), REVEAL_DAY_MIN), REVEAL_DAY_MAX);
}

export function computeLeaderboardVisibility(
	settings: LeaderboardVisibilitySettings,
	now: Date = new Date(),
): LeaderboardVisibilityState {
	const { year, month } = getCurrentMonthBoundaries(now);

	const startDay = clampDay(settings.revealStartDay);
	const endDay = Math.max(startDay, clampDay(settings.revealEndDay));

	const revealStart = manilaMidnightToUtc(year, month, startDay);
	// Exclusive upper bound: midnight after the inclusive end day.
	const revealEnd = manilaMidnightToUtc(year, month, endDay + 1);

	const t = now.getTime();
	const alwaysVisible = settings.alwaysVisible === true;
	const visible = alwaysVisible || (t >= revealStart.getTime() && t < revealEnd.getTime());

	// Before this month's window → it's still the next opening. At or after it
	// → the next opening is next month (Date.UTC rolls the year over).
	const nextRevealStart =
		t < revealStart.getTime() ? revealStart : manilaMidnightToUtc(year, month + 1, startDay);

	return {
		visible,
		alwaysVisible,
		revealStart,
		revealEnd,
		nextRevealStart,
		sourceMonthKey: getPreviousMonthKey(now),
	};
}
