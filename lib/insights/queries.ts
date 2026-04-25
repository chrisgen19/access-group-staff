import { TicketCategory } from "@/app/generated/prisma/client";
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
			bCount === aCount ? aLabel.localeCompare(bLabel, "en") : bCount - aCount,
		)
		.map(([value, count]) => ({ value, count }));
}

export interface TopRecogniser {
	userId: string;
	firstName: string;
	lastName: string;
	avatar: string | null;
	count: number;
}

/**
 * Top recognisers by `CARD_CREATED` count over the last `daysBack` Manila
 * days, joined back to `User` for display. Sorted by count desc with name
 * tie-break.
 *
 * Excludes:
 * - Soft-deleted users (via `deletedAt: null` on the user lookup) — keeps
 *   the leaderboard consistent with the rest of the app's user-listing
 *   surfaces (`requireSession`, `getUsersAction`).
 * - Rows whose user row was missing entirely from the lookup. The schema
 *   has `actorId: SetNull on delete`, but the app currently soft-deletes
 *   only — so this branch is essentially a defensive guard for races and
 *   any future hard-delete path.
 */
export async function getTopRecognisers(daysBack = 30, limit = 10): Promise<TopRecogniser[]> {
	// Guard non-positive limit before any DB work — `slice(0, -n)` returns
	// all-but-last n items, which would silently produce wrong results
	// rather than the empty array a caller asking for "0 results" expects.
	// Mirrors the daysBack <= 0 short-circuit below.
	if (limit <= 0) return [];
	const days = recentManilaDayKeys(daysBack);
	const earliest = days[0];
	if (!earliest) return [];
	const since = manilaDayStartUtc(earliest);

	const grouped = await prisma.activityLog.groupBy({
		by: ["actorId"],
		where: {
			action: "CARD_CREATED",
			createdAt: { gte: since },
			actorId: { not: null },
		},
		_count: { _all: true },
	});

	if (grouped.length === 0) return [];

	const ids = grouped.map((g) => g.actorId).filter((id): id is string => id !== null);

	// Filter `deletedAt: null` to match the rest of the app (requireSession,
	// getUsersAction, etc.). Soft-deleted ex-employees still have user rows
	// and their CARD_CREATED audit events stay (actorId remains non-null until
	// hard-delete), so without this filter they'd silently show up on a live
	// admin leaderboard.
	const users = await prisma.user.findMany({
		where: { id: { in: ids }, deletedAt: null },
		select: { id: true, firstName: true, lastName: true, avatar: true },
	});
	const usersById = new Map(users.map((u) => [u.id, u]));

	return grouped
		.flatMap((g) => {
			if (g.actorId === null) return [];
			const user = usersById.get(g.actorId);
			// User soft-deleted between groupBy and findMany — skip rather than
			// surface a partial row. Their events stay in the audit log; they
			// just don't show on a current "top recognisers" leaderboard.
			if (!user) return [];
			return [
				{
					userId: user.id,
					firstName: user.firstName,
					lastName: user.lastName,
					avatar: user.avatar,
					count: g._count._all,
				},
			];
		})
		.sort((a, b) => {
			if (b.count !== a.count) return b.count - a.count;
			const an = `${a.firstName} ${a.lastName}`;
			const bn = `${b.firstName} ${b.lastName}`;
			return an.localeCompare(bn, "en");
		})
		.slice(0, limit);
}

export interface CategoryTally {
	category: TicketCategory;
	count: number;
}

const ALL_CATEGORIES: readonly TicketCategory[] = [
	TicketCategory.HR,
	TicketCategory.IT_WEBSITE,
	TicketCategory.PAYROLL,
	TicketCategory.FACILITIES,
	TicketCategory.OTHER,
];

/**
 * Tally of Help Me ticket categories created in the last `daysBack` Manila
 * days. Reads `metadata.category` from `TICKET_CREATED` events. Always
 * returns one entry per category, including zero-counts, so the chart
 * doesn't reshuffle between renders. Sorted by count desc with category
 * name tie-break.
 */
export async function getCategoryMix(daysBack = 30): Promise<CategoryTally[]> {
	const days = recentManilaDayKeys(daysBack);
	const earliest = days[0];
	if (!earliest) return [];
	const since = manilaDayStartUtc(earliest);

	const rows = await prisma.activityLog.findMany({
		where: { action: "TICKET_CREATED", createdAt: { gte: since } },
		select: { metadata: true },
	});

	const counts = new Map<TicketCategory, number>(ALL_CATEGORIES.map((c) => [c, 0]));
	for (const row of rows) {
		const meta = row.metadata as { category?: unknown } | null;
		const cat = meta?.category;
		if (typeof cat !== "string") continue;
		if (!ALL_CATEGORIES.includes(cat as TicketCategory)) continue;
		const key = cat as TicketCategory;
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}

	return Array.from(counts.entries())
		.map(([category, count]) => ({ category, count }))
		.sort((a, b) => {
			if (b.count !== a.count) return b.count - a.count;
			return a.category.localeCompare(b.category, "en");
		});
}
