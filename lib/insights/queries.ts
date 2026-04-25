import { prisma } from "@/lib/db";

const MANILA_TZ_OFFSET_MS = 8 * 60 * 60 * 1000;

/** YYYY-MM-DD for the given UTC instant in Manila local time. */
function manilaDayKey(date: Date): string {
	return new Date(date.getTime() + MANILA_TZ_OFFSET_MS).toISOString().slice(0, 10);
}

/** UTC instant equal to start-of-day in Manila for the given Manila day key. */
function manilaDayStartUtc(dayKey: string): Date {
	const [y, m, d] = dayKey.split("-").map(Number);
	return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1) - MANILA_TZ_OFFSET_MS);
}

/** N most-recent Manila day keys, oldest first, inclusive of today. */
function recentManilaDayKeys(count: number): string[] {
	const todayKey = manilaDayKey(new Date());
	const [y, m, d] = todayKey.split("-").map(Number);
	return Array.from({ length: count }, (_, i) => {
		const offsetDays = count - 1 - i;
		return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, (d ?? 1) - offsetDays))
			.toISOString()
			.slice(0, 10);
	});
}

export interface CadencePoint {
	day: string;
	count: number;
}

/**
 * Daily count of recognition cards created over the last `daysBack` Manila
 * days, oldest first, with empty days filled as `count: 0`.
 */
export async function getCardCadence(daysBack = 30): Promise<CadencePoint[]> {
	const days = recentManilaDayKeys(daysBack);
	const earliest = days[0];
	if (!earliest) return [];
	const since = manilaDayStartUtc(earliest);

	const rows = await prisma.activityLog.findMany({
		where: { action: "CARD_CREATED", createdAt: { gte: since } },
		select: { createdAt: true },
	});

	const buckets = new Map<string, number>(days.map((d) => [d, 0]));
	for (const row of rows) {
		const key = manilaDayKey(row.createdAt);
		// `findMany` may return rows just outside our window if a row was
		// created at the boundary in a TZ-shifted bucket; ignore those.
		if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
	}
	return days.map((d) => ({ day: d, count: buckets.get(d) ?? 0 }));
}

export interface ValueTally {
	value: string;
	count: number;
}

/**
 * Tally of company values picked across CARD_CREATED events over the last
 * `daysBack` Manila days. Reads `metadata.valuesPicked` (array of strings)
 * written by `createRecognitionCardAction`. Sorted by count desc.
 */
export async function getTopValues(daysBack = 30): Promise<ValueTally[]> {
	const days = recentManilaDayKeys(daysBack);
	const earliest = days[0];
	if (!earliest) return [];
	const since = manilaDayStartUtc(earliest);

	const rows = await prisma.activityLog.findMany({
		where: { action: "CARD_CREATED", createdAt: { gte: since } },
		select: { metadata: true },
	});

	const counts = new Map<string, number>();
	for (const row of rows) {
		const meta = row.metadata as { valuesPicked?: unknown } | null;
		const picked = meta?.valuesPicked;
		if (!Array.isArray(picked)) continue;
		for (const v of picked) {
			if (typeof v !== "string") continue;
			counts.set(v, (counts.get(v) ?? 0) + 1);
		}
	}
	return Array.from(counts.entries())
		.sort(([aLabel, aCount], [bLabel, bCount]) =>
			bCount === aCount ? aLabel.localeCompare(bLabel) : bCount - aCount,
		)
		.map(([value, count]) => ({ value, count }));
}
