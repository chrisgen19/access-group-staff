import { getCurrentMonthBoundaries } from "./month";

export type LeaderboardVisibilityMode = "always" | "last_n_days_of_month" | "custom_range";

export const LEADERBOARD_VISIBILITY_MODES: LeaderboardVisibilityMode[] = [
	"always",
	"last_n_days_of_month",
	"custom_range",
];

export const REVEAL_DAYS_MIN = 1;
export const REVEAL_DAYS_MAX = 14;
export const REVEAL_DAYS_DEFAULT = 7;

export interface LeaderboardVisibilitySettings {
	mode: LeaderboardVisibilityMode;
	revealDays: number;
	customStart: string | null;
	customEnd: string | null;
}

export interface LeaderboardVisibilityState {
	visible: boolean;
	revealStart: Date | null;
	revealEnd: Date | null;
	mode: LeaderboardVisibilityMode;
}

const TZ_OFFSET_MS = 8 * 60 * 60 * 1000;

function manilaIsoDateToUtcStart(dateStr: string): Date | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
	if (!match) return null;
	const year = Number.parseInt(match[1] ?? "", 10);
	const month = Number.parseInt(match[2] ?? "", 10) - 1;
	const day = Number.parseInt(match[3] ?? "", 10);
	if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
		return null;
	}
	return new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - TZ_OFFSET_MS);
}

function manilaIsoDateToUtcEndExclusive(dateStr: string): Date | null {
	const start = manilaIsoDateToUtcStart(dateStr);
	if (!start) return null;
	return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

export function computeLeaderboardVisibility(
	settings: LeaderboardVisibilitySettings,
	now: Date = new Date(),
): LeaderboardVisibilityState {
	if (settings.mode === "always") {
		return {
			visible: true,
			revealStart: null,
			revealEnd: null,
			mode: "always",
		};
	}

	if (settings.mode === "last_n_days_of_month") {
		const { end: monthEnd, year, month, daysInMonth } = getCurrentMonthBoundaries(now);
		const clampedDays = Math.min(Math.max(settings.revealDays, REVEAL_DAYS_MIN), REVEAL_DAYS_MAX);
		const firstRevealDay = Math.max(1, daysInMonth - clampedDays + 1);
		const revealStart = new Date(Date.UTC(year, month, firstRevealDay, 0, 0, 0, 0) - TZ_OFFSET_MS);
		const visible = now.getTime() >= revealStart.getTime() && now.getTime() < monthEnd.getTime();
		return {
			visible,
			revealStart,
			revealEnd: monthEnd,
			mode: "last_n_days_of_month",
		};
	}

	const start = settings.customStart ? manilaIsoDateToUtcStart(settings.customStart) : null;
	const end = settings.customEnd ? manilaIsoDateToUtcEndExclusive(settings.customEnd) : null;

	if (!start || !end || end.getTime() <= start.getTime()) {
		return {
			visible: false,
			revealStart: null,
			revealEnd: null,
			mode: "custom_range",
		};
	}

	const visible = now.getTime() >= start.getTime() && now.getTime() < end.getTime();
	return {
		visible,
		revealStart: start,
		revealEnd: end,
		mode: "custom_range",
	};
}
