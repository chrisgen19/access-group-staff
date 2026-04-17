const TZ_OFFSET_HOURS = 8;
const TZ_OFFSET_MS = TZ_OFFSET_HOURS * 60 * 60 * 1000;

export interface MonthBoundaries {
	start: Date;
	end: Date;
	monthKey: string;
	year: number;
	month: number;
	daysInMonth: number;
}

export function toMonthKey(year: number, monthIndex: number): string {
	return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

export function parseMonthKey(key: string): { year: number; month: number } {
	const [yStr, mStr] = key.split("-");
	const year = Number.parseInt(yStr ?? "", 10);
	const month = Number.parseInt(mStr ?? "", 10) - 1;
	if (Number.isNaN(year) || Number.isNaN(month) || month < 0 || month > 11) {
		throw new Error(`Invalid month key: ${key}`);
	}
	return { year, month };
}

function getManilaParts(now: Date): { year: number; month: number } {
	const shifted = new Date(now.getTime() + TZ_OFFSET_MS);
	return {
		year: shifted.getUTCFullYear(),
		month: shifted.getUTCMonth(),
	};
}

function manilaMidnightToUtc(year: number, monthIndex: number, day: number): Date {
	return new Date(Date.UTC(year, monthIndex, day, 0, 0, 0, 0) - TZ_OFFSET_MS);
}

export function getMonthBoundariesForKey(monthKey: string): MonthBoundaries {
	const { year, month } = parseMonthKey(monthKey);
	const start = manilaMidnightToUtc(year, month, 1);
	const end = manilaMidnightToUtc(year, month + 1, 1);
	const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
	return { start, end, monthKey, year, month, daysInMonth };
}

export function getCurrentMonthBoundaries(now: Date = new Date()): MonthBoundaries {
	const { year, month } = getManilaParts(now);
	return getMonthBoundariesForKey(toMonthKey(year, month));
}

export function getPreviousMonthKey(now: Date = new Date()): string {
	const { year, month } = getManilaParts(now);
	const prevYear = month === 0 ? year - 1 : year;
	const prevMonth = month === 0 ? 11 : month - 1;
	return toMonthKey(prevYear, prevMonth);
}
